# Data flow

1. Authenticate and normalize a versioned request.
2. Deduplicate by provider event identity.
3. Check lead time and overlap; the database exclusion constraint is the final race-condition guard.
4. Hold an available slot for five minutes or enqueue a waitlist request.
5. After confirmation, create only consented reminders.
6. On cancellation, rank matching waitlist entries by priority then FIFO and issue an expiring offer.
7. Record completed/no-show attendance from an identified actor.
8. Apply recovery cooldown and opt-out/offer-limit policy.
9. Count recovered value only after the replacement appointment completes.
