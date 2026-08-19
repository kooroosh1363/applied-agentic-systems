# Data contract

`contracts/feedback-event.schema.json` requires schema version, provider event identity, supported channel, customer/service identity, 1–5 rating, and a service-completed flag. The same provider event ID must be reused on retry. Message is optional and capped. Unknown top-level fields are rejected. Consent to contact and review-invite opt-out are separate because recovery contact and public-review invitation are different purposes.
