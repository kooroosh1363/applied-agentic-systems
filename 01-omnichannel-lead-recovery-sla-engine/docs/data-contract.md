# Data Contract

The machine-readable contract is `contracts/lead-event.schema.json`.

## Identity

`sourceEventId` must be stable in the originating channel. The local idempotency key is:

```text
sha256(lowercase(channel) + ":" + sourceEventId)
```

Changing a message while reusing the same source event ID is treated as a replay, not a new lead.

## Contactability

At least one of `email` or `phone` is required. The presence of a contact method does not equal marketing consent; `consentToContact` is evaluated separately.

## Versioning

Normalized events include `schemaVersion: 1.0`. A breaking field or semantic change requires a new major version and migration plan.

