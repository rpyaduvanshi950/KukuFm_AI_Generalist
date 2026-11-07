-- Aggregate usage and random reservation IDs only. No cases, documents or user identifiers.
CREATE TABLE IF NOT EXISTS ai_budget (
 day TEXT PRIMARY KEY,
 reserved_micros INTEGER NOT NULL DEFAULT 0 CHECK (reserved_micros >= 0),
 attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
 failures INTEGER NOT NULL DEFAULT 0 CHECK (failures >= 0)
);
CREATE TABLE IF NOT EXISTS ai_rate_limit (
 hour_key TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0)
);
CREATE TABLE IF NOT EXISTS ai_reservations (
 id UUID PRIMARY KEY,
 day TEXT NOT NULL REFERENCES ai_budget(day),
 micros INTEGER NOT NULL CHECK (micros > 0),
 settled BOOLEAN NOT NULL DEFAULT FALSE
);
