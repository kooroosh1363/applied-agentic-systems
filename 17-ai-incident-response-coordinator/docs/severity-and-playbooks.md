# Severity and playbook methodology

- SEV1: verified critical indicators such as confirmed data exposure, active compromise, safety impact, or complete outage.
- SEV2: verified major indicators such as broad outage, major degradation, unauthorized access, or payment failure.
- SEV3: verified limited degradation, elevated errors, partial outage, or latency.
- SEV4: low impact or insufficient verified evidence.

Non-production incidents are capped below SEV1. No verified signal with confidence at least 0.70 means SEV4. Rules are intentionally transparent and must be calibrated against an organization's reviewed incident history.

Playbooks are immutable versions scoped to a service. Each step declares action type, minimum severity, owner role, risk, and approval requirement. Actions are proposals only; execution belongs to separately authenticated operational systems and humans.
