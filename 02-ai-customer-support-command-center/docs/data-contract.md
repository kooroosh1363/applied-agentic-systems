# Data contract

The canonical input is defined in `contracts/ticket-event.schema.json`. `schemaVersion`, provider `sourceEventId`, supported `channel`, `customerId`, `message`, and ISO `receivedAt` are mandatory. Unknown top-level fields are rejected by the formal schema; metadata accepts only scalar values.

The system uses `channel + sourceEventId` for event identity, not message text. A provider must keep the same event ID when retrying. Schema evolution requires a new version and compatibility tests.
