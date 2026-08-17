import { createHash } from 'node:crypto';

export const CHANNELS = new Set(['email', 'whatsapp', 'instagram', 'webchat']);

const CATEGORY_RULES = {
  billing: ['invoice', 'charge', 'charged', 'refund', 'payment', 'bill'],
  technical: ['error', 'broken', 'not working', 'failed', 'offline', 'bug'],
  account: ['login', 'password', 'account', 'access', 'locked'],
  safety: ['unsafe', 'fire', 'smoke', 'gas', 'injury', 'emergency'],
  sales: ['price', 'quote', 'buy', 'plan', 'demo']
};

const SENSITIVE = ['password', 'credit card', 'card number', 'ssn', 'passport', 'medical', 'injury', 'gas leak'];

export function normalizeTicket(input, now = new Date()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('payload must be an object');
  const channel = clean(input.channel).toLowerCase();
  const sourceEventId = clean(input.sourceEventId);
  const customerId = clean(input.customerId);
  const message = clean(input.message);
  const subject = clean(input.subject);
  if (!CHANNELS.has(channel)) throw new RangeError('unsupported channel');
  if (!sourceEventId) throw new RangeError('sourceEventId is required');
  if (!customerId) throw new RangeError('customerId is required');
  if (!message) throw new RangeError('message is required');
  const receivedAt = input.receivedAt ? new Date(input.receivedAt) : now;
  if (Number.isNaN(receivedAt.getTime())) throw new RangeError('receivedAt must be an ISO date');
  return {
    schemaVersion: '1.0', channel, sourceEventId, customerId, subject, message,
    language: clean(input.language).toLowerCase() || 'en',
    receivedAt: receivedAt.toISOString(),
    metadata: safeMetadata(input.metadata)
  };
}

const clean = (value) => typeof value === 'string' ? value.trim() : '';
const safeMetadata = (value) => value && typeof value === 'object' && !Array.isArray(value)
  ? Object.fromEntries(Object.entries(value).filter(([, item]) => ['string', 'number', 'boolean'].includes(typeof item))) : {};

export function idempotencyKey(ticket) {
  return createHash('sha256').update(`${ticket.channel}:${ticket.sourceEventId}`).digest('hex');
}

export function redactPII(text) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_CARD]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[REDACTED_PHONE]');
}

export function classifyTicket(ticket) {
  const text = `${ticket.subject} ${ticket.message}`.toLowerCase();
  const ranked = Object.entries(CATEGORY_RULES).map(([category, terms]) => {
    const matches = terms.filter((term) => text.includes(term));
    return { category, matches, score: matches.length };
  }).sort((a, b) => b.score - a.score || a.category.localeCompare(b.category));
  const best = ranked[0];
  const category = best.score ? best.category : 'general';
  const sensitive = SENSITIVE.some((term) => text.includes(term));
  const confidence = best.score >= 2 ? 0.92 : best.score === 1 ? 0.74 : 0.35;
  const urgency = category === 'safety' ? 'critical' : /urgent|asap|immediately/.test(text) ? 'high' : 'normal';
  return { category, confidence, urgency, sensitive, evidence: best.matches };
}

const tokens = (text) => new Set(text.toLowerCase().match(/[a-z0-9]+/g) || []);

export function retrieveKnowledge(query, articles, limit = 3) {
  const queryTokens = tokens(query);
  return articles.map((article) => {
    const articleTokens = tokens(`${article.title} ${article.content} ${(article.tags || []).join(' ')}`);
    const overlap = [...queryTokens].filter((token) => articleTokens.has(token)).length;
    const score = queryTokens.size ? Math.min(1, overlap / Math.min(4, queryTokens.size)) : 0;
    return { id: article.id, title: article.title, content: article.content, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}

const TRANSITIONS = {
  new: new Set(['analyzed']),
  analyzed: new Set(['pending_approval', 'queued', 'escalated']),
  pending_approval: new Set(['approved', 'rejected']),
  approved: new Set(['queued']),
  queued: new Set(['delivered', 'queued', 'dlq']),
  escalated: new Set(['pending_approval', 'resolved']),
  rejected: new Set(), delivered: new Set(), dlq: new Set(), resolved: new Set()
};

export function canTransition(from, to) {
  return TRANSITIONS[from]?.has(to) ?? false;
}

export function buildDraft(ticket, classification, retrieval) {
  if (!retrieval.length) return { text: '', citations: [], groundingScore: 0 };
  const top = retrieval[0];
  const safeMessage = redactPII(ticket.message);
  return {
    text: `Thanks for contacting support. Based on ${top.title}: ${top.content} Your request was recorded as: ${safeMessage}`,
    citations: retrieval.map((item) => item.id),
    groundingScore: Math.min(1, top.score)
  };
}

export function decideRoute(classification, draft) {
  if (classification.sensitive || classification.urgency === 'critical') return { route: 'human_escalation', reason: 'sensitive_or_critical' };
  if (classification.confidence >= 0.85 && draft.groundingScore >= 0.35) return { route: 'auto_reply', reason: 'high_confidence_grounded' };
  if (classification.confidence >= 0.60 && draft.groundingScore > 0) return { route: 'approval_required', reason: 'medium_confidence' };
  return { route: 'human_escalation', reason: 'low_confidence_or_ungrounded' };
}

export function analyzeTicket(input, articles, now = new Date()) {
  const ticket = normalizeTicket(input, now);
  const classification = classifyTicket(ticket);
  const retrieval = retrieveKnowledge(`${ticket.subject} ${ticket.message}`, articles);
  const draft = buildDraft(ticket, classification, retrieval);
  const decision = decideRoute(classification, draft);
  return { ticket, idempotencyKey: idempotencyKey(ticket), classification, retrieval, draft, decision, evidenceType: 'simulated' };
}
