import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const required = [
  'README.md',
  'SECURITY.md',
  'docs/standards/definition-of-done.md',
  '01-omnichannel-lead-recovery-sla-engine/README.md',
  '01-omnichannel-lead-recovery-sla-engine/workflows/lead-intake.json',
  '01-omnichannel-lead-recovery-sla-engine/contracts/lead-event.schema.json',
  '02-ai-customer-support-command-center/README.md',
  '02-ai-customer-support-command-center/workflows/ticket-intake.json',
  '02-ai-customer-support-command-center/contracts/ticket-event.schema.json',
  '03-appointment-no-show-recovery-engine/README.md',
  '03-appointment-no-show-recovery-engine/workflows/appointment-intake.json',
  '03-appointment-no-show-recovery-engine/contracts/appointment-event.schema.json',
  '04-review-reputation-recovery-system/README.md',
  '04-review-reputation-recovery-system/workflows/feedback-intake.json',
  '04-review-reputation-recovery-system/contracts/feedback-event.schema.json',
  '05-quote-to-cash-automation/README.md',
  '05-quote-to-cash-automation/workflows/quote-request-intake.json',
  '05-quote-to-cash-automation/contracts/quote-request.schema.json',
  '06-ai-content-intelligence-engine/README.md',
  '06-ai-content-intelligence-engine/workflows/signal-intake.json',
  '06-ai-content-intelligence-engine/contracts/content-signal.schema.json',
  '07-multi-format-content-production-studio/README.md',
  '07-multi-format-content-production-studio/workflows/brief-intake.json',
  '07-multi-format-content-production-studio/contracts/content-brief.schema.json',
  '08-content-repurposing-localization-factory/README.md',
  '08-content-repurposing-localization-factory/workflows/source-intake.json',
  '08-content-repurposing-localization-factory/contracts/source-content.schema.json',
  '09-social-publishing-governance-system/README.md',
  '09-social-publishing-governance-system/workflows/publication-intake-policy.json',
  '09-social-publishing-governance-system/policies/channel-policy.json',
  '10-content-experimentation-revenue-attribution/README.md',
  '10-content-experimentation-revenue-attribution/workflows/experiment-launch-guardrail.json',
  '10-content-experimentation-revenue-attribution/examples/experiment.json',
  '11-enterprise-rag-evaluation-platform/README.md',
  '11-enterprise-rag-evaluation-platform/workflows/dataset-intake-safety-gate.json',
  '11-enterprise-rag-evaluation-platform/contracts/evaluation-case.schema.json',
  '11-enterprise-rag-evaluation-platform/examples/evaluation-fixture.json',
  '11-enterprise-rag-evaluation-platform/baselines/v1.json',
  '12-ai-quality-assurance-hallucination-firewall/README.md',
  '12-ai-quality-assurance-hallucination-firewall/workflows/request-intake-safety-gate.json',
  '12-ai-quality-assurance-hallucination-firewall/contracts/verification-request.schema.json',
  '12-ai-quality-assurance-hallucination-firewall/examples/verified-answer.json',
  '12-ai-quality-assurance-hallucination-firewall/policies/firewall-policy.json',
  '12-ai-quality-assurance-hallucination-firewall/benchmarks/golden-safety-set.json',
  '13-contract-policy-compliance-copilot/README.md',
  '13-contract-policy-compliance-copilot/workflows/contract-intake-safety.json',
  '13-contract-policy-compliance-copilot/contracts/compliance-review.schema.json',
  '13-contract-policy-compliance-copilot/examples/vendor-contract.json',
  '13-contract-policy-compliance-copilot/policies/vendor-risk-policy.json',
  '13-contract-policy-compliance-copilot/benchmarks/golden-compliance-set.json'
  ,'14-voice-of-customer-intelligence-system/README.md'
  ,'14-voice-of-customer-intelligence-system/workflows/feedback-intake-privacy-gate.json'
  ,'14-voice-of-customer-intelligence-system/contracts/feedback-event.schema.json'
  ,'14-voice-of-customer-intelligence-system/examples/feedback-batch.json'
  ,'15-decision-intelligence-recommendation-engine/README.md'
  ,'15-decision-intelligence-recommendation-engine/workflows/decision-intake-safety.json'
  ,'15-decision-intelligence-recommendation-engine/contracts/decision-request.schema.json'
  ,'15-decision-intelligence-recommendation-engine/examples/vendor-selection.json'
];

for (const path of required) await access(join(root, path));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = join(directory, entry.name);
    files.push(...(entry.isDirectory() ? await walk(path) : [path]));
  }
  return files;
}

const files = await walk(root);
for (const file of files.filter((path) => path.endsWith('.json'))) {
  JSON.parse(await readFile(file, 'utf8'));
}

const suspicious = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /ghp_[A-Za-z0-9]{30,}/,
  /sk-[A-Za-z0-9]{30,}/
];

for (const file of files.filter((path) => !path.endsWith('.png') && !path.endsWith('.jpg'))) {
  const content = await readFile(file, 'utf8');
  for (const pattern of suspicious) {
    if (pattern.test(content)) throw new Error(`Possible secret in ${file}`);
  }
}

console.log(`Validated ${files.length} repository files.`);
