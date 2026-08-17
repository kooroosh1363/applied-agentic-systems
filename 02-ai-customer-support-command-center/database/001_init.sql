CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), idempotency_key text UNIQUE NOT NULL,
  source_event_id text NOT NULL, channel text NOT NULL, payload jsonb NOT NULL, received_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), idempotency_key text UNIQUE NOT NULL,
  customer_id text NOT NULL, channel text NOT NULL, subject text NOT NULL DEFAULT '', message_redacted text NOT NULL,
  category text NOT NULL, confidence numeric(4,3) CHECK (confidence BETWEEN 0 AND 1), urgency text NOT NULL,
  sensitive boolean NOT NULL DEFAULT false, route text NOT NULL, status text NOT NULL,
  sla_due_at timestamptz, assigned_to text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reply_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES tickets(id), content text NOT NULL,
  citations jsonb NOT NULL DEFAULT '[]', grounding_score numeric(4,3) CHECK (grounding_score BETWEEN 0 AND 1),
  status text NOT NULL CHECK (status IN ('pending','approved','rejected','auto_approved')), version integer NOT NULL DEFAULT 1,
  reviewer text, reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES tickets(id), draft_id uuid NOT NULL REFERENCES reply_drafts(id),
  attempt_number integer NOT NULL, status text NOT NULL, provider text NOT NULL, error_code text, next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(draft_id, attempt_number)
);
CREATE TABLE IF NOT EXISTS dead_letter_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid REFERENCES tickets(id), reason text NOT NULL,
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY, ticket_id uuid REFERENCES tickets(id), actor text NOT NULL, action text NOT NULL,
  evidence_type text NOT NULL CHECK (evidence_type IN ('simulated','provider_verified')), details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tickets_status_sla ON tickets(status, sla_due_at);
CREATE INDEX IF NOT EXISTS idx_delivery_due ON delivery_attempts(status, next_retry_at);
