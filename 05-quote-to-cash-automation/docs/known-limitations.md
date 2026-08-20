# Known limitations

- Only USD, CAD, and EUR with two-decimal minor-unit assumptions are supported.
- Tax calculation is illustrative, not jurisdiction-compliant tax advice.
- Catalog, inventory, contract, payment, refund, chargeback, and accounting adapters are simulated or absent.
- Shared secrets are not provider-grade signature verification; local customer/payment evidence defaults to `simulated`.
- Approval roles are policy examples, not organization RBAC.
- Invoice numbering is local reference logic, not statutory numbering.
- Single-node services make no HA claim; metrics reset on engine restart.
- No real customer, cash, tax, or accounting outcome is claimed.
