# KPI and cost

Measure no-show rate, reminder confirmation rate, cancellation lead time, waitlist fill rate, slot utilization, recovery-offer acceptance, completed rebooking rate, delivery/DLQ rate, and recovered revenue. Recovered revenue is recognized only when the rebooked appointment reaches `completed`, capped at the lower original/rebooked value. Local API cost is zero; hosted cost per completed appointment is `(hosting + messaging + calendar + human operations) / completed appointments`. All included values are simulated.
