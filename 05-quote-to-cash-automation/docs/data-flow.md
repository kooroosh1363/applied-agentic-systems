# Data flow

1. Authenticate and deduplicate a versioned quote request.
2. Validate items and calculate money in integer minor units.
3. Build the approval matrix from discount and value thresholds.
4. Persist quote version, lines, and required approvals.
5. Identified approvers decide; rejection stops the flow.
6. Issue a one-time acceptance token, store only its hash, and send only the approved version.
7. Consume the unexpired token once and bind customer acceptance to that version and validity window.
8. Issue an invoice frozen to accepted currency and total.
9. Authenticate and deduplicate a provider payment event.
10. Atomically reconcile exact/partial payment or open a human exception.
