# Security and Operations

## Threats and controls

| Threat | Control |
|---|---|
| Prompt injection in feedback | Treat text as data and block known instruction patterns |
| PII leakage | Redact common email/phone patterns; omit customer reference from analysis output |
| Payment or secret exposure | Block before classification |
| Duplicate amplification | ID and daily content fingerprints |
| Small-group re-identification | Minimum sample and channel-diversity thresholds |
| False urgent action | Human triage only; no automatic customer contact |
| Unsupported insight | Source IDs, redacted quotes, reviewer gate, manifest fingerprint |
| Export failure | Transactional outbox, three attempts, DLQ, audit trail |

Regex redaction is intentionally limited. Real deployments should add tested entity recognition, data-loss prevention, field encryption, tenant isolation, regional retention, access reviews, deletion workflows, and incident response.

## Operational indicators

- intake validation rejection rate;
- duplicate rate;
- PII/safety block rate;
- consent exclusion rate;
- topic coverage and `needs_review` rate;
- reviewer agreement and override rate;
- urgent-case acknowledgment SLA;
- insight evidence completeness;
- retry and DLQ depth.

Never alert on sentiment alone. Alert on operational failures, verified spikes, or explicitly defined urgent codes with human confirmation.
