-- ===========================================================================
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
-- All nullable, all additive: safe to skip entirely. If you are behind
-- schedule, skip this file — nothing downstream depends on it.
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
