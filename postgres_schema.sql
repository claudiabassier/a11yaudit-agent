-- ================================================================
-- A11yAudit — Postgres schema
-- Version 2.4 · 19 August 2026 · Postgres 16
--
-- v2.4 changes: postgres_schema_addendum.sql merged in place —
--   audits.dropped_unverified/checks_engine, findings.original_severity/
--   severity_upgraded_by, instrument_items.ai_contradiction are now
--   defined directly on their tables. Two files for one schema was an
--   ordering trap at setup time (external review Finding 9, decision_log.md
--   D-84) — postgres_schema_addendum.sql is no longer part of the setup
--   sequence; running this one file alone is the whole schema.
-- v2.3 changes: v_pipeline_health added — a one-row operational snapshot
--   (stalled audits, recent volume, AI fallback rate, most recent error).
--   Closes external review Finding 3, "no operational status view"
--   (decision_log.md D-83). No DDL change to any table.
-- v2.2 changes: Node 15 (Insert Instrument Items) reference query written
--   for the first time — the table has existed since v2.0, but the write
--   path was cut for time (decision_log.md D-14/D-20/D-34) and never had
--   one. No DDL change; `domain` (existing, nullable column) is now
--   actually populated, derived from knowledge_base.md's item ranges.
--   Phase 2, Woche 1b — see A11yAudit_Fahrplan.md.
-- v2.1 changes: added audit_runs table (one row per execution, not per
--   content — audits itself only ever holds the latest run's values, so
--   repeat audits of the same page lose every prior observation. Enables
--   the Phase 2 scoring-stability measurement and per-run LLM cost
--   tracking. Phase 2, Woche 1a — see A11yAudit_Fahrplan.md.
-- v2.0 changes: added instrument_items table (per-item audit trail),
--   PEMAT/CCI subscores on audits, instrument reference on findings,
--   safety_terms_found, not_assessed_count, v_audit_summary view.
-- v1.0: audits, findings, error_log, v_review_queue.
--
-- Run once:
--   docker compose exec -T postgres psql -U <user> -d <db> < postgres_schema.sql
-- Verify:
--   \dt   and   \dv     (expect 5 tables, 3 views)
-- ================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ----------------------------------------------------------------
-- audits — one row per audited content item (upsert by content_hash)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audits (
    audit_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash        text NOT NULL UNIQUE,
    source_type         text NOT NULL CHECK (source_type IN ('url','text')),
    page_url            text,
    page_title          text,
    content_language    text NOT NULL DEFAULT 'en',
    audience            text NOT NULL,          -- required by CCI methodology
    content_excerpt     text,                   -- first ~500 chars; anonymized test data only
    word_count          integer,
    is_very_short       boolean NOT NULL DEFAULT false,
    eaa_scope           boolean NOT NULL DEFAULT false,
    auditor_note        text,

    -- WCAG screening result (deliberately NOT named "conformance" — the tool
    -- screens a listed subset of criteria and makes no conformance claim)
    screening_score     integer CHECK (screening_score BETWEEN 0 AND 100),
    screening_label     text CHECK (screening_label IN
                          ('no issues in screened subset','issues found','severe issues found')),

    -- Instrument subscores — deliberately NOT blended with screening_score
    pemat_understandability numeric(5,2) CHECK (pemat_understandability BETWEEN 0 AND 100),
    pemat_actionability     numeric(5,2) CHECK (pemat_actionability     BETWEEN 0 AND 100),
    cci_score               numeric(5,2) CHECK (cci_score               BETWEEN 0 AND 100),
    not_assessed_count      integer NOT NULL DEFAULT 0,

    -- routing / provenance
    human_review_required boolean NOT NULL DEFAULT false,
    legally_relevant      boolean NOT NULL DEFAULT false,
    triggered_rules       text[] NOT NULL DEFAULT '{}',   -- e.g. {R1,R7,R9}
    safety_terms_found    text[] NOT NULL DEFAULT '{}',   -- deterministic prescreen hits
    ai_model              text,
    ai_fallback_used      boolean NOT NULL DEFAULT false,
    ai_disagreement       boolean NOT NULL DEFAULT false,
    automated_checks_skipped boolean NOT NULL DEFAULT false,
    content_truncated     boolean NOT NULL DEFAULT false,

    -- provenance for the system's central claims (originally
    -- postgres_schema_addendum.sql, 31 July; merged in place here v2.4,
    -- 19 August, decision_log.md D-84 — two files for one schema was an
    -- ordering trap at setup time: the addendum's own header called it
    -- "safe to skip", true when written, false since 4 August once
    -- code/13_upsert_audit.sql started naming dropped_unverified/
    -- checks_engine directly in its fixed INSERT column list. One file,
    -- no ordering to get wrong, closes that risk structurally rather
    -- than by warning about it. See decision_log.md D-82/D-83 for the
    -- warnings this superseded.)
    dropped_unverified    integer DEFAULT 0, -- AI findings discarded because the evidence quote could not be located verbatim in the source. Rises = the model is fabricating more.
    checks_engine         text CHECK (checks_engine IN ('cheerio', 'regex', 'none')), -- which HTML parser produced the deterministic checks: cheerio (full), regex (retired, decision_log.md D-69 — no row should carry this value on or after 18 August), none (text branch)

    -- outputs
    report_md           text,
    statement_draft     text,

    status              text NOT NULL DEFAULT 'in_progress'
                          CHECK (status IN ('in_progress','completed','needs_review','failed')),
    run_count           integer NOT NULL DEFAULT 1,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    completed_at        timestamptz
);

CREATE INDEX IF NOT EXISTS idx_audits_status ON audits (status);
CREATE INDEX IF NOT EXISTS idx_audits_created ON audits (created_at DESC);

-- ----------------------------------------------------------------
-- findings — one row per barrier (deterministic or AI-proposed)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS findings (
    finding_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id            uuid NOT NULL REFERENCES audits(audit_id) ON DELETE CASCADE,
    finding_key         text NOT NULL,
    source              text NOT NULL CHECK (source IN ('automated','ai')),

    wcag_criterion      text,                   -- '1.1.1' or NULL
    wcag_level          text CHECK (wcag_level IN ('A','AA','AAA')),
    instrument          text CHECK (instrument IN ('PEMAT','CCI')),
    instrument_item     integer,
    category            text NOT NULL CHECK (category IN
                          ('perceivable','operable','understandable','robust','cognitive')),

    severity            text NOT NULL CHECK (severity IN ('critical','high','medium','low')),
    confidence          numeric(3,2) NOT NULL DEFAULT 1.00
                          CHECK (confidence BETWEEN 0 AND 1),
    title               text NOT NULL,
    explanation_plain   text NOT NULL,
    recommendation      text NOT NULL,
    evidence            text,
    evidence_verified   boolean NOT NULL DEFAULT false,  -- quote found verbatim in source

    human_review_required boolean NOT NULL DEFAULT false,
    review_reason       text,                   -- 'R1'..'R9'
    status              text NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open','confirmed','dismissed')),
    reviewer_note       text,
    reviewed_at         timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),

    -- merged from postgres_schema_addendum.sql, v2.4 (D-84) — see the note
    -- on audits' own dropped_unverified/checks_engine above for why
    original_severity   text CHECK (original_severity IN ('critical','high','medium','low')), -- severity as reported before a deterministic rule upgraded it; NULL if never upgraded
    severity_upgraded_by text,                  -- rule that forced the upgrade, e.g. 'R9' (undefined medical term in safety-relevant content)

    UNIQUE (audit_id, finding_key),
    -- an instrument reference must name both instrument and item, or neither
    CONSTRAINT chk_instrument_pair CHECK (
        (instrument IS NULL AND instrument_item IS NULL)
     OR (instrument IS NOT NULL AND instrument_item IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_findings_audit    ON findings (audit_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings (severity);
CREATE INDEX IF NOT EXISTS idx_findings_criterion ON findings (wcag_criterion);
CREATE INDEX IF NOT EXISTS idx_findings_review   ON findings (human_review_required)
    WHERE human_review_required;

-- ----------------------------------------------------------------
-- instrument_items — per-item audit trail of the assessment itself.
-- This is what a reviewer inspects to check the tool's reasoning.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instrument_items (
    item_row_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id        uuid NOT NULL REFERENCES audits(audit_id) ON DELETE CASCADE,
    instrument      text NOT NULL CHECK (instrument IN ('PEMAT','CCI')),
    item_no         integer NOT NULL,
    domain          text CHECK (domain IN
                      ('understandability','actionability',
                       'core','behavioral','numbers','risk')),
    verdict         text NOT NULL CHECK (verdict IN
                      ('pass','fail','not_applicable','not_assessed')),
    decided_by      text NOT NULL CHECK (decided_by IN ('deterministic','ai','human')),
    rationale       text,
    evidence        text,
    overridden_by_human boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),

    -- merged from postgres_schema_addendum.sql, v2.4 (D-84)
    ai_contradiction text,                      -- what the AI claimed where the deterministic verdict disagreed; the deterministic verdict stands, this records the disagreement that fired R6

    UNIQUE (audit_id, instrument, item_no)
);

CREATE INDEX IF NOT EXISTS idx_items_audit ON instrument_items (audit_id);
CREATE INDEX IF NOT EXISTS idx_items_fail  ON instrument_items (instrument, item_no)
    WHERE verdict = 'fail';

-- ----------------------------------------------------------------
-- audit_runs — one row per execution (added v2.1, Phase 2 Woche 1a).
-- `audits` holds one row per content item and is upserted on repeat runs,
-- so only the latest run's values survive. This table keeps every run,
-- which is what the scoring-stability measurement (Woche 2) and the
-- LLM-cost tracking below both need.
--
-- DELIBERATE OMISSION: no screening_label / screening_label_deterministic
-- columns, unlike `audits`. Both are a pure function of the corresponding
-- score (see label() in 12_decision_engine.js) — storing them here would
-- duplicate data that any query can derive from the score column already
-- present. `audits` keeps them because reports read directly off that row;
-- audit_runs is read for analysis, where re-deriving the label is trivial.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_runs (
    run_id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id                uuid NOT NULL REFERENCES audits(audit_id) ON DELETE CASCADE,
    run_no                  integer NOT NULL,
    execution_id            text,
    executed_at             timestamptz NOT NULL DEFAULT now(),

    checks_engine                  text NOT NULL DEFAULT 'none'
                                     CHECK (checks_engine IN ('cheerio', 'regex', 'none')),
    screening_score                integer CHECK (screening_score BETWEEN 0 AND 100),
    screening_score_deterministic  integer CHECK (screening_score_deterministic BETWEEN 0 AND 100),
    pemat_understandability        numeric(5,2) CHECK (pemat_understandability BETWEEN 0 AND 100),
    pemat_actionability            numeric(5,2) CHECK (pemat_actionability     BETWEEN 0 AND 100),
    cci_score                      numeric(5,2) CHECK (cci_score               BETWEEN 0 AND 100),
    -- NOT NULL here, unlike audits.dropped_unverified (postgres_schema_addendum.sql,
    -- nullable) — deliberate tightening, not an oversight: this count is always
    -- computed, never genuinely unknown, so NOT NULL DEFAULT 0 is the more
    -- correct constraint. Noted here so the divergence from `audits` reads as
    -- intentional if anyone compares the two.
    dropped_unverified             integer NOT NULL DEFAULT 0,
    not_assessed_count             integer NOT NULL DEFAULT 0,

    ai_model                text,
    ai_fallback_used        boolean NOT NULL DEFAULT false,
    ai_disagreement         boolean NOT NULL DEFAULT false,
    ai_input_tokens          integer,
    ai_output_tokens         integer,
    ai_cost_usd              numeric(10,6),
    triggered_rules          text[] NOT NULL DEFAULT '{}',

    UNIQUE (audit_id, run_no)
);

CREATE INDEX IF NOT EXISTS idx_runs_audit ON audit_runs (audit_id);

COMMENT ON COLUMN audit_runs.execution_id IS
  'n8n execution_entity id for this run, so a specific run can be traced back to its raw execution data (same technique used for the Tag 6 fetch-failure proof and D-36/E11).';
COMMENT ON COLUMN audit_runs.screening_score_deterministic IS
  'The deterministic-only component of the combined screening_score, at run granularity. Comparing this against screening_score across repeat runs of the same page is the scoring-stability measurement (docs/scoring-stability.md) — this column stays constant across runs while the combined score should not.';
COMMENT ON COLUMN audit_runs.ai_input_tokens IS
  'Input tokens for this run, summed across both AI attempts if a repair attempt occurred — reflects what the run actually cost, not just the first call. Requires verifying that the n8n Anthropic node surfaces usage in its output; not yet confirmed against a real execution.';
COMMENT ON COLUMN audit_runs.ai_output_tokens IS
  'Output tokens for this run, same summing rule as ai_input_tokens.';
COMMENT ON COLUMN audit_runs.ai_cost_usd IS
  'Cost computed at write time from the Anthropic price per token in effect for ai_model on executed_at, not recomputed from current pricing on read — so historical costs stay accurate if Anthropic changes prices later.';

-- ----------------------------------------------------------------
-- error_log — metadata only, never content (GDPR data minimisation)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS error_log (
    error_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at     timestamptz NOT NULL DEFAULT now(),
    workflow_name   text NOT NULL,
    node_name       text,
    error_class     text,      -- 'validation_failed','api_error','http_timeout','no_content',...
    error_message   text,      -- sanitized; no payload
    execution_id    text
);

-- ----------------------------------------------------------------
-- v_review_queue — the human-in-the-loop worklist
-- ----------------------------------------------------------------
-- REVIEW FIX (10 Aug, pre-commit review Teil 1 #1 / decision_log.md D-47):
-- was an INNER JOIN gated on f.human_review_required (set only by R1/R9,
-- see 14a_build_findings_payload.js) — an audit escalated by R2..R8 with no
-- individually-flagged finding row (e.g. an AI-fallback audit with zero
-- findings) never appeared here at all, despite audits.status = 'needs_review'.
-- LEFT JOIN with the finding-selection conditions moved into ON (not WHERE,
-- which would silently re-narrow the LEFT JOIN back to INNER) makes audit-row
-- visibility depend only on the audit itself; finding detail still shows
-- where a qualifying finding exists.
CREATE OR REPLACE VIEW v_review_queue AS
SELECT
    a.audit_id, a.page_url, a.page_title, a.audience,
    a.screening_score, a.screening_label,
    a.pemat_understandability, a.pemat_actionability, a.cci_score,
    a.legally_relevant, a.triggered_rules, a.safety_terms_found,
    f.finding_id, f.finding_key, f.severity, f.confidence,
    f.instrument, f.instrument_item, f.title, f.review_reason,
    f.evidence_verified, f.status AS finding_status,
    a.created_at
FROM audits a
LEFT JOIN findings f
       ON f.audit_id = a.audit_id
      AND f.human_review_required
      AND f.status = 'open'
WHERE a.status = 'needs_review'
  AND a.human_review_required
ORDER BY
    CASE f.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3 ELSE 4 END,
    a.created_at;

-- ----------------------------------------------------------------
-- v_audit_summary — cross-audit reporting (the payoff over Sheets)
-- e.g. "which criterion fails most often across all audited pages?"
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW v_audit_summary AS
SELECT
    COALESCE(f.wcag_criterion,
             f.instrument || ' item ' || f.instrument_item::text,
             'unclassified')          AS criterion,
    f.severity,
    COUNT(*)                          AS occurrences,
    COUNT(DISTINCT f.audit_id)        AS affected_audits,
    ROUND(AVG(f.confidence), 2)       AS avg_confidence,
    SUM(CASE WHEN f.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_by_human,
    SUM(CASE WHEN f.status = 'dismissed' THEN 1 ELSE 0 END) AS dismissed_by_human
FROM findings f
GROUP BY 1, 2
ORDER BY occurrences DESC;

-- Note: once enough audits are reviewed, dismissed_by_human / occurrences
-- gives an empirical false-positive rate per criterion — the beginning of
-- a validation story for the tool. See decision_log.md D-09.

-- ----------------------------------------------------------------
-- v_pipeline_health — one-row operational snapshot
-- Added 19 August 2026 (rigorous review, decision_log.md D-82/external
-- review Finding 3: "no operational status view"). v_review_queue answers
-- "what needs a human", v_audit_summary answers "what does the corpus
-- look like" — neither answers "is the pipeline itself currently healthy".
-- A single row rather than a table: this is a status check (SELECT * FROM
-- v_pipeline_health;), not a report to page through.
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW v_pipeline_health AS
SELECT
    -- build_runbook.md E12's known risk made queryable: no transaction
    -- spans Nodes 13-15/17/19, so a crash mid-pipeline (e.g. Postgres
    -- restarting) leaves a row stuck in 'in_progress' forever, indistin-
    -- guishable from "still running" without a time threshold. A real
    -- audit run measures 59-69s end to end (decision_log.md D-54); 10
    -- minutes gives generous margin before counting a row as stalled
    -- rather than merely slow.
    (SELECT COUNT(*) FROM audits
      WHERE status = 'in_progress' AND updated_at < now() - interval '10 minutes')
                                                          AS stalled_audits,
    (SELECT COUNT(*) FROM audits WHERE created_at > now() - interval '24 hours')
                                                          AS audits_last_24h,
    (SELECT COUNT(*) FROM audits
      WHERE ai_fallback_used AND created_at > now() - interval '24 hours')
                                                          AS ai_fallbacks_last_24h,
    (SELECT COUNT(*) FROM error_log WHERE occurred_at > now() - interval '24 hours')
                                                          AS errors_last_24h,
    (SELECT error_class FROM error_log ORDER BY occurred_at DESC LIMIT 1)
                                                          AS last_error_class,
    (SELECT occurred_at FROM error_log ORDER BY occurred_at DESC LIMIT 1)
                                                          AS last_error_at,
    (SELECT MAX(created_at) FROM audits)                 AS last_audit_at;

-- ----------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audits_updated ON audits;
CREATE TRIGGER trg_audits_updated
    BEFORE UPDATE ON audits
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ================================================================
-- Reference queries used by the n8n Postgres nodes
-- ================================================================

-- Node 13 — Upsert Audit
-- CORRECTED (16 Aug, D-63): the $1..$26 positional form previously shown
-- here never matched the real node. The actual mechanism, confirmed by
-- reading it straight out of workflows_export/WF1_Audit_Intake.json rather
-- than assumed a second time: Postgres node, operation "Execute Query",
-- with a SINGLE Query Parameter ({{ $json.audit_payload }}, the whole JSON
-- string from 13a) bound to $1, unpacked via json_populate_record. The
-- stale version below cost two failed publish/test cycles before this fix.
-- INSERT INTO audits (
--   content_hash, source_type, page_url, page_title, content_language, audience,
--   content_excerpt, word_count, is_very_short, eaa_scope, auditor_note,
--   screening_score, screening_label,
--   pemat_understandability, pemat_actionability, cci_score, not_assessed_count,
--   human_review_required, legally_relevant, triggered_rules, safety_terms_found,
--   ai_model, ai_fallback_used, ai_disagreement,
--   automated_checks_skipped, content_truncated,
--   dropped_unverified, checks_engine, status
-- )
-- SELECT
--   content_hash, source_type, page_url, page_title, content_language, audience,
--   content_excerpt, word_count, is_very_short, eaa_scope, auditor_note,
--   screening_score, screening_label,
--   pemat_understandability, pemat_actionability, cci_score, not_assessed_count,
--   human_review_required, legally_relevant, triggered_rules, safety_terms_found,
--   ai_model, ai_fallback_used, ai_disagreement,
--   automated_checks_skipped, content_truncated,
--   dropped_unverified, checks_engine, status
-- FROM json_populate_record(NULL::audits, $1::json)
-- ON CONFLICT (content_hash) DO UPDATE SET
--   page_url = EXCLUDED.page_url, page_title = EXCLUDED.page_title,
--   content_language = EXCLUDED.content_language, audience = EXCLUDED.audience,
--   content_excerpt = EXCLUDED.content_excerpt, word_count = EXCLUDED.word_count,
--   is_very_short = EXCLUDED.is_very_short, eaa_scope = EXCLUDED.eaa_scope,
--   auditor_note = EXCLUDED.auditor_note, screening_score = EXCLUDED.screening_score,
--   screening_label = EXCLUDED.screening_label,
--   pemat_understandability = EXCLUDED.pemat_understandability,
--   pemat_actionability = EXCLUDED.pemat_actionability, cci_score = EXCLUDED.cci_score,
--   not_assessed_count = EXCLUDED.not_assessed_count,
--   human_review_required = EXCLUDED.human_review_required,
--   legally_relevant = EXCLUDED.legally_relevant, triggered_rules = EXCLUDED.triggered_rules,
--   safety_terms_found = EXCLUDED.safety_terms_found, ai_model = EXCLUDED.ai_model,
--   ai_fallback_used = EXCLUDED.ai_fallback_used, ai_disagreement = EXCLUDED.ai_disagreement,
--   automated_checks_skipped = EXCLUDED.automated_checks_skipped,
--   content_truncated = EXCLUDED.content_truncated,
--   dropped_unverified = EXCLUDED.dropped_unverified, checks_engine = EXCLUDED.checks_engine,
--   status = EXCLUDED.status, run_count = audits.run_count + 1, updated_at = now()
-- RETURNING audit_id, content_hash, run_count, status, screening_score,
--           human_review_required, triggered_rules;
-- run_count has always been in this RETURNING clause — the v2.1 note that
-- used to be here, claiming it needed to be added, was itself wrong (D-63).

-- Node 13b — Insert Audit Run (new v2.1, one row per execution, never upserted)
-- Same mechanism as Node 13 above: the audit_run_payload field is bound to $1
-- via the node's own Query Parameters option, json_populate_record (singular
-- — one row, not a set, unlike Node 14's json_populate_recordset below).
-- Do NOT write the binding as a live n8n expression inside a SQL comment
-- here or in the real node — n8n evaluates {{ }} expressions anywhere in a
-- Query field's text, including inside "--" comments, and a multi-line
-- value substituted into a one-line comment can break out of it mid-query.
-- Found 18 August in the real "Insert Findings" node (decision_log.md D-71)
-- after a findings payload containing an embedded newline turned a
-- documentation comment into live, malformed SQL.
-- INSERT INTO audit_runs (
--   audit_id, run_no, execution_id,
--   checks_engine, screening_score, screening_score_deterministic,
--   pemat_understandability, pemat_actionability, cci_score,
--   dropped_unverified, not_assessed_count,
--   ai_model, ai_fallback_used, ai_disagreement,
--   ai_input_tokens, ai_output_tokens, ai_cost_usd, triggered_rules
-- )
-- SELECT
--   audit_id, run_no, execution_id,
--   checks_engine, screening_score, screening_score_deterministic,
--   pemat_understandability, pemat_actionability, cci_score,
--   dropped_unverified, not_assessed_count,
--   ai_model, ai_fallback_used, ai_disagreement,
--   ai_input_tokens, ai_output_tokens, ai_cost_usd, triggered_rules
-- FROM json_populate_record(NULL::audit_runs, $1::json)
-- RETURNING run_id;

-- Node 14 — Insert Findings (idempotent)
-- INSERT INTO findings (...) VALUES (...)
-- ON CONFLICT (audit_id, finding_key) DO UPDATE SET
--     severity = EXCLUDED.severity, confidence = EXCLUDED.confidence,
--     explanation_plain = EXCLUDED.explanation_plain,
--     recommendation = EXCLUDED.recommendation;

-- Node 15 — Insert Instrument Items (new v2.2, Phase 2 Woche 1b, idempotent)
-- Written 17 Aug against code/15a_build_instrument_items_payload.js, same
-- json_populate_recordset mechanism as Node 14 above (a set of rows, not a
-- single one — unlike Node 13b's json_populate_record). Query Parameters
-- (Options): {{ $json.instrument_items_payload }}
-- INSERT INTO instrument_items (
--   audit_id, instrument, item_no, domain, verdict, decided_by,
--   rationale, evidence, overridden_by_human, ai_contradiction
-- )
-- SELECT
--   audit_id, instrument, item_no, domain, verdict, decided_by,
--   rationale, evidence, overridden_by_human, ai_contradiction
-- FROM json_populate_recordset(NULL::instrument_items, $1::json)
-- ON CONFLICT (audit_id, instrument, item_no) DO UPDATE SET
--     domain            = EXCLUDED.domain,
--     verdict           = EXCLUDED.verdict,
--     decided_by        = EXCLUDED.decided_by,
--     rationale         = EXCLUDED.rationale,
--     evidence          = EXCLUDED.evidence,
--     ai_contradiction  = EXCLUDED.ai_contradiction
--     -- overridden_by_human deliberately NOT in this SET list: once true,
--     -- a re-audit's upsert can never flip it back to false by omission.
-- WHERE instrument_items.overridden_by_human = false   -- never overwrite a human
-- RETURNING item_row_id, instrument, item_no, verdict;
