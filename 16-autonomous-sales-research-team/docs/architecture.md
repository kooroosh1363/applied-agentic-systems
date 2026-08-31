# Architecture

The intake gate validates identity, purpose, domain scope, budgets, and unsafe text. The coordinator then accepts only five predefined agent roles and five non-destructive tools. Source ingestion accepts HTTPS URLs from request-specific allowlisted domains and records provenance. The verifier scores citation quality, independence, and freshness. The analyst detects conflicting signals, and the composer emits a review-only brief plus immutable fingerprints.

Every boundary fails closed. No component has an outreach adapter or CRM-write capability. The deterministic local adapter reads only the bundled synthetic fixture.

State is versioned by request ID and request version. Sources, claims, traces, briefs, and human reviews have separate database records so an auditor can reconstruct how a claim entered a brief.
