INSERT INTO lead_events (idempotency_key, source_event_id, channel, payload, received_at)
VALUES
  ('seed-web-001', 'seed-001', 'web', '{"evidence":"simulated"}', now() - interval '20 minutes'),
  ('seed-phone-002', 'seed-002', 'phone', '{"evidence":"simulated"}', now() - interval '5 hours')
ON CONFLICT DO NOTHING;

INSERT INTO leads (idempotency_key, channel, name, email, phone, message, service_type, estimated_value, urgency, score, priority, status, consent_to_contact, sla_due_at)
VALUES
  ('seed-web-001', 'web', 'Jane Example', 'jane@example.test', '+16045550100', 'Heating stopped', 'heating-repair', 1800, 'high', 80, 'high', 'human_handoff', true, now() - interval '5 minutes'),
  ('seed-phone-002', 'phone', 'Sam Example', NULL, '+16045550101', 'Requesting a quote', 'installation', 0, 'normal', 35, 'low', 'await_consent', false, now() - interval '1 hour')
ON CONFLICT DO NOTHING;

