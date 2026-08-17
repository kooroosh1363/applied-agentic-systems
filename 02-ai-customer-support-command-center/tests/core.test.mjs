import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyzeTicket, canTransition, classifyTicket, idempotencyKey, normalizeTicket, redactPII, retrieveKnowledge } from '../src/core.mjs';

const articles = JSON.parse(await readFile(new URL('../knowledge/articles.json', import.meta.url), 'utf8'));
const base = { sourceEventId:'evt-1', channel:'email', customerId:'cust-1', subject:'Refund request', message:'I was charged twice and need a refund', receivedAt:'2026-08-17T08:00:00Z' };

test('normalizes a canonical support ticket', () => {
  const ticket=normalizeTicket({...base, channel:' EMAIL ', language:' EN '});
  assert.equal(ticket.channel,'email'); assert.equal(ticket.language,'en');
});
test('rejects unsupported channels and missing identity', () => {
  assert.throws(()=>normalizeTicket({...base,channel:'sms'}),/unsupported channel/);
  assert.throws(()=>normalizeTicket({...base,customerId:''}),/customerId/);
});
test('produces stable provider event identity', () => {
  const t=normalizeTicket(base); assert.equal(idempotencyKey(t),idempotencyKey({...t,message:'changed'}));
});
test('redacts email, phone, and card-like values', () => {
  const out=redactPII('me@example.com +1 604 555 0100 4111 1111 1111 1111');
  assert.match(out,/REDACTED_EMAIL/); assert.match(out,/REDACTED_PHONE/); assert.match(out,/REDACTED_CARD/);
});
test('classifies billing with explainable evidence', () => {
  const c=classifyTicket(normalizeTicket(base)); assert.equal(c.category,'billing'); assert.ok(c.confidence>=0.9); assert.ok(c.evidence.includes('refund'));
});
test('routes safety content to human escalation', () => {
  const result=analyzeTicket({...base,subject:'Gas emergency',message:'I smell gas and this is urgent'},articles);
  assert.equal(result.classification.category,'safety'); assert.equal(result.decision.route,'human_escalation');
});
test('retrieval returns ordered grounded citations', () => {
  const found=retrieveKnowledge('refund payment charged',articles); assert.equal(found[0].id,'KB-002'); assert.ok(found[0].score>0);
});
test('high-confidence grounded FAQ can auto reply', () => {
  const result=analyzeTicket(base,articles); assert.equal(result.decision.route,'auto_reply'); assert.equal(result.draft.citations[0],'KB-002');
});
test('unknown ungrounded request escalates', () => {
  const result=analyzeTicket({...base,subject:'Other',message:'Tell me something unrelated'},articles); assert.equal(result.decision.route,'human_escalation');
});
test('allows only explicit support lifecycle transitions', () => {
  assert.equal(canTransition('pending_approval','approved'),true);
  assert.equal(canTransition('pending_approval','delivered'),false);
  assert.equal(canTransition('delivered','queued'),false);
});
