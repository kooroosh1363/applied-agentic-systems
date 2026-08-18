# Interview defense

## 60 seconds

This project treats scheduling as a concurrent stateful system, not a calendar form. Provider identity prevents replay, while a PostgreSQL exclusion constraint prevents two active bookings from overlapping even under concurrent requests. Available slots receive expiring holds; conflicts enter a priority-then-FIFO waitlist. Confirmed customers receive only consented reminders. Cancellation releases capacity and creates an expiring offer. No-show recovery requires recorded attendance, applies cooldown/opt-out/offer limits, and revenue is counted only after a rebooked appointment completes. Delivery uses bounded retry and DLQ, and all included outcomes are simulated.

## Hard questions

**Why not check availability then insert?** Two requests can both pass the check; the database must enforce non-overlap atomically.

**Why half-open time ranges?** A booking ending at 11:00 must not conflict with one starting at 11:00.

**How do you avoid inflated recovery revenue?** An offer or confirmation is not revenue; only a completed rebooking counts, with a conservative value cap.

**Is the waitlist fair?** It is explainable—priority then FIFO—but production policy still needs stakeholder/legal validation and audit.

**Is it production-grade?** It is production-oriented. Real adapters, signatures, expiry worker, DST/load tests, RBAC, backups, and SLO evidence are still required.
