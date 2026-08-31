-- ===========================================================================
-- ARCHIVED 19 August 2026 (rigorous review, decision_log.md D-84, external
-- review Finding 9). Every column below is now defined directly on its
-- table in postgres_schema.sql (v2.4) — do not run this file against a
-- fresh database, it is redundant (ADD COLUMN IF NOT EXISTS would just
-- no-op) and no longer part of the setup sequence in any doc. Kept here,
-- not deleted, as the historical record of why these five columns exist
-- and what they were named before the merge — decision_log.md's own
-- convention throughout this project. See postgres_schema.sql's v2.4
-- changelog note for why two files for one schema was retired: it was a
-- real ordering trap at setup time (this file's own header, below,
-- called it "safe to skip" — true when written, false since 4 August).
-- ===========================================================================
--
-- A11yAudit — schema addendum (Tier 2, optional)
-- 31 July 2026 · apply AFTER postgres_schema.sql, before any data exists
--
-- WHY: a column-by-column comparison of postgres_schema.sql (v2.0) against
-- the fields the Code nodes actually emit found ten fields with no home.
-- Most are already narrated in report_md and need no column. These five are
-- worth querying across audits, because they are the evidence for the
-- system's central claims:
--   dropped_unverified   — how often the AI fabricated a quote (anti-
--                          hallucination control, per audit)
--   checks_engine        — cheerio or regex (honesty about parse quality)
--   original_severity    — what a finding's severity was before R9
--   severity_upgraded_by — which rule upgraded it
--   ai_contradiction     — what the AI claimed where code disagreed (R6)
--
-- All nullable, all additive to the SCHEMA — but no longer optional in
-- practice. Was true when written (31 July); false since 4 August, when
-- code/13_upsert_audit.sql's fixed INSERT column list started naming
-- dropped_unverified/checks_engine directly, and code/14_insert_findings.sql
-- started naming original_severity/severity_upgraded_by (D-26/D-27/D-32);
-- code/15a_build_instrument_items_payload.js names ai_contradiction since
-- D-64. Skip this file and the very first "Upsert Audit" write throws
-- `column "dropped_unverified" of relation "audits" does not exist` —
-- the pipeline fails outright on its first execution, not degrades.
-- APPLY THIS FILE. It is no longer Tier 2/optional despite the header
-- above; the header is left as originally written (31 July) rather than
-- rewritten, since the file it describes never changed — only what
-- depends on it did. See decision_log.md D-81 (rigorous review, 19 Aug).
-- ===========================================================================

ALTER TABLE audits
  ADD COLUMN IF NOT EXISTS dropped_unverified integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS checks_engine text
    CHECK (checks_engine IN ('cheerio', 'regex', 'none'));

ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS original_severity text
    CHECK (original_severity IN ('critical', 'high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS severity_upgraded_by text;

ALTER TABLE instrument_items
  ADD COLUMN IF NOT EXISTS ai_contradiction text;

COMMENT ON COLUMN audits.dropped_unverified IS
  'AI findings discarded because the evidence quote could not be located verbatim in the source. Rises = the model is fabricating more.';
COMMENT ON COLUMN audits.checks_engine IS
  'Which HTML parser produced the deterministic checks: cheerio (full), regex (approximate fallback), none (text branch).';
COMMENT ON COLUMN findings.original_severity IS
  'Severity as reported before a deterministic rule upgraded it; NULL if never upgraded.';
COMMENT ON COLUMN findings.severity_upgraded_by IS
  'Rule that forced the upgrade, e.g. R9 (undefined medical term in safety-relevant content).';
COMMENT ON COLUMN instrument_items.ai_contradiction IS
  'What the AI claimed where the deterministic verdict disagreed. The deterministic verdict stands; this records the disagreement that fired R6.';
