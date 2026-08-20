# Failure scenarios

| Failure | Control | Outcome |
|---|---|---|
| Duplicate quote request | durable idempotency | one quote version |
| Decimal currency input | integer validation | rejected |
| Discount above policy | approval matrix | human approval |
| Rejected approval | state machine | quote stops |
| Stale acceptance | validity/version check | no invoice |
| Duplicate payment webhook | provider identity | one payment event |
| Wrong invoice/currency | reconciliation exception | human review |
| Overpayment | explicit exception | invoice not silently paid |
| Partial payment | balance calculation | partially paid |
| Delivery 429/5xx | bounded retry | retry or DLQ |
