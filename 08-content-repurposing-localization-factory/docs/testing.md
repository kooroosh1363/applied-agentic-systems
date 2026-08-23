# Test plan and failure injection

## Automated coverage

- contract fields, locales, formats, segment identity and subtitle timing;
- source/job identity scope and deterministic fingerprints;
- approved/unapproved/missing translation-memory behavior;
- Persian RTL and Spanish LTR five-format packages;
- missing translation, prompt injection, PII, forbidden term, missing format, bidi mismatch, overlap and alt text;
- approval roles, state transitions, export hashes and bounded delivery;
- API health, source intake, localization, QA, export rejection, metrics and 404;
- n8n JSON, inactive state, unique nodes, valid edges, responses and lifecycle persistence.

## Failure scenarios

| Failure | Expected result |
|---|---|
| segment absent from approved memory | marker plus `translation_missing`; export blocked |
| instruction hidden in source | prompt-injection finding |
| PII in localized text | QA failure |
| Persian variant marked LTR | direction failure |
| overlapping subtitle cues | subtitle failure |
| excessive subtitle reading speed | human review finding |
| missing reviewer role | approval blocked |
| HTTP 429/5xx before attempt limit | retry with backoff |
| permanent or exhausted delivery | DLQ and audit event |

Fixtures prove system behavior, not universal translation quality or live-provider delivery.
