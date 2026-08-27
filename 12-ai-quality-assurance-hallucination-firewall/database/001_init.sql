CREATE TABLE IF NOT EXISTS verification_runs (
  request_id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  risk_tier TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('allow','allow_abstention','review','block')),
  evidence_boundary TEXT NOT NULL CHECK (evidence_boundary IN ('simulated','provider_verified')),
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS claim_findings (
  finding_id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES verification_runs(request_id),
  claim_id TEXT,
  code TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('review','block')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS review_decisions (
  review_id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES verification_runs(request_id),
  reviewer_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS dead_letters (
  dlq_id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  payload JSONB NOT NULL,
  attempt INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit_events (
  sequence BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL,
  event JSONB NOT NULL,
  previous_hash TEXT NOT NULL,
  event_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
