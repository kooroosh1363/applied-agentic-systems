# Security, privacy and operations

Use consented, pseudonymous subject identities in production. Never place raw customer email, advertising token, analytics key or payment details in Git, n8n JSON, logs or screenshots. Apply retention limits, deletion workflows, RBAC, encrypted transport/storage and provider-specific legal review.

Monitor exposure ingestion lag, duplicate rate, consent rejection rate, attribution rejection codes, sample size by variant, experiment overlap blocks, conversion-window expiry and provider-verified conversion rate. Pause an experiment if assignment integrity or consent collection fails.

Before a production decision, define power and sample-size calculations, a stopping rule, bot filtering, a metric owner, a rollback plan and a documented policy for multiple simultaneous experiments.
