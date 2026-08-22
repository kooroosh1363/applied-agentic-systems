# Contracts and sample input/output

## Input contract

`contracts/content-brief.schema.json` defines source identity, campaign/topic identity, objective, audience, requested formats, evidence, claims, exact brand-memory version and CTA. Evidence is either `simulated` or `source_verified`; factual claims point to evidence IDs.

Example:

```json
{
  "sourceEventId": "evt-content-007",
  "campaignId": "campaign-reliable-content",
  "topicId": "topic-evidence-first",
  "formats": ["article", "reel_script", "carousel", "email", "short_video_script"],
  "brandVersion": 1
}
```

## Output contracts

| Format | Required structure | Main QA |
|---|---|---|
| article | headline, dek, sections, claims, disclosure | evidence and brand language |
| reel script | hook, timed scenes, caption, claims | duration and injection |
| carousel | 4–10 slides and alt text | slide count and accessibility |
| email | subject, preheader, body, CTA | 60-character subject and PII |
| short video | title, timed shots, on-screen text | duration and disclosure |

The output also includes `packageId`, `version`, `briefIdentity`, brand identity/version, visual brief, generator name, evidence boundary and SHA-256 fingerprint.

## Version rule

Editing published or reviewed content never mutates the old version. Submit a new package version; the key and fingerprint change and approvals must be collected again.
