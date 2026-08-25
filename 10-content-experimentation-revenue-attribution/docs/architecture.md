# Architecture and data flow

The experiment starts with a hypothesis and a primary business outcome such as `demo_booked`. Exactly one variant is marked control. A stable hash assigns each consented subject to one variant so repeated events do not switch their treatment.

Events are provider-scoped and deduplicated with `SHA-256(provider:providerEventId)`. A conversion is credited to the experiment only when the same subject first had a consented exposure, the variant matches, and the conversion falls inside the declared conversion window. This is intentionally stricter than treating a click as revenue.

Analysis produces exposure count, conversion count, rate, lift, sample sufficiency and a two-proportion z result. The recommendation is conservative: rollout only with significant positive lift, retain control with significant negative lift, otherwise continue or redesign.
