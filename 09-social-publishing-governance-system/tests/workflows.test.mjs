import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
const dir = new URL('../workflows/', import.meta.url);
test('all n8n workflow JSON is importable and inactive by default', async () => {
  const names = (await readdir(dir)).filter(x => x.endsWith('.json'));
  assert.ok(names.length >= 4);
  for (const name of names) { const workflow = JSON.parse(await readFile(new URL(name, dir))); assert.equal(workflow.active, false); assert.ok(Array.isArray(workflow.nodes) && workflow.nodes.length >= 2, name); }
});
