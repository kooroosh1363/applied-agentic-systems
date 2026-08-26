CREATE TABLE IF NOT EXISTS evaluation_datasets (
  dataset_id text PRIMARY KEY,
  version text NOT NULL,
  evidence_boundary text NOT NULL CHECK (evidence_boundary IN ('simulated','provider_verified')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dataset_id, version)
);
CREATE TABLE IF NOT EXISTS evaluation_runs (
  run_id uuid PRIMARY KEY,
  dataset_id text NOT NULL REFERENCES evaluation_datasets(dataset_id),
  candidate_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('running','passed','failed','blocked')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS case_results (
  run_id uuid NOT NULL REFERENCES evaluation_runs(run_id),
  case_id text NOT NULL,
  status text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (run_id, case_id)
);
CREATE TABLE IF NOT EXISTS audit_events (
  event_id bigserial PRIMARY KEY,
  run_id uuid REFERENCES evaluation_runs(run_id),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
