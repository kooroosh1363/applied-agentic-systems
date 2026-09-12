import { createHash } from 'node:crypto';
const hash = value => createHash('sha256').update(value).digest('hex');
const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const roles = ['author', 'reviewer', 'operator', 'viewer', 'worker'];
export class ControlError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
const fail = (code, status) => { throw new ControlError(code, status); };
const exact = (value, fields) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === fields.length && fields.every(k => Object.hasOwn(value, k));

export class ControlPlane {
  #credentials = new Map(); #registry = new Map(); #audit = [];
  #clock; #ttl; #maxWorkflows; #maxRevisions; #maxChanges;
  constructor({ credentials, clock = Date.now, freshnessMs = 30000,
    maxWorkflows = 100, maxRevisions = 100, maxChanges = 10000 } = {}) {
    if (!Array.isArray(credentials) || !credentials.length || typeof clock !== 'function' ||
      [freshnessMs, maxWorkflows, maxRevisions, maxChanges].some(v => !integer(v) || v === 0)) fail('invalid_configuration');
    for (const c of credentials) {
      if (!c || typeof c.token !== 'string' || c.token.length < 32 || !id(c.tenant) || !id(c.actor) ||
        !Array.isArray(c.roles) || !c.roles.length || c.roles.some(r => !roles.includes(r))) fail('invalid_credentials');
      const key = hash(c.token);
      if (this.#credentials.has(key)) fail('duplicate_credential');
      this.#credentials.set(key, { tenant: c.tenant, actor: c.actor, roles: [...c.roles] });
    }
    this.#clock = clock; this.#ttl = freshnessMs; this.#maxWorkflows = maxWorkflows;
    this.#maxRevisions = maxRevisions; this.#maxChanges = maxChanges;
  }
  authenticate(token) {
    const principal = typeof token === 'string' && this.#credentials.get(hash(token));
    if (!principal) fail('unauthorized', 401);
    return structuredClone(principal);
  }
  #principal(token, role) {
    const p = this.authenticate(token);
    if (!p.roles.includes(role)) fail('forbidden', 403);
    return p;
  }
  #get(tenant, workflow) {
    if (!id(workflow)) fail('invalid_workflow');
    const state = this.#registry.get(JSON.stringify([tenant, workflow]));
    if (!state) fail('not_found', 404);
    return state;
  }
  read(token, workflow) {
    const p = this.#principal(token, 'viewer');
    return structuredClone(this.#get(p.tenant, workflow));
  }
  audit(token) {
    const p = this.#principal(token, 'viewer');
    return structuredClone(this.#audit.filter(e => e.tenant === p.tenant));
  }
  command(token, request) {
    const fields = {
      propose: ['action', 'workflow', 'expectedGeneration', 'config'],
      approve: ['action', 'workflow', 'expectedGeneration', 'revision'],
      activate: ['action', 'workflow', 'expectedGeneration', 'revision'],
      rollback: ['action', 'workflow', 'expectedGeneration', 'revision'],
      pause: ['action', 'workflow', 'expectedGeneration'],
      resume: ['action', 'workflow', 'expectedGeneration'],
      acknowledge: ['action', 'workflow', 'expectedGeneration', 'digest', 'health']
    };
    this.authenticate(token);
    if (!request || !Object.hasOwn(fields, request.action) || !exact(request, fields[request.action]) ||
      !id(request.workflow) || !integer(request.expectedGeneration)) fail('invalid_command');
    const { action, workflow, expectedGeneration } = request;
    const role = { propose: 'author', approve: 'reviewer', acknowledge: 'worker' }[action] || 'operator';
    const p = this.#principal(token, role);
    const key = JSON.stringify([p.tenant, workflow]);
    const existing = this.#registry.get(key);
    if (!existing && action !== 'propose') fail('not_found', 404);
    if (!existing && this.#registry.size >= this.#maxWorkflows) fail('workflow_capacity', 503);
    const state = structuredClone(existing || { generation: 0, revisions: [], desired: null,
      paused: true, observed: null, history: [] });
    if (state.generation !== expectedGeneration) fail('generation_conflict', 409);
    if (this.#audit.length >= this.#maxChanges) fail('audit_capacity', 503);
    const now = this.#clock();
    if (!Number.isSafeInteger(now) || now < 0) fail('invalid_clock', 503);
    if (action === 'propose') {
      const c = request.config;
      if (!exact(c, ['adapter', 'concurrency']) || c.adapter !== 'local-classifier-v1' ||
        !integer(c.concurrency) || c.concurrency < 1 || c.concurrency > 10) fail('invalid_config');
      if (state.revisions.length >= this.#maxRevisions) fail('revision_capacity', 503);
      const config = { adapter: c.adapter, concurrency: c.concurrency };
      state.revisions.push({ revision: state.revisions.length + 1, config,
        digest: hash(JSON.stringify(config)), author: p.actor, approval: null });
    } else if (['approve', 'activate', 'rollback'].includes(action)) {
      const revision = state.revisions.find(r => r.revision === request.revision);
      if (!integer(request.revision) || !revision) fail('revision_not_found', 404);
      if (action === 'approve') {
        if (revision.author === p.actor) fail('self_approval', 403);
        if (revision.approval) fail('already_approved', 409);
        revision.approval = { actor: p.actor, digest: revision.digest };
      } else {
        if (!revision.approval || revision.approval.digest !== revision.digest) fail('approval_required', 409);
        if (action === 'rollback' && !state.history.includes(revision.revision)) fail('rollback_not_deployed', 409);
        state.desired = revision.revision;
        if (!state.history.includes(revision.revision)) state.history.push(revision.revision);
        // Activation never bypasses a pause. Resume is a separate operator command.
      }
    } else if (action === 'pause' || action === 'resume') {
      if (action === 'resume' && state.desired === null) fail('no_desired_revision', 409);
      state.paused = action === 'pause';
    } else {
      const revision = state.revisions.find(r => r.revision === state.desired);
      if (!revision || request.digest !== revision.digest) fail('digest_mismatch', 409);
      if (!['healthy', 'unhealthy'].includes(request.health)) fail('invalid_health');
      state.observed = { generation: state.generation + 1, digest: revision.digest,
        health: request.health, at: now, worker: p.actor };
    }
    state.generation++;
    this.#registry.set(key, state);
    this.#audit.push({ sequence: this.#audit.length + 1, tenant: p.tenant, actor: p.actor,
      workflow, action, generation: state.generation, at: now });
    return { generation: state.generation, desired: state.desired, paused: state.paused,
      evidence: 'local-simulation', externalDeployment: false };
  }
  resolve(token, workflow) {
    const p = this.#principal(token, 'worker');
    const s = this.#get(p.tenant, workflow);
    if (this.#audit.length >= this.#maxChanges) fail('audit_capacity', 503);
    if (s.paused) fail('paused', 423);
    const r = s.revisions.find(r => r.revision === s.desired), o = s.observed;
    if (!r || !o || o.generation !== s.generation || o.digest !== r.digest || o.health !== 'healthy') fail('not_converged', 503);
    const age = this.#clock() - o.at;
    if (!Number.isFinite(age) || age < 0 || age >= this.#ttl) fail('observation_stale', 503);
    return structuredClone({ revision: r.revision, generation: s.generation, config: r.config,
      digest: r.digest, evidence: 'local-simulation', externalDeployment: false });
  }
}
