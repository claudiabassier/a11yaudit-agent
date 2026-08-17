/**
 * ============================================================================
 * Node 13b — Build Audit Run Payload (Code)   ·   Workflow: WF1
 * Added 15 Aug (Phase 2, Woche 1a) — see A11yAudit_Fahrplan.md Phase 2 /
 * Woche 1a. Not in the v2.1 spec. decision_log.md entry not yet written —
 * D-62 already exists (D-62 is the prompt-injection mitigation, a separate
 * Woche 1b slice); this table's own entry follows once the whole audit_runs
 * slice (schema + this payload builder + canvas wiring + verification) is
 * complete, not before — same discipline as the rest of this session.
 * ============================================================================
 *
 * PURPOSE
 *   Produce ONE JSON string for the audit_runs INSERT (Node 13b-pg), the
 *   same pattern as 13a_build_audit_payload.js: one parameterised query via
 *   json_populate_record instead of an 18-field UI column mapping.
 *
 *   Sibling of 13a, not a replacement — 13a upserts the current-state row
 *   in `audits`; this inserts a new, never-overwritten row in `audit_runs`
 *   for the same execution. Both run after Node 13 (Postgres, Upsert
 *   Audit), because run_no needs the post-upsert run_count.
 *
 * EXPECTED INPUT (one item)
 *   The RETURNING row from Node 13: { audit_id, run_count }.
 *   Everything else is read from $('Decision Engine') — same $() lookup
 *   pattern 14a_build_findings_payload.js already uses for findings, for
 *   the same reason: Node 13's Postgres write sits between this node and
 *   Decision Engine on the canvas, so the values are no longer on the
 *   same item by the time this node runs.
 *
 * OUTPUT (one item)
 *   { json: { audit_run_payload: "<json string>", audit_run_preview: {…} } }
 *
 * KNOWN GAP — ai_input_tokens / ai_output_tokens / ai_cost_usd (D-?? pending)
 *   Not populated yet. Two unresolved things, not one:
 *     1. Unconfirmed whether n8n's Anthropic node (a LangChain-style node,
 *        not a raw HTTP Request — workflow_spec.md §2 A3) surfaces token
 *        usage in its output at all, and if so, under what field. Needs
 *        checking against a real execution before anything is built on it.
 *     2. Even if it does, SUB-A's own output contract (A4_validate_output.js
 *        OUTPUT block) has no usage field — nothing currently carries token
 *        counts out of the subworkflow, through Decision Engine, to here.
 *        That is a second, separate wiring gap on top of (1).
 *   Left as explicit nulls rather than guessed at. ai_cost_usd is therefore
 *   also null until (1) and (2) are both resolved — there is nothing to
 *   price yet.
 * ============================================================================
 */

const inputRow = $input.all()[0].json || {};
const audit_id = inputRow.audit_id;
const run_count = inputRow.run_count;

if (!audit_id) throw new Error('Build Audit Run Payload: no audit_id returned by Node 13.');
if (run_count === null || run_count === undefined) {
  throw new Error('Build Audit Run Payload: no run_count returned by Node 13 — RETURNING clause must include run_count (see postgres_schema.sql v2.1 reference query).');
}

let j = {};
try { j = $('Decision Engine').first().json || {}; } catch (e) { j = {}; }

const numOrNull = (v) => (v === null || v === undefined || Number.isNaN(v) ? null : Number(v));
const arr = (v) => (Array.isArray(v) ? v : []);

const payload = {
  audit_id,
  run_no: numOrNull(run_count),
  execution_id: $execution?.id ?? null,

  checks_engine: j.checks_engine ?? 'none',
  screening_score: numOrNull(j.screening_score),
  screening_score_deterministic: numOrNull(j.screening_score_deterministic),
  pemat_understandability: numOrNull(j.pemat_understandability),
  pemat_actionability: numOrNull(j.pemat_actionability),
  cci_score: numOrNull(j.cci_score),
  dropped_unverified: numOrNull(j.dropped_unverified) ?? 0,
  not_assessed_count: numOrNull(j.not_assessed_count) ?? 0,

  ai_model: j.ai_model ?? 'claude-sonnet-4-6',
  ai_fallback_used: !!j.ai_fallback_used,
  ai_disagreement: !!j.ai_disagreement,

  // KNOWN GAP — see file header. Not wired yet, left explicit rather than
  // silently omitted so the payload shape already matches the schema.
  ai_input_tokens: null,
  ai_output_tokens: null,
  ai_cost_usd: null,

  triggered_rules: arr(j.triggered_rules),
};

return [{ json: { audit_run_payload: JSON.stringify(payload), audit_run_preview: payload } }];
