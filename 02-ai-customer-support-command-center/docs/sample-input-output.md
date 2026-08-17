# Sample input and output

Input: `examples/valid-billing-ticket.json`.

Representative deterministic output:

```json
{"classification":{"category":"billing","confidence":0.92,"urgency":"normal","sensitive":false},"decision":{"route":"auto_reply","reason":"high_confidence_grounded"},"draft":{"citations":["KB-002"]},"evidenceType":"simulated"}
```

The safety fixture routes to `human_escalation`. The invalid fixture is rejected for its unsupported channel and missing customer identity.
