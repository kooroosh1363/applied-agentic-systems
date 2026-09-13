PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS tenant_state (
 tenant TEXT PRIMARY KEY, paused INTEGER NOT NULL DEFAULT 0 CHECK(paused IN (0,1))
);
CREATE TABLE IF NOT EXISTS orders (
 tenant TEXT NOT NULL REFERENCES tenant_state(tenant), id TEXT NOT NULL,
 revision INTEGER NOT NULL CHECK(revision > 0),
 status TEXT NOT NULL CHECK(status IN ('new','suggested','reviewed','scheduled','in_progress','completed','closed','cancelled')),
 customer_ref TEXT NOT NULL, issue TEXT NOT NULL,
 suggestion TEXT, category TEXT, reviewer TEXT, technician TEXT,
 starts INTEGER, ends INTEGER, completion_code TEXT, completed_by TEXT,
 PRIMARY KEY(tenant,id),
 CHECK((starts IS NULL AND ends IS NULL) OR (starts IS NOT NULL AND ends > starts))
);
CREATE INDEX IF NOT EXISTS reservations ON orders(tenant,technician,status,starts,ends);
CREATE TABLE IF NOT EXISTS receipts (
 tenant TEXT NOT NULL REFERENCES tenant_state(tenant), actor TEXT NOT NULL,
 command_key TEXT NOT NULL, fingerprint TEXT NOT NULL, response TEXT NOT NULL,
 PRIMARY KEY(tenant,actor,command_key)
);
CREATE TABLE IF NOT EXISTS audit (
 sequence INTEGER PRIMARY KEY AUTOINCREMENT, tenant TEXT NOT NULL REFERENCES tenant_state(tenant),
 actor TEXT NOT NULL, action TEXT NOT NULL, order_id TEXT, revision INTEGER, at INTEGER NOT NULL
);
PRAGMA user_version = 1;
