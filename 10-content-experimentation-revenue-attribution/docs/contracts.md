# Experiment and data contracts

The experiment contract requires `experimentId`, hypothesis, channel, primary outcome, start/end time, owner, consent guardrail and exactly two variants. A variant contains immutable `contentVersionId` and `assetVersion`; this avoids calling two changing assets an A/B test.

Events require provider identity, provider event id, subject identity, event type, assigned variant, time and consent. Conversion events also require an allowed outcome. `providerVerified` changes the evidence label but does not by itself prove causality; causality comes from the controlled experiment and attribution checks.

Revenue is stored only as integer minor units on a verified conversion. No amount is inferred from impressions, likes, clicks, fixture data or unverified events.
