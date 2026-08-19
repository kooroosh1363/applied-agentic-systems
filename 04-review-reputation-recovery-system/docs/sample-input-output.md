# Sample input/output

Use `examples/positive-feedback.json`: the deterministic output queues a neutral invite and does not create a recovery case. Use `negative-feedback.json`: it redacts the phone, keeps the same neutral invite eligible, opens a recovery case, escalates the unsafe signal, and returns `reviewGatingApplied: false`. The invalid fixture is rejected. Provider review and KPI evidence remain simulated until a provider-verified event is ingested.
