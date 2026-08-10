/**
 * ============================================================================
 * Node 13a — Build Audit Payload (Code)   ·   Workflow: WF1
 * Added 4 Aug (Day 3/4 build) — see decision_log.md D-26. Not in the v2.1 spec.
 * ============================================================================
 *
 * PURPOSE
 *   Produce ONE JSON string containing exactly the columns of `audits` that
 *   this workflow writes, so Node 13 can be a single parameterised query
 *   (`json_populate_record`) instead of a 29-field UI column mapping.
 *   Rationale: two columns are text[]; n8n's Postgres mapping UI does not
 *   reliably coerce JS arrays to Postgres arrays, and hand-built SQL would
 *   have to escape audit content containing quotes.
 *
 * EXPECTED INPUT (one item, from Node 12 Decision Engine)
 * OUTPUT (one item)
 *   { json: { audit_payload: "<json string>", audit_preview: {…} } }
 *   audit_preview exists only so the values are readable on the canvas.
 * ============================================================================
 */

const j = $input.all()[0].json || {};

const numOrNull = (v) => (v === null || v === undefined || Number.isNaN(v) ? null : Number(v));
const arr = (v) => (Array.isArray(v) ? v : []);

const payload = {
  // identity / provenance
  content_hash: j.content_hash,
  source_type: j.source_type,
  page_url: j.page_url ?? null,
  page_title: j.page_title ?? null,
  content_language: j.content_language ?? 'en',
  audience: j.audience,
  content_excerpt: (j.content_text || '').slice(0, 500),
  word_count: numOrNull(j.word_count),
  is_very_short: !!j.is_very_short,
  eaa_scope: !!j.eaa_scope,
  auditor_note: j.auditor_note ?? null,

  // scores — four separate numbers, never blended (D-05)
  screening_score: numOrNull(j.screening_score),
  screening_label: j.screening_label ?? null,
  pemat_understandability: numOrNull(j.pemat_understandability),
  pemat_actionability: numOrNull(j.pemat_actionability),
  cci_score: numOrNull(j.cci_score),
  not_assessed_count: numOrNull(j.not_assessed_count) ?? 0,

  // routing
  human_review_required: !!j.human_review_required,
  legally_relevant: !!j.legally_relevant,
  triggered_rules: arr(j.triggered_rules),
  safety_terms_found: arr(j.safety_terms_found),

  // AI provenance. SUB-A does not return the model name, so this is recorded
  // from configuration (D-22), not observed from the response — see D-26.
  ai_model: j.ai_model ?? 'claude-sonnet-4-6',
  ai_fallback_used: !!j.ai_fallback_used,
  ai_disagreement: !!j.ai_disagreement,
  automated_checks_skipped: !!j.automated_checks_skipped,
  content_truncated: !!j.content_truncated,
  dropped_unverified: numOrNull(j.dropped_unverified) ?? 0,
  checks_engine: j.checks_engine ?? 'none',

  // 'completed' is set by Node 19 once a report exists; until then the audit
  // is either awaiting review or still in progress.
  status: j.human_review_required ? 'needs_review' : 'in_progress',
};

if (!payload.content_hash) throw new Error('Build Audit Payload: content_hash missing — Node 8 did not run.');
if (!payload.audience) throw new Error('Build Audit Payload: audience missing — required by the CCI methodology and NOT NULL in the schema.');

return [{ json: { audit_payload: JSON.stringify(payload), audit_preview: payload } }];
