CREATE TABLE feedback_events (
  feedback_id text PRIMARY KEY,
  channel text NOT NULL,
  received_at timestamptz NOT NULL,
  locale text NOT NULL,
  redacted_text text NOT NULL,
  consent boolean NOT NULL,
  source_ref text NOT NULL,
  content_fingerprint text UNIQUE NOT NULL,
  safety_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE feedback_classifications (
  feedback_id text PRIMARY KEY REFERENCES feedback_events(feedback_id),
  topics jsonb NOT NULL,
  sentiment text NOT NULL,
  confidence numeric(5,4) NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  evidence jsonb NOT NULL,
  urgent boolean NOT NULL,
  urgency_codes jsonb NOT NULL
);
CREATE TABLE insight_runs (
  run_fingerprint text PRIMARY KEY,
  evidence_boundary text NOT NULL CHECK(evidence_boundary IN ('simulated','provider_verified')),
  aggregate jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE insight_reviews (
  audit_fingerprint text PRIMARY KEY,
  run_fingerprint text NOT NULL REFERENCES insight_runs(run_fingerprint),
  topic text NOT NULL,
  reviewer_id text NOT NULL,
  reviewer_role text NOT NULL,
  decision text NOT NULL,
  rationale text NOT NULL,
  reviewed_at timestamptz NOT NULL
);
CREATE TABLE delivery_outbox (
  event_id text PRIMARY KEY,
  payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  next_attempt_at timestamptz,
  last_error text
);
CREATE TABLE dead_letters (
  event_id text PRIMARY KEY,
  payload jsonb NOT NULL,
  failure_reason text NOT NULL,
  failed_at timestamptz NOT NULL DEFAULT now()
);
