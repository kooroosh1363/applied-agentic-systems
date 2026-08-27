import { readFile } from 'node:fs/promises';
import { verifyCandidate } from './core.mjs';
const path=process.argv[2]||new URL('../examples/verified-answer.json',import.meta.url);
const input=JSON.parse(await readFile(path,'utf8'));
console.log(JSON.stringify(verifyCandidate(input.request,input.evidence,input.candidate,input.options),null,2));
