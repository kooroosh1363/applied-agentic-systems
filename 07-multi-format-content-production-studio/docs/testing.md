# Test plan and failure scenarios

## Automated coverage

- Contract: required fields, formats, duplicates, safe URLs, evidence/claim identity.
- Grounding: missing evidence, unknown reference, injection-bearing evidence and sensitive claims.
- Production: all formats, deterministic output, version fingerprints and brand lock.
- QA: missing output, alt text, PII, prohibited phrases, durations and approval roles.
- Workflow: valid JSON, unique node names, connected edges, explicit webhook responses and persistence tables.
- API: health, briefs, packages, QA, export rejection, delivery simulation, metrics and 404.

## Failure injection

| Injection | Expected result |
|---|---|
| factual claim without evidence | `qa_failed` |
| instruction hidden in evidence | prompt-injection finding |
| email or phone in output | PII finding |
| missing carousel alt text | accessibility finding |
| brand version mismatch | production rejected |
| missing reviewer role | approval blocked |
| HTTP 429/5xx before limit | retry with backoff |
| permanent error or exhausted retry | DLQ event |

The fixtures are deterministic. They test system behavior, not live social-provider availability or creative performance.
