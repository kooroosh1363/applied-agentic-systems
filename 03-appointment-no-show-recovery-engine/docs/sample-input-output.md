# Sample input/output

Use `examples/valid-appointment.json`. With an empty calendar the deterministic plan returns `route: hold_slot`, a five-minute `holdExpiresAt`, two reminder times, and `evidenceType: simulated`. If the conflicting example is planned against the valid confirmed booking, it returns `route: waitlist`. Invalid channel/date/duration/identity inputs are rejected.
