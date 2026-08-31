-- ===========================================================================
-- Node 13 — Upsert Audit   ·   Workflow: WF1
-- Postgres node, operation "Execute Query".
-- Query Parameters (Options): field "audit_payload" -- bound via the node's own Query Parameters option, NOT evaluated here. Never put a live n8n expression inside this comment: n8n evaluates expressions anywhere in the Query text, including inside SQL comments (decision_log.md D-71).
--
-- Idempotent on content_hash (spec Node 13): re-auditing identical content
-- updates the same row and increments run_count instead of creating a twin.
-- ===========================================================================
INSERT INTO audits (
  content_hash, source_type, page_url, page_title, content_language, audience,
  content_excerpt, word_count, is_very_short, eaa_scope, auditor_note,
  screening_score, screening_label,
  pemat_understandability, pemat_actionability, cci_score, not_assessed_count,
  human_review_required, legally_relevant, triggered_rules, safety_terms_found,
  ai_model, ai_fallback_used, ai_disagreement,
  automated_checks_skipped, content_truncated,
  dropped_unverified, checks_engine, status
)
SELECT
  content_hash, source_type, page_url, page_title, content_language, audience,
  content_excerpt, word_count, is_very_short, eaa_scope, auditor_note,
  screening_score, screening_label,
  pemat_understandability, pemat_actionability, cci_score, not_assessed_count,
  human_review_required, legally_relevant, triggered_rules, safety_terms_found,
  ai_model, ai_fallback_used, ai_disagreement,
  automated_checks_skipped, content_truncated,
  dropped_unverified, checks_engine, status
FROM json_populate_record(NULL::audits, $1::json)
ON CONFLICT (content_hash) DO UPDATE SET
  page_url                = EXCLUDED.page_url,
  page_title              = EXCLUDED.page_title,
  content_language        = EXCLUDED.content_language,
  audience                = EXCLUDED.audience,
  content_excerpt         = EXCLUDED.content_excerpt,
  word_count              = EXCLUDED.word_count,
  is_very_short           = EXCLUDED.is_very_short,
  eaa_scope               = EXCLUDED.eaa_scope,
  auditor_note            = EXCLUDED.auditor_note,
  screening_score         = EXCLUDED.screening_score,
  screening_label         = EXCLUDED.screening_label,
  pemat_understandability = EXCLUDED.pemat_understandability,
  pemat_actionability     = EXCLUDED.pemat_actionability,
  cci_score               = EXCLUDED.cci_score,
  not_assessed_count      = EXCLUDED.not_assessed_count,
  human_review_required   = EXCLUDED.human_review_required,
  legally_relevant        = EXCLUDED.legally_relevant,
  triggered_rules         = EXCLUDED.triggered_rules,
  safety_terms_found      = EXCLUDED.safety_terms_found,
  ai_model                = EXCLUDED.ai_model,
  ai_fallback_used        = EXCLUDED.ai_fallback_used,
  ai_disagreement         = EXCLUDED.ai_disagreement,
  automated_checks_skipped= EXCLUDED.automated_checks_skipped,
  content_truncated       = EXCLUDED.content_truncated,
  dropped_unverified      = EXCLUDED.dropped_unverified,
  checks_engine           = EXCLUDED.checks_engine,
  status                  = EXCLUDED.status,
  run_count               = audits.run_count + 1,
  updated_at              = now()
RETURNING audit_id, content_hash, run_count, status, screening_score,
          human_review_required, triggered_rules;
