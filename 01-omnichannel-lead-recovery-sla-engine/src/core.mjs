import { createHash } from 'node:crypto';

export const CHANNELS = new Set(['web', 'email', 'instagram', 'whatsapp', 'phone']);

const clean = (value) => typeof value === 'string' ? value.trim() : '';
const cleanEmail = (value) => clean(value).toLowerCase();
const cleanPhone = (value) => clean(value).replace(/[^+\d]/g, '');

export function normalizeLead(input, now = new Date()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('payload must be an object');
  }

  const channel = clean(input.channel).toLowerCase();
  if (!CHANNELS.has(channel)) throw new RangeError('unsupported channel');

  const sourceEventId = clean(input.sourceEventId);
  const email = cleanEmail(input.email);
  const phone = cleanPhone(input.phone);
  const message = clean(input.message);
  const name = clean(input.name);

  if (!sourceEventId) throw new RangeError('sourceEventId is required');
  if (!email && !phone) throw new RangeError('email or phone is required');
  if (!message) throw new RangeError('message is required');

  const receivedAt = input.receivedAt ? new Date(input.receivedAt) : now;
  if (Number.isNaN(receivedAt.getTime())) throw new RangeError('receivedAt must be an ISO date');

  return {
    schemaVersion: '1.0',
    sourceEventId,
    channel,
    name,
    email,
    phone,
    message,
    consentToContact: input.consentToContact === true,
    serviceType: clean(input.serviceType).toLowerCase() || 'unknown',
    estimatedValue: finiteNonNegative(input.estimatedValue),
    urgency: ['low', 'normal', 'high', 'emergency'].includes(input.urgency) ? input.urgency : 'normal',
    receivedAt: receivedAt.toISOString(),
    metadata: safeMetadata(input.metadata)
  };
}

function finiteNonNegative(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) / 100 : 0;
}

function safeMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, item]) => ['string', 'number', 'boolean'].includes(typeof item)));
}

export function idempotencyKey(lead) {
  return createHash('sha256')
    .update(`${lead.channel}:${lead.sourceEventId}`)
    .digest('hex');
}

export function scoreLead(lead) {
  let score = 10;
  const reasons = ['valid inquiry'];

  const urgencyPoints = { low: 0, normal: 10, high: 25, emergency: 35 }[lead.urgency];
  score += urgencyPoints;
  if (urgencyPoints) reasons.push(`urgency:${lead.urgency}`);

  if (lead.estimatedValue >= 5000) {
    score += 25;
    reasons.push('estimated_value:high');
  } else if (lead.estimatedValue >= 1000) {
    score += 15;
    reasons.push('estimated_value:medium');
  } else if (lead.estimatedValue > 0) {
    score += 5;
    reasons.push('estimated_value:known');
  }

  if (lead.serviceType !== 'unknown') {
    score += 10;
    reasons.push('service_type:known');
  }
  if (lead.phone && lead.email) {
    score += 10;
    reasons.push('contactability:two_channels');
  }
  if (lead.consentToContact) {
    score += 10;
    reasons.push('contact_consent:true');
  }

  score = Math.min(100, score);
  const priority = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  const slaMinutes = priority === 'high' ? 15 : priority === 'medium' ? 60 : 240;

  return { score, priority, slaMinutes, reasons };
}

export function decideAction(lead, scoring, now = new Date()) {
  const ageMinutes = Math.max(0, (now.getTime() - new Date(lead.receivedAt).getTime()) / 60000);
  const overdue = ageMinutes > scoring.slaMinutes;
  const humanHandoff = overdue || lead.urgency === 'emergency' || scoring.score >= 70;

  return {
    overdue,
    humanHandoff,
    followupAllowed: lead.consentToContact && !humanHandoff,
    action: humanHandoff ? 'human_handoff' : lead.consentToContact ? 'safe_followup' : 'await_consent'
  };
}

export function processLead(input, now = new Date()) {
  const lead = normalizeLead(input, now);
  const scoring = scoreLead(lead);
  const decision = decideAction(lead, scoring, now);
  return { lead, idempotencyKey: idempotencyKey(lead), scoring, decision };
}

