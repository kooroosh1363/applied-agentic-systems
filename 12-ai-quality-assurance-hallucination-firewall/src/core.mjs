import { createHash } from 'node:crypto';

const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const round = value => Number(value.toFixed(4));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const canonical = value => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};

export const DEFAULT_POLICY = Object.freeze({
  policyVersion: '1.0.0',
  blockOnInjection: true,
  blockOnScopeViolation: true,
  blockOnFabricatedCitation: true,
  requireCitationForFactualClaims: true,
  reviewOnStaleEvidence: true,
  reviewOnConflict: true,
  highRiskUnsupportedAction: 'block',
  standardUnsupportedAction: 'review',
  maxRetries: 2
});

export function normalizeRequest(raw) {
  for (const key of ['requestId', 'prompt', 'actorId']) if (!clean(raw?.[key])) throw new Error(`missing request ${key}`);
  const allowedScopes = [...new Set((raw.allowedScopes ?? ['public']).map(clean).filter(Boolean))];
  if (!allowedScopes.length) throw new Error('allowedScopes required');
  const domain = clean(raw.domain || 'general').toLowerCase();
  const riskTier = ['medical', 'legal', 'financial'].includes(domain) ? 'high' : ['security', 'hr'].includes(domain) ? 'medium' : 'standard';
  return { requestId: clean(raw.requestId), prompt: clean(raw.prompt), actorId: clean(raw.actorId), allowedScopes, domain, riskTier, locale: clean(raw.locale || 'en') };
}

export function normalizeEvidence(input) {
  if (!Array.isArray(input) || !input.length) throw new Error('evidence required');
  const ids = new Set();
  return input.map(raw => {
    for (const key of ['sourceId', 'title', 'text']) if (!clean(raw?.[key])) throw new Error(`missing evidence ${key}`);
    const sourceId = clean(raw.sourceId);
    if (ids.has(sourceId)) throw new Error('duplicate sourceId');
    ids.add(sourceId);
    const facts = (raw.facts ?? []).map((fact, index) => {
      if (!clean(fact?.factId)) throw new Error(`missing factId ${index}`);
      return { factId: clean(fact.factId), text: clean(fact.text), value: fact.value ?? null, unit: clean(fact.unit) };
    });
    return {
      sourceId, title: clean(raw.title), text: clean(raw.text), sourceUri: clean(raw.sourceUri),
      version: clean(raw.version || '1'), validUntil: clean(raw.validUntil),
      accessScopes: [...new Set((raw.accessScopes ?? ['public']).map(clean).filter(Boolean))], facts
    };
  });
}

export function scanText(value) {
  const text = clean(value);
  const findings = [];
  const patterns = [
    ['prompt_injection', /ignore (?:all|any|the|previous).*instructions/i, 'block'],
    ['prompt_injection', /reveal (?:the )?(?:system prompt|secret|token|password)/i, 'block'],
    ['prompt_injection', /<script\b/i, 'block'],
    ['pii_email', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, 'review'],
    ['pii_card', /\b(?:\d[ -]*?){13,19}\b/, 'block'],
    ['secret_pattern', /\b(?:api[_ -]?key|password|secret)\s*[:=]\s*\S+/i, 'block']
  ];
  for (const [code, pattern, severity] of patterns) if (pattern.test(text)) findings.push({ code, severity });
  return findings;
}

export function normalizeCandidate(raw) {
  if (!clean(raw?.responseId)) throw new Error('responseId required');
  const claims = (raw.claims ?? []).map((claim, index) => {
    for (const key of ['claimId', 'text']) if (!clean(claim?.[key])) throw new Error(`missing claim ${key} ${index}`);
    return {
      claimId: clean(claim.claimId), text: clean(claim.text), kind: clean(claim.kind || 'factual'),
      factId: clean(claim.factId), citationIds: [...new Set((claim.citationIds ?? []).map(clean).filter(Boolean))],
      value: claim.value ?? null, unit: clean(claim.unit)
    };
  });
  if (!claims.length && raw.abstained !== true) throw new Error('claims or abstention required');
  return { responseId: clean(raw.responseId), text: clean(raw.text), claims, abstained: raw.abstained === true, model: clean(raw.model || 'unknown') };
}

export function findEvidenceConflicts(evidenceInput) {
  const evidence = normalizeEvidence(evidenceInput);
  const byFact = new Map();
  for (const source of evidence) for (const fact of source.facts) {
    if (!byFact.has(fact.factId)) byFact.set(fact.factId, []);
    byFact.get(fact.factId).push({ sourceId: source.sourceId, value: fact.value, unit: fact.unit, text: fact.text });
  }
  const conflicts = [];
  for (const [factId, facts] of byFact) {
    const signatures = new Set(facts.map(f => JSON.stringify([f.value, f.unit, f.text.toLowerCase()])));
    if (signatures.size > 1) conflicts.push({ factId, evidence: facts });
  }
  return conflicts;
}

export function verifyCandidate(requestInput, evidenceInput, candidateInput, options = {}) {
  const request = normalizeRequest(requestInput);
  const evidence = normalizeEvidence(evidenceInput);
  const candidate = normalizeCandidate(candidateInput);
  const asOf = new Date(options.asOf || '2026-01-01T00:00:00.000Z');
  if (Number.isNaN(asOf.valueOf())) throw new Error('invalid asOf');
  const sourceMap = new Map(evidence.map(source => [source.sourceId, source]));
  const inputFindings = [...scanText(request.prompt), ...evidence.flatMap(source => scanText(source.text).map(f => ({ ...f, sourceId: source.sourceId })))];
  const conflicts = findEvidenceConflicts(evidence);
  const claimResults = candidate.claims.map(claim => {
    const findings = [];
    if (claim.kind === 'opinion') return { ...claim, supported: true, findings };
    if (!claim.citationIds.length) findings.push({ code: 'missing_citation', severity: request.riskTier === 'high' ? 'block' : 'review' });
    const cited = claim.citationIds.map(id => sourceMap.get(id)).filter(Boolean);
    if (cited.length !== claim.citationIds.length) findings.push({ code: 'fabricated_citation', severity: 'block' });
    for (const source of cited) {
      if (!source.accessScopes.some(scope => request.allowedScopes.includes(scope))) findings.push({ code: 'scope_violation', sourceId: source.sourceId, severity: 'block' });
      if (source.validUntil && new Date(source.validUntil) < asOf) findings.push({ code: 'stale_evidence', sourceId: source.sourceId, severity: 'review' });
    }
    const supportingFacts = cited.flatMap(source => source.facts.filter(fact => fact.factId === claim.factId).map(fact => ({ ...fact, sourceId: source.sourceId })));
    if (!claim.factId || !supportingFacts.length) findings.push({ code: 'unsupported_claim', severity: request.riskTier === 'high' ? 'block' : 'review' });
    if (supportingFacts.length && claim.value !== null) {
      if (!supportingFacts.some(fact => String(fact.value) === String(claim.value) && clean(fact.unit).toLowerCase() === claim.unit.toLowerCase())) findings.push({ code: 'numeric_or_unit_mismatch', severity: 'block' });
    }
    if (conflicts.some(conflict => conflict.factId === claim.factId)) findings.push({ code: 'conflicting_evidence', severity: 'review' });
    return { ...claim, supported: !findings.some(f => ['unsupported_claim','fabricated_citation','numeric_or_unit_mismatch','scope_violation'].includes(f.code)), findings };
  });
  const allFindings = [...inputFindings, ...claimResults.flatMap(result => result.findings.map(f => ({ ...f, claimId: result.claimId })))];
  let decision = 'allow';
  if (allFindings.some(f => f.severity === 'block')) decision = 'block';
  else if (allFindings.some(f => f.severity === 'review')) decision = 'review';
  if (candidate.abstained && !candidate.claims.length && !inputFindings.some(f => f.severity === 'block')) decision = 'allow_abstention';
  const safeResponse = decision === 'block' ? { text: 'I cannot provide a verified answer from the available authorized evidence.', reason: 'verification_failed' } : null;
  const summary = {
    claimCount: claimResults.length,
    supportedClaims: claimResults.filter(c => c.supported).length,
    supportRate: claimResults.length ? round(claimResults.filter(c => c.supported).length / claimResults.length) : 1,
    blockFindings: allFindings.filter(f => f.severity === 'block').length,
    reviewFindings: allFindings.filter(f => f.severity === 'review').length
  };
  return { requestId: request.requestId, responseId: candidate.responseId, decision, riskTier: request.riskTier, claimResults, findings: allFindings, summary, safeResponse, evidenceBoundary: 'simulated' };
}

export function planRetry(verification, attempt, policy = DEFAULT_POLICY) {
  if (!Number.isInteger(attempt) || attempt < 0) throw new Error('invalid attempt');
  if (verification.decision !== 'block') return { action: 'complete', attempt };
  const nonRetryable = verification.findings.some(f => ['prompt_injection','scope_violation','pii_card','secret_pattern'].includes(f.code));
  if (nonRetryable || attempt >= policy.maxRetries) return { action: 'dlq', attempt, reason: nonRetryable ? 'non_retryable_safety_failure' : 'retry_exhausted' };
  return { action: 'retry', attempt: attempt + 1, constraints: ['use_only_provided_evidence','cite_every_factual_claim','abstain_if_unsupported'] };
}

export function appendAuditEvent(chain, event) {
  const previousHash = chain.length ? chain.at(-1).hash : 'GENESIS';
  const payload = { sequence: chain.length + 1, previousHash, event };
  return [...chain, { ...payload, hash: sha256(canonical(payload)) }];
}

export function verifyAuditChain(chain) {
  let previousHash = 'GENESIS';
  for (let index = 0; index < chain.length; index++) {
    const { hash, ...payload } = chain[index];
    if (payload.sequence !== index + 1 || payload.previousHash !== previousHash || sha256(canonical(payload)) !== hash) return false;
    previousHash = hash;
  }
  return true;
}

export function scoreBenchmark(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('benchmark rows required');
  let tp=0, tn=0, fp=0, fn=0;
  for (const row of rows) {
    const predictedUnsafe = ['block','review'].includes(row.predicted);
    if (row.expectedUnsafe && predictedUnsafe) tp++; else if (!row.expectedUnsafe && !predictedUnsafe) tn++; else if (!row.expectedUnsafe) fp++; else fn++;
  }
  return { total: rows.length, tp, tn, fp, fn, precision: tp + fp ? round(tp/(tp+fp)) : 0, recall: tp + fn ? round(tp/(tp+fn)) : 0, falsePositiveRate: fp + tn ? round(fp/(fp+tn)) : 0, evidenceBoundary:'simulated' };
}
