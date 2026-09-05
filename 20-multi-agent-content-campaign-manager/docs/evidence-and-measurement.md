# Evidence and measurement

Allowed evidence types are approved product facts, brand guides, customer research, legal disclosures, performance baselines, and approved copy. Each source requires HTTPS, timestamp, status, confidence, locale, and fingerprint. Claims without evidence, unknown evidence, unapproved evidence, or confidence below 0.7 are blocked.

Non-English output requires approved copy for the requested locale. The manager never fabricates translation; it returns `needs_translation` when the locale evidence is missing.

Campaign outcomes remain observational. A click, lead, meeting, or later revenue event cannot prove campaign impact. The Project 10 handoff therefore starts with assignment and control group unconfigured and both causal and revenue-attribution permissions false. Credible lift requires a pre-registered experiment, stable assignment, verified exposure, deduplication, conversion windows, guardrails, and statistical review.
