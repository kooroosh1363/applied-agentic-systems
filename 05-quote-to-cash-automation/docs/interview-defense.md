# Interview defense

## 60 seconds

This project models quote-to-cash as a controlled state machine, not a sequence of emails. It validates and deduplicates quote requests, calculates money in integer minor units, versions commercial terms, and builds an approval matrix for discount and value thresholds. An identified customer acceptance is bound to the approved version and expiry before an invoice can exist. Payment is never inferred from an internal request: a provider-scoped event must be unique and verified, then atomically reconciled by invoice, currency, amount, and remaining balance. Mismatches and overpayments become human exceptions, while delivery uses bounded retry and DLQ. The local path is free and production-oriented; tax, provider, accounting, RBAC, PCI, load, and restore evidence remain required.

## Hard questions

**Why minor units?** Floating point can create money rounding errors; integer cents make arithmetic deterministic. Production must also model each currency exponent.

**Why version a quote?** Approval and acceptance must refer to immutable commercial terms. A price change creates a new version and invalidates prior acceptance.

**What proves cash was collected?** A unique signed provider event that reconciles to an invoice. A payment-link click or internal status is not cash.

**What happens to overpayment?** It becomes a human exception; the invoice is not silently marked paid.

**Is this production-grade?** It is production-oriented. Real provider signatures, tax/accounting/legal rules, PCI review, RBAC, concurrency/load, backups, and SLO evidence remain required.
