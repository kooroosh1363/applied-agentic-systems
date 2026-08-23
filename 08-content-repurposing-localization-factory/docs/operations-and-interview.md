# Operations, limitations and interview defense

## Operational KPI

Useful measures are memory coverage, missing-translation rate, QA failure rate, reviewer lead time, revisions per locale, subtitle defects, export success and DLQ rate. Conversion and revenue are business KPIs only after real analytics are connected.

The default local variable cost is $0. Real cost per localized package must include translator/model usage, reviewer time, media/subtitle tooling, storage, provider calls and infrastructure.

## Trade-offs

- Exact translation memory is deterministic and safe, but has low coverage for new text.
- Fail-closed fallback avoids fabricated translations, but increases human workload.
- A shared source package preserves claims, but channel-native adaptation still needs specialist review.
- Multiple reviewer roles improve ownership, but increase approval latency.
- Explicit locale profiles handle direction reliably, but not every cultural nuance.

## Production readiness

Implemented: schemas, versions, identity, memory/glossary lock, format contracts, QA, approval matrix, audit, retry/DLQ, metrics, fixtures and tests.

Required: professional translation workflow, fuzzy-memory evaluation, locale-specific policies, Unicode/confusable security, OAuth/RBAC, managed secrets, backups, alerting, provider sandboxes, load/SLO evidence and live KPI governance.

## Hard interview questions

**Why not call a translation API?** The zero-cost baseline proves the system controls independently of a vendor. A provider can be added behind the translator interface, but its output remains untrusted.

**What happens when memory has no match?** The engine emits an explicit marker and QA blocks export. It never presents the source or a guessed translation as approved output.

**How do you preserve brand voice across languages?** Versioned glossary and brand review are combined with a language reviewer. Terminology alone is not claimed to guarantee voice.

**Why store source and localized segments separately?** It preserves provenance, memory match evidence, correction history and segment-level QA.

**How is RTL handled?** Locale profiles generate explicit `dir=rtl` metadata and QA detects mismatches. Rendering is still verified in the destination channel.

**What is not production-grade?** No real provider, professional translation operation, identity platform, load/SLO history or customer KPI evidence exists; therefore the precise claim is production-oriented.

## 60-second defense

“Project 08 turns one versioned source into article, social, email, SRT and carousel variants for Persian and Spanish. It uses only approved translation-memory pairs in its free deterministic path and fails closed when a segment is unknown. Every job locks the source, brand, memory and glossary versions. QA checks missing translation, terminology, prompt injection, PII, RTL/LTR metadata, subtitle timing and accessibility. Language and brand reviewers—and a cultural reviewer for sensitive content—approve the exact immutable version. Export files are fingerprinted, delivery uses bounded retry and DLQ, and simulated fixtures are never reported as real business outcomes.”
