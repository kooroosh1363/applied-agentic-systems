# KPI and Cost

## Technical KPIs

- intake success rate;
- duplicate suppression rate;
- p50/p95 intake latency;
- SLA breach count;
- provider retry and DLQ rate;
- time from intake to first human response.

## Business KPIs

- qualified leads recovered;
- contact-to-appointment conversion;
- estimated pipeline value by source;
- manual triage time saved.

Synthetic fixtures cannot prove customer outcomes. Business KPI examples must remain labeled `simulated` until an authorized pilot supplies real evidence.

## Cost model

Default local external API cost is `$0`. Hardware, electricity, and operator time are excluded from that statement.

For an optional hosted deployment:

```text
monthly_cost = infrastructure + provider_messages + model_usage + storage + operations
cost_per_lead = monthly_cost / accepted_unique_leads
```

Provider rates are configuration inputs rather than hard-coded claims because pricing changes.

