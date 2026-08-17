import test from 'node:test';
import assert from 'node:assert/strict';
import { decideAction, idempotencyKey, normalizeLead, processLead, scoreLead } from '../src/core.mjs';

const base = {
  sourceEventId: 'evt-100',
  channel: 'web',
  name: '  Jane Example ',
  email: ' JANE@EXAMPLE.COM ',
  phone: '+1 (604) 555-0100',
  message: ' Need urgent service ',
  consentToContact: true,
  serviceType: 'HVAC',
  estimatedValue: 5200,
  urgency: 'high',
  receivedAt: '2026-01-01T10:00:00.000Z'
};

test('normalizes contact fields and preserves a canonical timestamp', () => {
  const lead = normalizeLead(base);
  assert.equal(lead.email, 'jane@example.com');
  assert.equal(lead.phone, '+16045550100');
  assert.equal(lead.serviceType, 'hvac');
  assert.equal(lead.receivedAt, base.receivedAt);
});

test('rejects unsupported channels and missing contact details', () => {
  assert.throws(() => normalizeLead({ ...base, channel: 'telegram' }), /unsupported channel/);
  assert.throws(() => normalizeLead({ ...base, email: '', phone: '' }), /email or phone/);
});

test('creates a stable key for the same provider event', () => {
  const lead = normalizeLead(base);
  assert.equal(idempotencyKey(lead), idempotencyKey({ ...lead, message: 'changed but same event' }));
  assert.notEqual(idempotencyKey(lead), idempotencyKey({ ...lead, sourceEventId: 'evt-101' }));
});

test('scores with explainable deterministic rules', () => {
  const result = scoreLead(normalizeLead(base));
  assert.equal(result.score, 90);
  assert.equal(result.priority, 'high');
  assert.equal(result.slaMinutes, 15);
  assert.ok(result.reasons.includes('estimated_value:high'));
});

test('requires human handoff for emergency and overdue leads', () => {
  const lead = normalizeLead({ ...base, urgency: 'emergency', estimatedValue: 0 }, new Date('2026-01-01T10:00:00Z'));
  const scoring = scoreLead(lead);
  assert.equal(decideAction(lead, scoring, new Date('2026-01-01T10:01:00Z')).humanHandoff, true);

  const low = normalizeLead({ ...base, urgency: 'low', estimatedValue: 0, serviceType: '', email: '' });
  const lowScore = scoreLead(low);
  assert.equal(decideAction(low, lowScore, new Date('2026-01-02T10:00:00Z')).overdue, true);
});

test('blocks automatic follow-up when contact consent is absent', () => {
  const result = processLead({ ...base, consentToContact: false, urgency: 'low', estimatedValue: 0, serviceType: '' }, new Date('2026-01-01T10:01:00Z'));
  assert.equal(result.decision.followupAllowed, false);
  assert.equal(result.decision.action, 'await_consent');
});
