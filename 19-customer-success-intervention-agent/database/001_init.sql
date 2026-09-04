CREATE TABLE customer_cases (
  case_id text NOT NULL,
  case_version text NOT NULL,
  customer_id text NOT NULL,
  account_owner_id text NOT NULL,
  evidence_boundary text NOT NULL CHECK (evidence_boundary IN ('simulated','provider_verified')),
  case_fingerprint char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (case_id, case_version)
);
CREATE TABLE customer_signals (
  signal_id text PRIMARY KEY,
  case_id text NOT NULL,
  case_version text NOT NULL,
  customer_id text NOT NULL,
  signal_type text NOT NULL,
  metric text NOT NULL,
  numeric_value numeric,
  observed_at timestamptz NOT NULL,
  confidence numeric NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  provider_verified boolean NOT NULL DEFAULT false,
  synthetic boolean NOT NULL DEFAULT true,
  signal_fingerprint char(64) NOT NULL,
  FOREIGN KEY (case_id,case_version) REFERENCES customer_cases(case_id,case_version)
);
CREATE TABLE health_reports (
  health_fingerprint char(64) PRIMARY KEY,
  case_id text NOT NULL,
  case_version text NOT NULL,
  health_score numeric,
  risk_band text NOT NULL,
  status text NOT NULL,
  report jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE intervention_recommendations (
  recommendation_fingerprint char(64) PRIMARY KEY,
  case_id text NOT NULL,
  case_version text NOT NULL,
  health_fingerprint char(64) NOT NULL REFERENCES health_reports(health_fingerprint),
  playbook_id text NOT NULL,
  channel text NOT NULL,
  status text NOT NULL,
  auto_send boolean NOT NULL CHECK (auto_send = false),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE intervention_approvals (
  approval_fingerprint char(64) PRIMARY KEY,
  recommendation_fingerprint char(64) NOT NULL REFERENCES intervention_recommendations(recommendation_fingerprint),
  reviewer_id text NOT NULL,
  reviewer_role text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approve','reject','request_changes')),
  rationale text NOT NULL,
  delivery_authorized boolean NOT NULL CHECK (delivery_authorized = false),
  reviewed_at timestamptz NOT NULL
);
CREATE TABLE intervention_drafts (
  draft_fingerprint char(64) PRIMARY KEY,
  recommendation_fingerprint char(64) NOT NULL,
  approval_fingerprint char(64) NOT NULL,
  delivery_mode text NOT NULL CHECK (delivery_mode = 'mock'),
  sent boolean NOT NULL CHECK (sent = false),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE intervention_outcomes (
  outcome_id text PRIMARY KEY,
  draft_fingerprint char(64) NOT NULL REFERENCES intervention_drafts(draft_fingerprint),
  outcome_type text NOT NULL,
  provider_verified boolean NOT NULL DEFAULT false,
  causal_claim_allowed boolean NOT NULL CHECK (causal_claim_allowed = false),
  observed_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);
CREATE TABLE case_timeline (
  event_id text PRIMARY KEY,
  case_id text NOT NULL,
  event_type text NOT NULL,
  actor_id text NOT NULL,
  actor_role text NOT NULL,
  previous_hash text NOT NULL,
  event_hash char(64) NOT NULL,
  occurred_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);
CREATE TABLE dead_letter_jobs (
  job_id text PRIMARY KEY,
  attempts integer NOT NULL,
  max_attempts integer NOT NULL,
  reason text NOT NULL,
  auto_replay boolean NOT NULL CHECK (auto_replay = false),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_signals_case_idx ON customer_signals(case_id,case_version,observed_at DESC);
CREATE INDEX recommendations_case_idx ON intervention_recommendations(case_id,case_version,created_at DESC);
CREATE INDEX timeline_case_idx ON case_timeline(case_id,occurred_at,event_id);
