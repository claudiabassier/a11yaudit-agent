-- ===========================================================================
-- Node 19 — Save Report   ·   Workflow: WF1
-- Postgres node, operation "Execute Query".
-- Query Parameters (Options):  {{ JSON.stringify($json) }}
--
-- Node 18 emits exactly { report_md, statement_draft, completed_at, status,
-- audit_id }, so the whole item can be passed as one JSON parameter — no
-- payload-builder node needed here. json_populate_record ignores JSON keys
-- that do not match a column, and casts the ISO timestamp string itself.
-- Same reasoning as D-26: report_md is markdown full of quotes and angle
-- brackets, so it must never be interpolated into SQL by hand.
--
-- status comes from Node 18: 'needs_review' if any rule fired, else
-- 'completed'. This is the only place an audit reaches 'completed' — an
-- audit without a report is by definition not finished.
-- ===========================================================================
UPDATE audits
   SET report_md       = p.report_md,
       statement_draft = p.statement_draft,
       completed_at    = p.completed_at,
       status          = p.status,
       updated_at      = now()
  FROM json_populate_record(NULL::audits, $1::json) p
 WHERE audits.audit_id = p.audit_id
RETURNING audits.audit_id, audits.status, audits.completed_at,
          length(audits.report_md)       AS report_chars,
          length(audits.statement_draft) AS statement_chars;
