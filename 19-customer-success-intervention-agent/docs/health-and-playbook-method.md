# Health and playbook method

The fixture model uses weekly active days (25%), feature adoption (25%), open critical tickets (20%), payment delay (15%), and a manager-entered relationship score (15%). Values are normalized to 0-100 and computed only from the newest signal above the configured confidence threshold. Scores are deterministic examples, not a trained churn model.

Risk bands are `healthy`, `medium`, `high`, `critical`, or `unknown`. More than one missing required metric changes status to `insufficient_evidence`. Hard policy findings override the score.

Playbooks are ordered deliberately: unresolved critical support, human finance support, adoption coaching, renewal success review, and human check-in. This order is a fixture policy, not a universally correct business rule. Production use requires organization-specific calibration, fairness review, cohort analysis, and controlled change management.

## Intervention guardrails

- do-not-contact and legal hold block intervention;
- missing channel consent, frequency cap, cooldown, and quiet hours block the proposed channel;
- active disputes and payment hardship require review;
- finance-sensitive help requires a finance reviewer;
- no automated discount, downgrade threat, renewal promise, or contractual statement is allowed;
- healthy customers are monitored instead of contacted merely to increase activity metrics.
