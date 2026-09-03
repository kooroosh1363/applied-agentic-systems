# Testing and Evidence

Deterministic tests cover request, criterion, vendor, evidence, bid, deadline, currency, money, TCO, compliance, hard constraints, scoring, conflict signals, role-separated review, award packets, PO drafts, audit tamper detection, retry, DLQ, manifests, HTTP routes, and all five workflow exports.

The main fixture contains three fictional vendors and synthetic evidence. Two pass hard gates and Vendor A ranks first; Vendor C is blocked by missing documents and an uncleared fixture status. The report, approvals, award packet, PO draft, audit chain, and manifest preserve explicit non-purchase boundaries.

Tests do not validate a live sanctions list, legal compliance, confidential-bid security, real vendor performance, production load, external provider behavior, or economic benefit. Docker Compose is validated in CI; local runtime execution must be reported separately when Docker is unavailable.
