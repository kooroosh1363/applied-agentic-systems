import { createHash } from 'node:crypto';

const CHANNELS = new Set(['instagram', 'linkedin', 'facebook', 'x']);
const FORMATS = new Set(['image', 'carousel', 'short_video', 'text']);
const ROLES = new Set(['author', 'brand_reviewer', 'compliance_reviewer', 'publisher', 'admin']);
const TERMINAL = new Set(['published', 'rejected', 'cancelled', 'dlq']);
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const sha = value => createHash('sha256').update(value).digest('hex');
const unique = values => [...new Set(values)];
const iso = value => { const d = new Date(value); if (Number.isNaN(d.getTime())) throw new Error('invalid timestamp'); return d.toISOString(); };

export function normalizePublication(input) {
  if (!input || typeof input !== 'object') throw new Error('publication required');
  for (const key of ['publicationId', 'contentVersionId', 'channel', 'format', 'caption', 'assetVersion', 'scheduledFor', 'requestedBy']) {
    if (!clean(input[key])) throw new Error(`missing ${key}`);
  }
  if (!CHANNELS.has(input.channel)) throw new Error('unsupported channel');
  if (!FORMATS.has(input.format)) throw new Error('unsupported format');
  if (!Number.isInteger(Number(input.assetVersion)) || Number(input.assetVersion) < 1) throw new Error('invalid asset version');
  if (!Array.isArray(input.utm) || !input.utm.length) throw new Error('utm attribution required');
  const utm = input.utm.map(x => clean(x)).filter(Boolean);
  if (utm.length !== input.utm.length || new Set(utm).size !== utm.length) throw new Error('invalid utm attribution');
  const tags = unique((input.tags ?? []).map(clean).filter(Boolean));
  const compliance = input.compliance ?? {};
  if (compliance.audienceConsent !== true) throw new Error('audience consent required');
  return {
    schemaVersion: '1.0', publicationId: clean(input.publicationId), contentVersionId: clean(input.contentVersionId),
    channel: input.channel, format: input.format, caption: clean(input.caption).slice(0, 5000),
    assetVersion: Number(input.assetVersion), assetRef: clean(input.assetRef || `asset://${input.publicationId}`),
    scheduledFor: iso(input.scheduledFor), timezone: clean(input.timezone || 'UTC'), requestedBy: clean(input.requestedBy),
    tags, utm, compliance: { audienceConsent: true, disclosurePresent: compliance.disclosurePresent === true, regulatedClaim: compliance.regulatedClaim === true, prohibitedTargeting: compliance.prohibitedTargeting === true },
    evidenceBoundary: input.evidenceBoundary === 'provider_verified' ? 'provider_verified' : 'simulated'
  };
}

export const publicationKey = publication => sha(`${publication.contentVersionId}:${publication.channel}:${publication.assetVersion}`);

export function createPublication(input, now = '2026-01-01T00:00:00.000Z') {
  const publication = normalizePublication(input);
  return { ...publication, key: publicationKey(publication), status: 'draft', revision: 1, approvals: [], audit: [{ at: iso(now), actor: publication.requestedBy, action: 'created', evidence: publication.evidenceBoundary }] };
}

export function validatePolicy(publication, policy) {
  const p = normalizePublication(publication);
  const rules = policy?.channels?.[p.channel];
  const findings = [];
  if (!rules) findings.push({ code: 'channel_policy_missing', severity: 'error' });
  else {
    if (!rules.allowedFormats.includes(p.format)) findings.push({ code: 'format_not_allowed', severity: 'error' });
    if (p.caption.length > rules.maxCaptionLength) findings.push({ code: 'caption_too_long', severity: 'error' });
    if (rules.disclosureRequired && !p.compliance.disclosurePresent) findings.push({ code: 'disclosure_missing', severity: 'error' });
  }
  if (p.compliance.prohibitedTargeting) findings.push({ code: 'prohibited_targeting', severity: 'error' });
  if (/guaranteed results|risk-free profit|درآمد تضمینی/i.test(p.caption)) findings.push({ code: 'prohibited_claim', severity: 'error' });
  if (/\b(?:\+?\d[\d\s().-]{7,}\d|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i.test(p.caption)) findings.push({ code: 'pii_in_caption', severity: 'error' });
  if (/ignore (?:all |the )?(?:previous|prior) instructions|system prompt/i.test(p.caption)) findings.push({ code: 'prompt_injection_content', severity: 'error' });
  const requiredRoles = unique(['brand_reviewer', ...(p.compliance.regulatedClaim ? ['compliance_reviewer'] : [])]);
  return { passed: !findings.some(x => x.severity === 'error'), findings, requiredRoles };
}

const next = { draft: ['policy_checked', 'cancelled'], policy_checked: ['needs_review', 'rejected', 'cancelled'], needs_review: ['approved', 'rejected'], approved: ['scheduled', 'cancelled'], scheduled: ['publishing', 'cancelled'], publishing: ['published', 'retrying', 'dlq'], retrying: ['publishing', 'dlq'], published: [], rejected: [], cancelled: [], dlq: [] };

export function transition(record, to, { actor, role, at = '2026-01-01T00:00:00.000Z', policyResult, requiredRoles = [] } = {}) {
  if (!record || TERMINAL.has(record.status)) throw new Error('terminal or missing record');
  if (!next[record.status]?.includes(to)) throw new Error(`invalid transition ${record.status}->${to}`);
  if (!clean(actor) || !ROLES.has(role)) throw new Error('valid actor role required');
  if (to === 'policy_checked' && !policyResult) throw new Error('policy result required');
  if (to === 'needs_review' && policyResult?.passed !== true) throw new Error('failed policy cannot be reviewed');
  const approvals = [...record.approvals];
  if (to === 'approved') {
    if (!['brand_reviewer', 'compliance_reviewer'].includes(role)) throw new Error('reviewer role required');
    approvals.push({ role, actor: clean(actor), at: iso(at), status: 'approved', revision: record.revision });
    const approvedRoles = new Set(approvals.filter(x => x.status === 'approved' && x.revision === record.revision).map(x => x.role));
    const missing = requiredRoles.filter(x => !approvedRoles.has(x));
    if (missing.length) return { ...record, approvals, audit: [...record.audit, { at: iso(at), actor, role, action: 'approval_recorded', missing }], status: 'needs_review' };
  }
  if (to === 'scheduled' && role !== 'publisher') throw new Error('publisher role required');
  return { ...record, status: to, approvals, audit: [...record.audit, { at: iso(at), actor: clean(actor), role, action: to }] };
}

export function reschedule(record, scheduledFor, { actor, role, at = '2026-01-01T00:00:00.000Z' } = {}) {
  if (!['draft', 'policy_checked', 'needs_review', 'approved', 'scheduled'].includes(record.status)) throw new Error('cannot reschedule status');
  if (!['author', 'publisher', 'admin'].includes(role)) throw new Error('reschedule role required');
  return { ...record, scheduledFor: iso(scheduledFor), revision: record.revision + 1, status: 'draft', approvals: [], audit: [...record.audit, { at: iso(at), actor: clean(actor), role, action: 'rescheduled_reapproval_required' }] };
}

export function planSchedule(records, policy, now = '2026-01-01T00:00:00.000Z') {
  const time = new Date(now).getTime(); const byChannel = new Map(); const accepted = []; const blocked = [];
  for (const record of [...records].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))) {
    if (record.status !== 'approved') { blocked.push({ publicationId: record.publicationId, reason: 'not_approved' }); continue; }
    if (new Date(record.scheduledFor).getTime() < time) { blocked.push({ publicationId: record.publicationId, reason: 'scheduled_in_past' }); continue; }
    const prior = byChannel.get(record.channel) ?? []; const min = (policy.channels[record.channel]?.minimumIntervalMinutes ?? 60) * 60000;
    if (prior.some(x => Math.abs(new Date(x.scheduledFor).getTime() - new Date(record.scheduledFor).getTime()) < min)) { blocked.push({ publicationId: record.publicationId, reason: 'rate_interval' }); continue; }
    prior.push(record); byChannel.set(record.channel, prior); accepted.push(record.publicationId);
  }
  return { accepted, blocked };
}

export function classifyProviderResult({ status, attempt, maxAttempts = 3 }) {
  if (status >= 200 && status < 300) return 'published';
  if ((status === 429 || status >= 500) && attempt < maxAttempts) return 'retrying';
  return 'dlq';
}

export function createDeliveryEvidence(record, result, attempt) {
  const outcome = classifyProviderResult({ ...result, attempt });
  return { publicationId: record.publicationId, key: record.key, revision: record.revision, channel: record.channel, outcome, attempt, providerStatus: result.status, providerPostId: result.providerPostId ?? null, evidence: result.providerPostId ? 'provider_verified' : 'simulated', fingerprint: sha(JSON.stringify({ key: record.key, revision: record.revision, result, attempt })) };
}

export function computeKpis(events) {
  const scheduled = events.filter(x => x.type === 'scheduled').length;
  const published = events.filter(x => x.type === 'published').length;
  const dlq = events.filter(x => x.type === 'dlq').length;
  const verified = events.filter(x => x.type === 'published' && x.evidence === 'provider_verified').length;
  return { scheduled, published, dlq, publishSuccessRate: scheduled ? published / scheduled : 0, providerVerifiedPublications: verified, simulatedBusinessOutcome: false };
}
