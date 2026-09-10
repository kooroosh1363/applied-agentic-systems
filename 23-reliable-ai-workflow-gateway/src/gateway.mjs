import { createHash, randomUUID } from 'node:crypto';

export class GatewayError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
const reject = (code, status) => { throw new GatewayError(code, status); };
const digest = value => createHash('sha256').update(value).digest('hex');

// Configuration and adapters are trusted application code; requests are not.
export class Gateway {
  constructor({ credentials, adapter, clock = Date.now, maxConcurrent = 2,
    perMinute = 30, timeoutMs = 1000, maxAttempts = 2, failureThreshold = 3,
    cooldownMs = 30000, maxRecords = 1000 } = {}) {
    if (!Array.isArray(credentials) || !credentials.length || typeof adapter !== 'function')
      reject('invalid_configuration');
    for (const value of [maxConcurrent, perMinute, timeoutMs, maxAttempts, failureThreshold, cooldownMs, maxRecords])
      if (!Number.isSafeInteger(value) || value < 1) reject('invalid_configuration');
    this.credentials = new Map();
    for (const credential of credentials) {
      if (typeof credential.token !== 'string' || credential.token.length < 32 ||
          typeof credential.tenant !== 'string' || !credential.tenant ||
          !Array.isArray(credential.workflows) || credential.workflows.some(w => w !== 'classify-v1'))
        reject('invalid_credential_configuration');
      const hash = digest(credential.token);
      if (this.credentials.has(hash)) reject('duplicate_credential');
      this.credentials.set(hash, { tenant: credential.tenant, workflows: [...credential.workflows] });
    }
    Object.assign(this, { adapter, clock, maxConcurrent, perMinute, timeoutMs,
      maxAttempts, failureThreshold, cooldownMs, maxRecords });
    this.records = new Map(); this.active = new Map(); this.windows = new Map();
    this.breakers = new Map(); this.audit = []; this.sequence = 0;
  }

  authenticate(token) {
    if (typeof token !== 'string' || !this.credentials.has(digest(token))) reject('unauthorized', 401);
    return this.credentials.get(digest(token));
  }

  async execute(token, request) {
    const principal = this.authenticate(token);
    if (!request || typeof request !== 'object' || Array.isArray(request) ||
        Object.keys(request).some(k => !['workflow', 'key', 'text'].includes(k)) ||
        typeof request.key !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(request.key) ||
        typeof request.text !== 'string' || !request.text.trim() || Buffer.byteLength(request.text) > 8192)
      reject('invalid_request', 400);
    if (!principal.workflows.includes(request.workflow)) reject('workflow_forbidden', 403);
    const input = { workflow: request.workflow, text: request.text };
    const fingerprint = digest(JSON.stringify(input));
    const recordKey = JSON.stringify([principal.tenant, request.key]);
    const existing = this.records.get(recordKey);
    if (existing) {
      if (existing.fingerprint !== fingerprint) reject('idempotency_conflict', 409);
      return structuredClone(await existing.promise);
    }
    if (this.records.size >= this.maxRecords) reject('capacity_exhausted', 503);
    const now = this.clock();
    const breakerKey = JSON.stringify([principal.tenant, request.workflow]);
    const breaker = this.breakers.get(breakerKey) || { failures: 0, openUntil: 0, probing: false };
    if (breaker.probing || breaker.openUntil > now) reject('circuit_open', 503);
    const count = this.active.get(principal.tenant) || 0;
    if (count >= this.maxConcurrent) reject('concurrency_limit', 429);
    const window = this.windows.get(principal.tenant);
    const current = !window || now >= window.until ? { count: 0, until: now + 60000 } : window;
    if (current.count >= this.perMinute) reject('rate_limit', 429);
    current.count++; this.windows.set(principal.tenant, current);
    this.active.set(principal.tenant, count + 1);
    if (breaker.openUntil) breaker.probing = true;
    this.breakers.set(breakerKey, breaker);
    // Reserve identity synchronously, before invoking any adapter or yielding.
    const record = { fingerprint, promise: null };
    this.records.set(recordKey, record);
    record.promise = this.run(principal.tenant, input, breaker);
    return structuredClone(await record.promise);
  }

  async run(tenant, input, breaker) {
    const id = randomUUID();
    const controller = new AbortController();
    let timer;
    const timeout = new Promise(resolve => {
      timer = setTimeout(() => { controller.abort(); resolve({ status: 'unknown', code: 'deadline_exceeded' }); }, this.timeoutMs);
    });
    // Slots remain reserved until the adapter settles, even after a client timeout.
    const operation = (async () => {
      try {
        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
          try {
            const result = await this.adapter(structuredClone(input), { signal: controller.signal, attempt });
            if (controller.signal.aborted) return { status: 'unknown', code: 'deadline_exceeded' };
            if (!result || !['support', 'sales', 'other'].includes(result.label) ||
                Object.keys(result).some(k => k !== 'label'))
              return { status: 'failed', code: 'invalid_output' };
            return { status: 'succeeded', result, attempts: attempt };
          } catch (error) {
            if (controller.signal.aborted) return { status: 'unknown', code: 'deadline_exceeded' };
            // Only a typed, explicit pre-execution rejection may be retried.
            if (error instanceof GatewayError && error.code === 'busy_before_execution' && attempt < this.maxAttempts) continue;
            return { status: 'failed', code: error instanceof GatewayError && error.code === 'busy_before_execution' ? 'retry_exhausted' : 'adapter_failed' };
          }
        }
      } finally { this.active.set(tenant, (this.active.get(tenant) || 1) - 1); }
    })();
    const outcome = await Promise.race([operation, timeout]);
    clearTimeout(timer);
    breaker.probing = false;
    if (outcome.status === 'succeeded') { breaker.failures = 0; breaker.openUntil = 0; }
    else { breaker.failures++; if (breaker.failures >= this.failureThreshold) breaker.openUntil = this.clock() + this.cooldownMs; }
    const response = { id, ...outcome, evidence: 'local-mock', externalDelivery: false };
    // No prompts, raw tokens, output text or caller-provided error strings in audit.
    this.audit.push({ sequence: ++this.sequence, tenant, id, status: outcome.status, code: outcome.code || null });
    return response;
  }
}

export async function localClassifier({ text }, { signal }) {
  if (signal.aborted) throw new GatewayError('aborted');
  return { label: /help|error|support/i.test(text) ? 'support' : /buy|price|sales/i.test(text) ? 'sales' : 'other' };
}
