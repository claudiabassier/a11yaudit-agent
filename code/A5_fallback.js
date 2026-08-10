/**
 * ============================================================================
 * Node: A5 — Fallback (Code)   ·   Subworkflow: SUB-A
 * Spec: workflow_spec.md §2 (A5 fallback object), v2.1
 * Written Day 2, 3 August 2026.
 * ============================================================================
 *
 * PURPOSE
 *   The end of the unsafe path. Reached when the AI call failed outright
 *   (api_error) or when its output was still invalid after one repair
 *   attempt. Emits an explicit, honest "no analysis" object.
 *
 *   This node is the concrete form of the project's core principle: the
 *   system never silently degrades. It does not return an empty findings
 *   list that looks like a clean page. It returns analysis_status
 *   "fallback", which WF1's rule R2 converts into MANDATORY HUMAN AUDIT.
 *   An audit with no AI contribution is a correct outcome; an audit that
 *   looks complete but is not is the one failure mode this design forbids.
 *
 * EXPECTED INPUT (one item — the output of A4 Validate Output, arriving via
 * either the "API error" branch or the second failed validation)
 *   { valid: false, api_error: boolean, attempt: number, errors: string[] }
 *
 * OUTPUT (one item — the fallback object, flat, as Node 11 expects)
 *   { schema_version, analysis_status: "fallback", summary, findings: [],
 *     instrument_items: [], positive_observations: [],
 *     fallback_reason: "api_error" | "validation_failed",
 *     attempt, errors, dropped_unverified: 0, missing_items_count: 0 }
 *
 * NOTE ON fallback_reason
 *   Distinguishing the two reasons matters for the error log and for the
 *   report's limitations section: "the AI was unreachable" and "the AI
 *   answered but could not produce valid output twice" are different
 *   failures with different implications for a re-run.
 *
 * ---------------------------------------------------------------------------
 * TEST INPUT — pin on this node to run it standalone:
 *
 * [{ "valid": false, "api_error": true, "attempt": 1,
 *    "errors": ["api_error: Bad request - please check your parameters"] }]
 *
 * Expect: fallback_reason "api_error", findings [], instrument_items [].
 * ---------------------------------------------------------------------------
 */

const MAX_ERRORS_KEPT = 10;   // keep the log readable; full detail is in the execution

const input = ($input.all()[0] || {}).json || {};

const apiError = input.api_error === true;
const reason = apiError ? 'api_error' : 'validation_failed';

// Errors are carried through so the report and error_log can say WHY the
// analysis is missing. Truncated, never dropped entirely.
const errors = Array.isArray(input.errors)
  ? input.errors.slice(0, MAX_ERRORS_KEPT).map((e) => String(e))
  : [];

return [{
  json: {
    schema_version: '2.0',
    analysis_status: 'fallback',
    summary: 'AI analysis unavailable or invalid after retry. Full human audit required.',
    findings: [],
    instrument_items: [],
    positive_observations: [],
    fallback_reason: reason,
    attempt: Number(input.attempt) || 1,
    errors,
    // Present so downstream nodes can read them unconditionally:
    dropped_unverified: 0,
    missing_items_count: 0,
  },
}];
