CREATE TABLE publications (
  publication_id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  content_version_id TEXT NOT NULL,
  asset_version INTEGER NOT NULL CHECK (asset_version > 0),
  channel TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE publication_approvals (
  publication_id TEXT REFERENCES publications(publication_id),
  revision INTEGER NOT NULL,
  role TEXT NOT NULL,
  actor TEXT NOT NULL,
  status TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (publication_id, revision, role)
);
CREATE TABLE publication_events (
  event_id BIGSERIAL PRIMARY KEY,
  publication_id TEXT REFERENCES publications(publication_id),
  event_type TEXT NOT NULL,
  evidence TEXT NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE publication_dlq (
  publication_id TEXT PRIMARY KEY REFERENCES publications(publication_id),
  failed_attempts INTEGER NOT NULL,
  provider_status INTEGER,
  reason TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
