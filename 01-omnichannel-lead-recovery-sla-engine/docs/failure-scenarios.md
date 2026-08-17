# Failure Scenarios

| Failure | Expected behavior | Evidence |
|---|---|---|
| Duplicate webhook | no second lead or provider side effect | core/workflow tests + DB uniqueness |
| Unsupported channel | reject before persistence | automated test |
| Missing contact | reject before persistence | automated test |
| Provider 429 | classify as retriable and schedule bounded backoff | retry workflow + mock test |
| Provider timeout/5xx | classify as retriable | retry workflow + mock test |
| Provider 422 | no blind retry; move to DLQ | retry workflow |
| Database unavailable | n8n execution fails visibly; no response should claim acceptance | local integration required |
| Human owner unavailable | keep case in handoff queue and alert on SLA breach | planned scheduled workflow |
| Consent absent | no automatic follow-up | automated test |

The real container integration remains CI/local evidence; deterministic classification is covered without a paid provider.
