# Security and production readiness

## Threats and controls

| Threat | Reference control | Production addition |
|---|---|---|
| Retrieval prompt injection | corpus scan and block | classifiers, sandboxed tools, allow-listed actions |
| Unauthorized source retrieval | source identity in contracts | tenant/role filters enforced before retrieval |
| PII leakage | fixtures contain no PII | redaction, retention, deletion, legal review |
| Judge manipulation | deterministic fact IDs | blind human samples and judge calibration |
| Dataset poisoning | versioned baseline | review, signatures, ownership and change approval |
| Metric gaming | multiple independent metrics | slice gates and periodic audit |

## Production readiness checklist

- representative, human-reviewed and versioned golden set;
- corpus access controls and tenant isolation;
- secrets outside workflows and repository;
- durable run/audit storage with retention policy;
- latency and cost budgets measured per candidate;
- reviewer workflow for blocked or borderline runs;
- multilingual, adversarial, empty-context and no-answer cases;
- alerting on drift and baseline changes;
- rollback target and approved release owner.

This repository demonstrates production-oriented controls. It has not been operated as a customer production service.
