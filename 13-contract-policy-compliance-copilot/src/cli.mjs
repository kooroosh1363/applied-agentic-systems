import{readFile}from'node:fs/promises';import{evaluateCompliance,proposeRemediations}from'./core.mjs';
const input=JSON.parse(await readFile(process.argv[2]||new URL('../examples/vendor-contract.json',import.meta.url),'utf8'));const report=evaluateCompliance(input.contract,input.policies,input.options);console.log(JSON.stringify({report,remediations:proposeRemediations(report)},null,2));
