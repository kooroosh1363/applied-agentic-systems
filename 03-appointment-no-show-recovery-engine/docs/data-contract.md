# Data contract

`contracts/appointment-event.schema.json` requires schema version, provider event ID, supported channel, customer/resource/service identity, ISO start, and a 15–480 minute duration. The same event ID must be reused by a provider retry. Time is stored as UTC instants while the declared IANA timezone preserves display intent. Unknown top-level fields are rejected by the formal schema.
