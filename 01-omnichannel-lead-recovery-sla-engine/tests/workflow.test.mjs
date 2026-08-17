import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflows = await Promise.all(['lead-intake.json', 'followup-retry-dlq.json'].map(async (name) =>
  JSON.parse(await readFile(new URL(`../workflows/${name}`, import.meta.url), 'utf8'))
));
const [workflow] = workflows;

test('workflow is importable JSON with unique node names', () => {
  assert.equal(typeof workflow.name, 'string');
  assert.ok(Array.isArray(workflow.nodes));
  const names = workflow.nodes.map((node) => node.name);
  assert.equal(new Set(names).size, names.length);
});

test('retry workflow classifies failures, schedules backoff, and writes a DLQ', () => {
  const retry = workflows[1];
  const text = JSON.stringify(retry);
  assert.match(text, /retry/i);
  assert.match(text, /dead_letter_events/);
  assert.match(text, /429/);
  assert.match(text, /status>=500/);
});

test('workflow contains reliability and decision boundaries', () => {
  const types = new Set(workflow.nodes.map((node) => node.type));
  for (const required of ['n8n-nodes-base.webhook', 'n8n-nodes-base.code', 'n8n-nodes-base.postgres', 'n8n-nodes-base.if', 'n8n-nodes-base.respondToWebhook']) {
    assert.ok(types.has(required), `missing ${required}`);
  }
  const text = JSON.stringify(workflow);
  assert.match(text, /idempotency/i);
  assert.match(text, /human_handoff/i);
  assert.match(text, /ON CONFLICT/);
});

test('every connection references an existing node', () => {
  const names = new Set(workflow.nodes.map((node) => node.name));
  for (const [source, outputs] of Object.entries(workflow.connections)) {
    assert.ok(names.has(source), `unknown source ${source}`);
    for (const channel of Object.values(outputs)) for (const group of channel) for (const edge of group) {
      assert.ok(names.has(edge.node), `unknown target ${edge.node}`);
    }
  }
});
