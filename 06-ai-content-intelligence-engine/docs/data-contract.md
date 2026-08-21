# Data contract

`contracts/content-signal.schema.json` requires schema version, provider event identity, supported source type, title, body, and observation time. It caps text, tags, and engagement; URLs must be HTTP(S); evidence is explicitly `simulated` or `source_verified`. Production adapters need contract tests, signed-event metadata, retention classification, source license/consent, locale, canonical URL, collection method, and a reproducible snapshot hash.
