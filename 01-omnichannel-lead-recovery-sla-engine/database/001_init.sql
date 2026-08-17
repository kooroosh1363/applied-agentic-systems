CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  source_event_id text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('web','email','instagram','whatsapp','phone')),
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE REFERENCES lead_events(idempotency_key),
  channel text NOT NULL,
  name text NOT NULL DEFAULT '',
  email text,
  phone text,
  message text NOT NULL,
  service_type text NOT NULL DEFAULT 'unknown',
  estimated_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (estimated_value >= 0),
  urgency text NOT NULL CHECK (urgency IN ('low','normal','high','emergency')),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  priority text NOT NULL CHECK (priority IN ('low','medium','high')),
  status text NOT NULL,
  consent_to_contact boolean NOT NULL DEFAULT false,
  owner text,
  sla_due_at timestamptz NOT NULL,
  first_response_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS leads_status_sla_idx ON leads(status, sla_due_at);
CREATE INDEX IF NOT EXISTS leads_contact_idx ON leads(lower(email), phone);

CREATE TABLE IF NOT EXISTS followup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  provider text NOT NULL,
  provider_message_id text,
  status text NOT NULL,
  error_code text,
  next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, attempt_number)
);

CREATE TABLE IF NOT EXISTS dead_letter_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  operation text NOT NULL,
  payload jsonb NOT NULL,
  reason text NOT NULL,
  replay_count integer NOT NULL DEFAULT 0,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  actor text NOT NULL,
  action text NOT NULL,
  evidence_type text NOT NULL CHECK (evidence_type IN ('automated','local_integration','simulated','external_sandbox','production')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

