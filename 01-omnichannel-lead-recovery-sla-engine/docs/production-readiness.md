# Production Readiness Checklist

## Demonstrated

- [x] deterministic core tests
- [x] importable workflow JSON
- [x] idempotency key and database uniqueness
- [x] parameterized SQL
- [x] explainable scoring
- [x] consent and human-handoff boundaries
- [x] provider failure simulation
- [x] audit/DLQ schema
- [x] metrics endpoint and dashboard provisioning
- [x] zero-cost local configuration
- [x] evidence and limitation documentation

## Required before production

- [ ] real channel signature verification
- [ ] secret manager and rotation
- [ ] TLS and restricted networks
- [ ] operator-authorized DLQ replay workflow and runbook
- [ ] backup and restore drill
- [ ] load, soak, and recovery testing
- [ ] alert routing and on-call ownership
- [ ] retention/deletion policy and legal review
- [ ] provider sandbox evidence
- [ ] staging deployment and rollback rehearsal
- [ ] business-owner approval of scoring and SLA rules
