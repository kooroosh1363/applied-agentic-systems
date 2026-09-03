import {readFile} from 'node:fs/promises';
import {buildAgentPlan,evaluateBids,appendAudit,buildManifest} from './core.mjs';
const path=process.argv[2]??'examples/synthetic-procurement.json';
const input=JSON.parse(await readFile(path,'utf8'));
const plan=buildAgentPlan(input.request);
const report=evaluateBids(input);
let audit=[];for(const e of input.auditEvents)audit=appendAudit(audit,e);
const manifest=buildManifest(input.request,plan,report,audit);
console.log(JSON.stringify({plan,report,audit,manifest},null,2));
