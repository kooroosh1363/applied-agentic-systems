import { createHash } from 'node:crypto';

const SOURCE_TYPES = new Set(['search_query','competitor_post','audience_question','support_ticket','sales_note','trend_snapshot']);
const EVIDENCE_TYPES = new Set(['simulated','source_verified']);
const SENSITIVE = /\b(medical|health|legal|guarantee|guaranteed|investment|financial advice|cure|diagnos(?:e|is))\b/i;
const INJECTION = /ignore (?:all |the )?(?:previous|prior) instructions|system prompt|developer message|act as/i;

const clean = value => String(value ?? '').replace(/\s+/g,' ').trim();
const clamp = (value,min,max) => Math.min(max,Math.max(min,value));
const sha = value => createHash('sha256').update(value).digest('hex');
const tokens = value => new Set(clean(value).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,' ').split(/\s+/).filter(x=>x.length>2));

export function normalizeSignal(input) {
  if (!input || typeof input !== 'object') throw new Error('signal required');
  for (const key of ['sourceEventId','sourceType','title','text','observedAt']) if (!clean(input[key])) throw new Error(`missing ${key}`);
  const sourceType = clean(input.sourceType);
  if (!SOURCE_TYPES.has(sourceType)) throw new Error('unsupported source type');
  const observedAt = new Date(input.observedAt);
  if (Number.isNaN(observedAt.valueOf())) throw new Error('invalid observedAt');
  const evidenceType = clean(input.evidenceType || 'simulated');
  if (!EVIDENCE_TYPES.has(evidenceType)) throw new Error('invalid evidence type');
  const engagement = Number(input.engagement ?? 0);
  if (!Number.isFinite(engagement) || engagement < 0 || engagement > 1_000_000_000) throw new Error('invalid engagement');
  const sourceUrl = clean(input.sourceUrl);
  if (sourceUrl) {
    let url;
    try { url = new URL(sourceUrl); } catch { throw new Error('invalid source URL'); }
    if (!['http:','https:'].includes(url.protocol)) throw new Error('unsafe source URL');
  }
  return {schemaVersion:'1.0',sourceEventId:clean(input.sourceEventId),sourceType,title:clean(input.title).slice(0,300),text:clean(input.text).slice(0,10000),observedAt:observedAt.toISOString(),sourceUrl,audienceSegment:clean(input.audienceSegment || 'general').slice(0,100),engagement,evidenceType,tags:Array.isArray(input.tags)?input.tags.map(clean).filter(Boolean).slice(0,20):[]};
}

export const signalKey = signal => sha(`${signal.sourceType}:${signal.sourceEventId}`);
export function canonicalTopic(value) { return clean(value).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,' ').replace(/\s+/g,' ').trim(); }
export const topicKey = value => sha(`topic:${canonicalTopic(value)}`);

export function similarity(a,b) {
  const A=tokens(a),B=tokens(b); if(!A.size&&!B.size)return 1;
  const intersection=[...A].filter(x=>B.has(x)).length;
  return intersection/(A.size+B.size-intersection || 1);
}

export function deduplicateTopics(candidates, threshold=0.72) {
  const groups=[];
  for(const candidate of candidates){
    const title=clean(candidate.title); if(!title)continue;
    const existing=groups.find(group=>similarity(group.title,title)>=threshold);
    if(existing){existing.evidenceIds.push(...(candidate.evidenceIds??[]));existing.duplicates++;}
    else groups.push({...candidate,title,canonicalTitle:canonicalTopic(title),evidenceIds:[...(candidate.evidenceIds??[])],duplicates:0});
  }
  return groups.map(group=>({...group,evidenceIds:[...new Set(group.evidenceIds)]}));
}

export function inspectSignal(signal) {
  const combined=`${signal.title} ${signal.text}`;
  return {promptInjectionDetected:INJECTION.test(combined),sensitiveTopic:SENSITIVE.test(combined),treatAsUntrustedData:true};
}

export function brandFit(topic, policy={}) {
  const haystack=canonicalTopic(`${topic.title} ${topic.summary??''}`);
  const allowed=(policy.allowedThemes??[]).map(canonicalTopic);
  const excluded=(policy.excludedThemes??[]).map(canonicalTopic);
  const allowedHits=allowed.filter(x=>x&&haystack.includes(x)).length;
  const excludedHits=excluded.filter(x=>x&&haystack.includes(x)).length;
  const score=clamp(allowed.length?12+allowedHits*5:18,0,25)-Math.min(25,excludedHits*20);
  return {score:clamp(score,0,25),allowedHits,excludedHits,blocked:excludedHits>0};
}

export function scoreTopic(topic, evidence, policy={}, now=new Date()) {
  if(!Array.isArray(evidence)||!evidence.length)throw new Error('topic evidence required');
  const uniqueSources=new Set(evidence.map(x=>x.sourceType)).size;
  const verified=evidence.filter(x=>x.evidenceType==='source_verified').length;
  const questions=evidence.filter(x=>x.sourceType==='audience_question'||x.sourceType==='support_ticket').length;
  const repeats=evidence.length;
  const newest=Math.max(...evidence.map(x=>new Date(x.observedAt).valueOf()));
  const ageDays=Math.max(0,(now.valueOf()-newest)/86400000);
  const demand=clamp(5+questions*6+Math.min(8,repeats*2),0,25);
  const fit=brandFit(topic,policy);
  const evidenceQuality=clamp(uniqueSources*4+verified*4,0,20);
  const freshness=clamp(Math.round(15-ageDays/2),0,15);
  const businessAlignment=clamp(Number(topic.businessAlignment??8),0,15);
  const safety=evidence.map(inspectSignal);
  const injection=safety.some(x=>x.promptInjectionDetected);
  const sensitive=safety.some(x=>x.sensitiveTopic)||SENSITIVE.test(`${topic.title} ${topic.summary??''}`);
  const penalty=(injection?10:0)+(sensitive?10:0)+(fit.blocked?25:0);
  const total=clamp(Math.round(demand+fit.score+evidenceQuality+freshness+businessAlignment-penalty),0,100);
  const decision=fit.blocked?'rejected':sensitive||injection||total>=55?'needs_review':'backlog';
  return {topicKey:topicKey(topic.title),total,decision,dimensions:{demand,brandFit:fit.score,evidenceQuality,freshness,businessAlignment,penalty},flags:{sensitive,promptInjectionDetected:injection,excludedTheme:fit.blocked},evidenceCount:evidence.length,verifiedEvidenceCount:verified,explanation:`demand ${demand}/25; brand ${fit.score}/25; evidence ${evidenceQuality}/20; freshness ${freshness}/15; business ${businessAlignment}/15; penalty ${penalty}`};
}

const transitions={discovered:['scored','archived'],scored:['needs_review','backlog','rejected'],needs_review:['approved','rejected'],approved:['planned','archived'],backlog:['needs_review','archived'],planned:['published','archived'],published:['measured'],rejected:[],archived:[],measured:[]};
export function transitionTopic(topic,to,actor,role,now=new Date()) {
  if(!clean(actor))throw new Error('actor required');
  if(!(transitions[topic.status]??[]).includes(to))throw new Error(`invalid transition ${topic.status}->${to}`);
  if(['approved','rejected'].includes(to)&&role!=='content_reviewer')throw new Error('content reviewer required');
  return {...topic,status:to,lastActor:clean(actor),updatedAt:now.toISOString()};
}

export function recordPerformance(event) {
  if(!event||!clean(event.topicId)||!clean(event.channel)||!clean(event.eventId))throw new Error('performance identity required');
  const evidenceType=clean(event.evidenceType||'simulated');
  if(!EVIDENCE_TYPES.has(evidenceType))throw new Error('invalid evidence type');
  const impressions=Number(event.impressions??0),clicks=Number(event.clicks??0),conversions=Number(event.conversions??0);
  for(const [name,value] of Object.entries({impressions,clicks,conversions}))if(!Number.isInteger(value)||value<0)throw new Error(`invalid ${name}`);
  if(clicks>impressions||conversions>clicks)throw new Error('impossible performance funnel');
  return {idempotencyKey:sha(`${event.channel}:${event.eventId}`),topicId:clean(event.topicId),channel:clean(event.channel),impressions,clicks,conversions,evidenceType,ctr:impressions?clicks/impressions:0,conversionRate:clicks?conversions/clicks:0};
}

export function computeKpis(topics,performance) {
  const verified=performance.filter(x=>x.evidenceType==='source_verified');
  const impressions=verified.reduce((sum,x)=>sum+x.impressions,0),clicks=verified.reduce((sum,x)=>sum+x.clicks,0),conversions=verified.reduce((sum,x)=>sum+x.conversions,0);
  return {topicsScored:topics.length,reviewQueue:topics.filter(x=>x.status==='needs_review').length,approved:topics.filter(x=>['approved','planned','published','measured'].includes(x.status)).length,verifiedImpressions:impressions,verifiedCtr:impressions?clicks/impressions:0,verifiedConversions:conversions};
}

export function classifyDelivery(status,attempt,maxAttempts=3){if(status>=200&&status<300)return'delivered';if((status===429||status>=500)&&attempt<maxAttempts)return'retry';return'dlq';}
