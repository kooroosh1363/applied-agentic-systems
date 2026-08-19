# Data flow

1. Authenticate and normalize a feedback event.
2. Deduplicate the provider event and redact PII.
3. Classify sentiment/risk only to prioritize recovery.
4. Independently evaluate neutral invite eligibility: completed service, no opt-out, no prior verified review, cooldown passed.
5. Create the neutral invite for every eligible customer regardless of rating.
6. In parallel, create a recovery case for dissatisfaction or risk and escalate high-risk evidence.
7. An identified human records progress or resolution.
8. Delivery retries transient failures and sends permanent/exhausted failures to DLQ.
9. Count a review only after a provider-identified verified event.
