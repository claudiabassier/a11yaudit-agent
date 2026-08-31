-- ===========================================================================
-- A11yAudit — least-privilege application role
-- 15 August 2026 · apply AFTER postgres_schema.sql (v2.1, incl. audit_runs)
--
-- WHY (readme.md "What it is not"): n8n's own internal state and the audit
-- tables currently share one Postgres role — the superuser `n8n` role that
-- the container bootstraps itself with (docker-compose.yml POSTGRES_USER).
-- Anyone who can reach the Postgres port with those credentials can read
-- and write n8n's own workflow/execution/credential store AND every audited
-- page's content, findings, and reports. No row-level security exists
-- either, so this is the ceiling of what a role change alone can fix — see
-- the backlog note in A11yAudit_Fahrplan.md.
--
-- WHAT THIS DOES NOT TOUCH: n8n's own connection to the `n8n` database
-- (DB_POSTGRESDB_* in docker-compose.yml) stays on the `n8n` role. n8n
-- manages its own schema there and needs full rights to it — that
-- requirement is inherent to running n8n, not something this role change
-- can or should override.
--
-- WHAT THIS ROLE IS FOR: a second, separate role used ONLY by the Postgres
-- nodes inside the audit workflow (Node 13, 13b, 14, 15) to write to the
-- `a11yaudit` / `a11yaudit_dev` database. It cannot connect to the `n8n`
-- database at all, cannot alter schema, and only has the specific
-- statement types each table actually needs.
--
-- AFTER RUNNING THIS FILE:
--   1. Set a real password (see placeholder below), store it the same way
--      as POSTGRES_PASSWORD / N8N_ENCRYPTION_KEY (.env + a second location).
--   2. In n8n: create a NEW Postgres credential using this role, host
--      `postgres`, database `a11yaudit` (or `a11yaudit_dev` on the dev
--      branch) — do not overwrite the existing credential, so the switch
--      can be verified node by node before the old one is removed.
--   3. Re-point Nodes 13, 13b, 14, 15 to the new credential.
--   4. Run a real end-to-end audit and verify against the DB directly
--      (same discipline as Tag 2/6/D-36 — not just "no red X in the
--      editor") that every write still succeeds under the reduced grants.
-- ===========================================================================

-- CHANGE 'changeme' before running — do not commit a real password.
CREATE ROLE a11yaudit_app WITH LOGIN PASSWORD 'changeme';

-- Connect rights: the audit databases only, not `n8n`. Both granted — this
-- role is meant to work unchanged whether applied against `a11yaudit_dev`
-- (current branch) or `a11yaudit` (once promoted) — CONNECT on a database
-- that does not exist yet on this Postgres instance would error, so if only
-- one of the two exists here, comment out the other line before running.
GRANT CONNECT ON DATABASE a11yaudit TO a11yaudit_app;
GRANT CONNECT ON DATABASE a11yaudit_dev TO a11yaudit_app;
GRANT USAGE ON SCHEMA public TO a11yaudit_app;

-- audits, findings, instrument_items — upserted (INSERT .. ON CONFLICT DO
-- UPDATE), so both INSERT and UPDATE are needed. No DELETE: nothing in the
-- pipeline deletes an audits row: the ON DELETE CASCADE on findings/
-- instrument_items/audit_runs exists for manual cleanup, not routine use.
GRANT SELECT, INSERT, UPDATE ON audits, findings, instrument_items TO a11yaudit_app;

-- audit_runs — insert-only by design (v2.1): one row per execution, never
-- overwritten. No UPDATE grant, so a bug can't accidentally start upserting
-- run history the way audits does.
GRANT SELECT, INSERT ON audit_runs TO a11yaudit_app;

-- error_log — append-only by design (metadata only, GDPR data minimisation,
-- see postgres_schema.sql comment on the table itself). No UPDATE.
GRANT SELECT, INSERT ON error_log TO a11yaudit_app;

-- v_review_queue, v_audit_summary, v_pipeline_health — read-only reporting
-- views (v_pipeline_health added 19 August, decision_log.md D-83).
GRANT SELECT ON v_review_queue, v_audit_summary, v_pipeline_health TO a11yaudit_app;

-- Explicitly no DDL rights (no CREATE/ALTER/DROP on anything), no
-- CREATEDB/CREATEROLE/SUPERUSER — the absence of a GRANT is the point here,
-- listed as a comment so it reads as a deliberate omission, not an oversight.
