CREATE TABLE tenants (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, plan TEXT NOT NULL, monthly_run_limit INTEGER NOT NULL, status TEXT NOT NULL);
CREATE TABLE memberships (tenant_id TEXT NOT NULL REFERENCES tenants(id), user_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','admin','operator','viewer')), PRIMARY KEY(tenant_id,user_id));
CREATE TABLE workflow_runs (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), workflow_id TEXT NOT NULL, idempotency_key TEXT NOT NULL, status TEXT NOT NULL, attempt INTEGER NOT NULL DEFAULT 0, UNIQUE(tenant_id,idempotency_key));
CREATE TABLE audit_events (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), event_type TEXT NOT NULL, payload JSONB NOT NULL, previous_hash TEXT NOT NULL, event_hash TEXT NOT NULL);
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY; ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY; ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
-- Production request handlers must SET LOCAL app.tenant_id, then policies use current_setting('app.tenant_id').
