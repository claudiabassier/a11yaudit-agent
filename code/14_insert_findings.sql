-- ===========================================================================
-- Node 14 — Insert Findings   ·   Workflow: WF1
-- Postgres node, operation "Execute Query".
-- Query Parameters (Options):  {{ $json.findings_payload }}
--
-- Idempotent on (audit_id, finding_key) — spec Node 14. A re-run refreshes
-- the analysis fields but deliberately does NOT touch status, reviewer_note
-- or reviewed_at: re-auditing a page must not erase a reviewer's decisions.
-- ===========================================================================
INSERT INTO findings (
  audit_id, finding_key, source, wcag_criterion, wcag_level,
  instrument, instrument_item, category, severity, confidence,
  title, explanation_plain, recommendation, evidence, evidence_verified,
  human_review_required, review_reason, original_severity, severity_upgraded_by
)
SELECT
  audit_id, finding_key, source, wcag_criterion, wcag_level,
  instrument, instrument_item, category, severity, confidence,
  title, explanation_plain, recommendation, evidence, evidence_verified,
  human_review_required, review_reason, original_severity, severity_upgraded_by
FROM json_populate_recordset(NULL::findings, $1::json)
ON CONFLICT (audit_id, finding_key) DO UPDATE SET
  source               = EXCLUDED.source,
  wcag_criterion       = EXCLUDED.wcag_criterion,
  wcag_level           = EXCLUDED.wcag_level,
  instrument           = EXCLUDED.instrument,
  instrument_item      = EXCLUDED.instrument_item,
  category             = EXCLUDED.category,
  severity             = EXCLUDED.severity,
  confidence           = EXCLUDED.confidence,
  title                = EXCLUDED.title,
  explanation_plain    = EXCLUDED.explanation_plain,
  recommendation       = EXCLUDED.recommendation,
  evidence             = EXCLUDED.evidence,
  evidence_verified    = EXCLUDED.evidence_verified,
  human_review_required= EXCLUDED.human_review_required,
  review_reason        = EXCLUDED.review_reason,
  original_severity    = EXCLUDED.original_severity,
  severity_upgraded_by = EXCLUDED.severity_upgraded_by
RETURNING finding_id, finding_key, severity, review_reason;
