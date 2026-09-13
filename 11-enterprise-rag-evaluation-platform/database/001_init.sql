-- v2 tables are additive: existing v1 audit data is not destroyed.
CREATE TABLE IF NOT EXISTS p11_reports (
 run_id uuid PRIMARY KEY,
 dataset_id text NOT NULL,
 dataset_version text NOT NULL,
 dataset_hash text NOT NULL CHECK (length(dataset_hash)=64),
 report jsonb NOT NULL,
 checksum text NOT NULL CHECK (length(checksum)=64),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (jsonb_typeof(report)='object'),
 CHECK (report ?& ARRAY['datasetId','datasetVersion','datasetHash','runId']),
 CHECK (report->>'datasetId'=dataset_id),
 CHECK (report->>'datasetVersion'=dataset_version),
 CHECK (report->>'datasetHash'=dataset_hash),
 CHECK (report->>'runId'=run_id::text)
);
CREATE INDEX IF NOT EXISTS p11_reports_dataset_version ON p11_reports(dataset_id,dataset_version,created_at);
