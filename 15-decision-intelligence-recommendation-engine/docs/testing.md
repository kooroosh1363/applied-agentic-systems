# Testing and failure injection

Run `npm test` in this directory or `npm run check` at repository root.

The suite covers identity and risk validation, criterion/option/evidence uniqueness, scale and weight rules, evidence dates and reliability, evidence references, constraints, protected attributes, injection and secrets, maximize/minimize normalization, evidence discounting, hard disqualification, weak separation, zero/one eligible option, high-risk and high-impact routing, scenarios, sensitivity, reviewer roles, blocked approval, manifests, outcomes, API behavior, workflow importability, non-execution, bounded retry, and DLQ.

Useful drills include removing one measurement, lowering evidence reliability, exceeding the budget, making every option violate SLA, raising minimum separation, changing scenario weights, using a protected criterion, attempting a high-risk approval with only a domain expert, recording an override, and exhausting outcome delivery retries.

Green tests prove covered implementation behavior only. They do not validate real organizational weights, causal business impact, legal compliance in every jurisdiction, or fairness of a production deployment.
