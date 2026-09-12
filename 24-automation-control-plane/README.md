# 24 — Automation Control Plane

A free local reference implementation for governing workflow revisions. It separates desired configuration from worker-observed state, requires independent approval, fences stale changes with aggregate generations, and blocks local admission when paused or unconverged.

**Evidence:** local simulation only. No external deployment, distributed execution permit, live worker integration or production SLA is claimed. Project 23 is not automatically wired to this service.

## Run without paid services

Requires Node.js 22+. No npm dependencies or cloud account.

```bash
npm test
npm run demo
```

The demo creates ephemeral credentials for four separate identities, proposes and approves revision 1, activates it, resumes admission, acknowledges healthy observation, resolves configuration, and pauses. Output must include `externalDeployment: false` and `pauseResult: paused`.

To start the HTTP API, generate credential configuration in your shell:

```bash
export CONTROL_CREDENTIALS="$(node --input-type=module -e '
import { randomBytes } from "node:crypto";
console.log(JSON.stringify(["author","reviewer","operator","worker","viewer"].map(role => ({
 token: randomBytes(32).toString("hex"), tenant: "demo", actor: role, roles: [role,"viewer"]
}))));')"
npm start
```

Keep the credential JSON private; it contains bearer tokens. In a terminal with the same configuration, choose the author credential and propose a revision:

```bash
export CONTROL_TOKEN="$(node -e 'console.log(JSON.parse(process.env.CONTROL_CREDENTIALS).find(c=>c.actor==="author").token)')"
curl http://localhost:3000/v1/commands \
  -H "Authorization: Bearer $CONTROL_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @examples/propose.json
```

Alternatively run `docker compose up` with the configuration set; host port is 3024. Missing or invalid credentials fail startup. Never commit credentials.

## API

| Method/path | Permission | Purpose |
| --- | --- | --- |
| GET /health | Public | Process liveness, not worker readiness |
| POST /v1/commands | Action-specific | Propose, approve, activate, rollback, pause, resume, acknowledge |
| GET /v1/state/triage | viewer | Tenant-scoped copied aggregate |
| GET /v1/resolve/triage | worker | Fresh, healthy, enabled local admission snapshot |
| GET /v1/audit | viewer | Tenant-scoped copied audit |

Every command has `action`, `workflow` and `expectedGeneration`. Propose adds `config`; approve/activate/rollback add `revision`; acknowledge adds `digest` and `health` (healthy/unhealthy). Pause/resume add nothing. Unknown fields are rejected. Read the generation after a conflict and reconsider intent; do not blindly replace the generation and retry.

Every accepted command, including acknowledgement, increments generation once. An acknowledgement asserts the desired revision at the expected generation and records observation at the resulting generation. This is an explicit local serialization convention, not a Kubernetes resource-version protocol.

## Source guide

- `src/control-plane.mjs`: private registry, credentials, authorization, immutable revisions, state transitions, resolution and audit.
- `src/server.mjs`: bounded HTTP JSON and status mapping.
- `src/demo.mjs`: executable simulated worker lifecycle.
- `tests/control-plane.test.mjs`: security, concurrency, lifecycle and HTTP tests.
- `docs/design.md`: invariants and acceptance criteria established before implementation.
- `docs/operations.md`: recovery, monitoring, cost and limitations.
- `docs/security.md`: threats and production requirements.

No placeholder n8n workflows or unused SQL schemas are included. The executable service is the implementation path.
