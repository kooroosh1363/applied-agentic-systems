import { createHash } from 'node:crypto';

const CHANNELS = new Set(['instagram', 'linkedin', 'facebook', 'x', 'email', 'web']);
const OUTCOMES = new Set(['lead_submitted', 'demo_booked', 'purchase_completed']);
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const sha = value => createHash('sha256').update(value).digest('hex');
const iso = value => { const d = new Date(value); if (Number.isNaN(d.getTime())) throw new Error('invalid timestamp'); return d.toISOString(); };

export function normalizeExperiment(input) {
  if (!input || typeof input !== 'object') throw new Error('experiment required');
  for (const key of ['experimentId', 'name', 'channel', 'primaryOutcome', 'startsAt', 'endsAt', 'owner', 'hypothesis']) if (!clean(input[key])) throw new Error(`missing ${key}`);
  if (!CHANNELS.has(input.channel)) throw new Error('unsupported channel');
  if (!OUTCOMES.has(input.primaryOutcome)) throw new Error('unsupported outcome');
  const startsAt = iso(input.startsAt), endsAt = iso(input.endsAt);
  if (new Date(endsAt) <= new Date(startsAt)) throw new Error('invalid experiment window');
  const windowHours = Number(input.conversionWindowHours ?? 168);
  if (!Number.isInteger(windowHours) || windowHours < 1 || windowHours > 24 * 90) throw new Error('invalid conversion window');
  if (!Array.isArray(input.variants) || input.variants.length !== 2) throw new Error('exactly two variants required');
  const variants = input.variants.map(v => ({ id: clean(v.id), contentVersionId: clean(v.contentVersionId), assetVersion: Number(v.assetVersion), isControl: v.isControl === true }));
  if (variants.some(v => !v.id || !v.contentVersionId || !Number.isInteger(v.assetVersion) || v.assetVersion < 1) || new Set(variants.map(v => v.id)).size !== 2 || variants.filter(v => v.isControl).length !== 1) throw new Error('invalid variants');
  const guardrails = input.guardrails ?? {};
  if (guardrails.consentRequired !== true) throw new Error('consent guardrail required');
  return { schemaVersion:'1.0', experimentId:clean(input.experimentId), name:clean(input.name), hypothesis:clean(input.hypothesis), channel:input.channel, primaryOutcome:input.primaryOutcome, startsAt, endsAt, conversionWindowHours:windowHours, owner:clean(input.owner), variants, audience:clean(input.audience || 'consented_anonymous'), guardrails:{consentRequired:true, excludeOverlappingExperiments:guardrails.excludeOverlappingExperiments !== false, minSamplePerVariant:Number(guardrails.minSamplePerVariant ?? 100)}, evidenceBoundary:input.evidenceBoundary === 'provider_verified' ? 'provider_verified' : 'simulated' };
}

export const experimentKey = exp => sha(`${exp.experimentId}:${exp.channel}:${exp.startsAt}:${exp.endsAt}`);
export const eventKey = event => sha(`${event.provider}:${event.providerEventId}`);

export function assignVariant(experimentInput, subjectId, salt='local-salt') {
  const exp=normalizeExperiment(experimentInput); if (!clean(subjectId)) throw new Error('subject identity required');
  const n=parseInt(sha(`${salt}:${exp.experimentId}:${clean(subjectId)}`).slice(0,8),16);
  return exp.variants[n % exp.variants.length].id;
}

export function validateLaunch(experimentInput, activeExperiments=[]) {
  const exp=normalizeExperiment(experimentInput); const findings=[];
  if (exp.variants.some(v => v.contentVersionId === exp.variants.find(x => x.isControl).contentVersionId && !v.isControl)) findings.push({code:'identical_content_versions',severity:'error'});
  for (const activeInput of activeExperiments) { const active=normalizeExperiment(activeInput); const overlaps=active.channel===exp.channel && new Date(active.startsAt)<new Date(exp.endsAt) && new Date(exp.startsAt)<new Date(active.endsAt); if (overlaps && exp.guardrails.excludeOverlappingExperiments) findings.push({code:'overlapping_channel_experiment',severity:'error',experimentId:active.experimentId}); }
  if (exp.guardrails.minSamplePerVariant < 30) findings.push({code:'min_sample_too_low',severity:'review'});
  return {passed:!findings.some(x=>x.severity==='error'),findings,key:experimentKey(exp)};
}

export function normalizeEvent(input, experimentInput) {
  const exp=normalizeExperiment(experimentInput); if (!input || typeof input!=='object') throw new Error('event required');
  for (const key of ['provider','providerEventId','subjectId','eventType','occurredAt','variantId']) if (!clean(input[key])) throw new Error(`missing ${key}`);
  if (!exp.variants.some(v=>v.id===input.variantId)) throw new Error('unknown variant');
  if (!['exposure','click','conversion'].includes(input.eventType)) throw new Error('unsupported event type');
  if (input.eventType==='conversion' && !OUTCOMES.has(input.outcome)) throw new Error('invalid conversion outcome');
  if (input.consent !== true) throw new Error('event consent required');
  const occurredAt=iso(input.occurredAt); if (new Date(occurredAt)<new Date(exp.startsAt)||new Date(occurredAt)>new Date(exp.endsAt)) throw new Error('event outside experiment window');
  // Normalized events can pass through attribution a second time. Preserve the
  // adapter-issued evidence label while accepting raw providerVerified only at intake.
  const evidence=(input.providerVerified===true||input.evidence==='provider_verified')?'provider_verified':'simulated';
  return {experimentId:exp.experimentId,provider:clean(input.provider),providerEventId:clean(input.providerEventId),key:eventKey(input),subjectId:clean(input.subjectId),eventType:input.eventType,variantId:clean(input.variantId),outcome:input.outcome??null,occurredAt,consent:true,amountMinor:input.amountMinor===undefined?null:Number(input.amountMinor),currency:clean(input.currency||''),evidence};
}

export function deduplicateEvents(events, experimentInput) { const seen=new Set(); const accepted=[]; const duplicates=[]; for(const raw of events){const e=normalizeEvent(raw,experimentInput);if(seen.has(e.key))duplicates.push(e);else {seen.add(e.key);accepted.push(e)}} return {accepted,duplicates}; }
export function validateAttribution(events, experimentInput) {
  const exp=normalizeExperiment(experimentInput); const bySubject=new Map(); const findings=[];
  for(const event of events){const e=normalizeEvent(event,exp);const list=bySubject.get(e.subjectId)??[];list.push(e);bySubject.set(e.subjectId,list)}
  const attributed=[]; for(const [subjectId,list] of bySubject){list.sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)); const exposure=list.find(x=>x.eventType==='exposure'); for(const conversion of list.filter(x=>x.eventType==='conversion')){if(!exposure){findings.push({code:'conversion_without_exposure',severity:'error',subjectId});continue} const delta=new Date(conversion.occurredAt)-new Date(exposure.occurredAt);if(delta>exp.conversionWindowHours*3600000){findings.push({code:'conversion_outside_window',severity:'review',subjectId});continue} if(exposure.variantId!==conversion.variantId){findings.push({code:'variant_identity_mismatch',severity:'error',subjectId});continue} attributed.push({...conversion,attribution:'experiment_exposure',exposureAt:exposure.occurredAt})}}
  return {attributed,findings};
}
function zCritical(){return 1.96}
export function analyzeExperiment(events, experimentInput) {
  const exp=normalizeExperiment(experimentInput);const {accepted}=deduplicateEvents(events,exp);const {attributed,findings}=validateAttribution(accepted,exp);const rows={};for(const v of exp.variants) rows[v.id]={variantId:v.id,isControl:v.isControl,exposures:new Set(),conversions:new Set(),verifiedConversions:0,verifiedRevenueMinor:0};
  for(const e of accepted) if(e.eventType==='exposure') rows[e.variantId].exposures.add(e.subjectId);
  for(const e of attributed){const r=rows[e.variantId];r.conversions.add(e.subjectId);if(e.evidence==='provider_verified'){r.verifiedConversions++; if(Number.isInteger(e.amountMinor)&&e.amountMinor>=0)r.verifiedRevenueMinor+=e.amountMinor}}
  const result=Object.values(rows).map(r=>({...r,exposures:r.exposures.size,conversions:r.conversions.size,conversionRate:r.exposures.size?r.conversions.size/r.exposures.size:0,meetsMinSample:r.exposures.size>=exp.guardrails.minSamplePerVariant})); const control=result.find(x=>x.isControl),treatment=result.find(x=>!x.isControl);let lift=null,significance={status:'insufficient_sample'};
  if(control.meetsMinSample&&treatment.meetsMinSample&&control.exposures&&treatment.exposures){lift=treatment.conversionRate-control.conversionRate;const pooled=(control.conversions+treatment.conversions)/(control.exposures+treatment.exposures);const se=Math.sqrt(pooled*(1-pooled)*(1/control.exposures+1/treatment.exposures));const z=se?lift/se:0;significance={status:Math.abs(z)>=zCritical()?'statistically_significant':'not_statistically_significant',z:Number(z.toFixed(3)),threshold:zCritical()};}
  return {experimentId:exp.experimentId,evidenceBoundary:exp.evidenceBoundary,variants:result,lift,significance,attributionFindings:findings,attributedConversions:attributed.length,simulatedBusinessOutcome:exp.evidenceBoundary!=='provider_verified'};
}

export function recommendNextAction(analysis) { if(analysis.significance.status==='statistically_significant'&&analysis.lift>0)return {action:'consider_rollout',reason:'treatment lift is statistically significant'}; if(analysis.significance.status==='statistically_significant'&&analysis.lift<=0)return {action:'retain_control',reason:'treatment did not improve the primary outcome'}; return {action:'continue_or_redesign',reason:'evidence is insufficient for rollout'}; }
