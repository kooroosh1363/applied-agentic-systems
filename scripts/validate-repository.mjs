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
  '04-review-reputation-recovery-system/contracts/feedback-event.schema.json'
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
