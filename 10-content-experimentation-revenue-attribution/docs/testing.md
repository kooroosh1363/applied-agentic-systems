# Testing and failure injection

`npm test` covers invalid control selection, missing consent, invalid date/window, stable assignment, overlapping experiments, weak sample guardrail, unknown variant, event deduplication, missing exposure, attribution window failure, variant mismatch, insufficient evidence, significant lift, negative treatment, and verified-revenue boundaries.

Failure injection examples:

- send a conversion with no exposure and expect `conversion_without_exposure`;
- send conversion more than 168 hours after exposure and expect `conversion_outside_window`;
- reuse a provider event id and verify it is deduplicated;
- run overlapping LinkedIn experiments and verify launch is blocked;
- supply 429/5xx provider adapters only in the operational workflow, not as a fabricated conversion result.

Fixtures validate code paths. They do not establish real statistical power, platform delivery, business impact or revenue.
