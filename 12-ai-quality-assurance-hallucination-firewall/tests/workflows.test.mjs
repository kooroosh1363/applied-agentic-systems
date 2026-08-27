import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
const dir=new URL('../workflows/',import.meta.url);
const files=(await readdir(dir)).filter(x=>x.endsWith('.json'));
test('ships four orchestration workflows',()=>assert.equal(files.length,4));
for(const file of files)test(`${file} is importable and inactive`,async()=>{const workflow=JSON.parse(await readFile(new URL(file,dir)));assert.equal(workflow.active,false);assert.ok(workflow.nodes.length>=3);assert.equal(workflow.settings.executionOrder,'v1')});
