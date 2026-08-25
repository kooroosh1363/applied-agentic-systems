CREATE TABLE experiments (
  experiment_id TEXT PRIMARY KEY,
  experiment_key TEXT UNIQUE NOT NULL,
  channel TEXT NOT NULL,
  primary_outcome TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  conversion_window_hours INTEGER NOT NULL,
  contract JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE experiment_assignments (
  experiment_id TEXT REFERENCES experiments(experiment_id),
  subject_hash TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (experiment_id, subject_hash)
);
CREATE TABLE experiment_events (
  event_key TEXT PRIMARY KEY,
  experiment_id TEXT REFERENCES experiments(experiment_id),
  subject_hash TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  outcome TEXT,
  evidence TEXT NOT NULL,
  amount_minor BIGINT,
  occurred_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);
CREATE TABLE attribution_results (
  experiment_id TEXT REFERENCES experiments(experiment_id),
  subject_hash TEXT NOT NULL,
  conversion_event_key TEXT NOT NULL,
  attribution_model TEXT NOT NULL,
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (experiment_id, conversion_event_key)
);
