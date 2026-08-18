# Known limitations

- External calendar and messaging adapters are simulated.
- No UI, payment/deposit capture, recurring appointments, or multi-resource group booking.
- Hold expiry is modeled but a dedicated expiry worker is not included.
- Timezone storage is explicit, but a full DST ambiguity policy needs more tests.
- Shared secret is not provider-grade signature verification.
- Waitlist fairness policy is deterministic but not legally or operationally validated.
- Single-node local services provide no HA claim.
- Metrics reset with the engine process.
