/**
 * ============================================================================
 * Node 14a — Build Findings Payload (Code)   ·   Workflow: WF1
 * Added 4 Aug (Day 3/4 build) — see decision_log.md D-26. Not in the v2.1 spec.
 * ============================================================================
 *
 * PURPOSE
 *   Attach the audit_id returned by Node 13 to every merged finding and emit
 *   one JSON string, so Node 14 is a single parameterised query
 *   (`json_populate_recordset`) rather than a per-row loop.
 *
 * EXPECTED INPUT
 *   audit_id    — read via $('Upsert Audit') lookup, NOT the direct input
 *     item. UPDATE (16 Aug, Phase 2 Woche 1a): this node's direct predecessor
 *     used to be Node 13 (Upsert Audit) itself, so reading $input.all()[0]
 *     worked. Since audit_runs, Build Audit Run Payload + Insert Audit Run
 *     now sit between them on the canvas, and Insert Audit Run's own output
 *     (run_id only) is what actually reaches $input here — audit_id must be
 *     looked up explicitly instead, same $() pattern this file already uses
 *     for findings below, and the same pattern 13b_build_audit_run_payload.js
 *     uses for values that are no longer on the same item.
 *   findings    — read from $('Decision Engine') (R9 severity upgrades applied)
 *
 * OUTPUT (one item)
 *   { json: { findings_payload: "<json string>", findings_count: n, audit_id } }
 *
 * FIELD NOTES (defend these in review)
 *   evidence_verified — AI findings carry the flag set by SUB-A's A4, which
 *     verified the quote verbatim against the source. Automated findings have
 *     no such flag because their evidence is sliced directly out of the parsed
 *     HTML by the check itself; they are therefore recorded as verified.
 *   review_reason — the deterministic rule that acted on this specific
 *     finding. Only R9 acts per-finding (severity upgrade); audit-level rules
 *     live in audits.triggered_rules, not here.
 * ============================================================================
 */

let audit_id;
try { audit_id = $('Upsert Audit').first().json.audit_id; } catch (e) { audit_id = undefined; }
if (!audit_id) throw new Error('Build Findings Payload: no audit_id returned by Upsert Audit (Node 13).');

let findings = [];
try { findings = $('Decision Engine').first().json.findings || []; } catch (e) { findings = []; }

const numOrNull = (v) => (v === null || v === undefined || Number.isNaN(v) ? null : Number(v));

// The model sometimes emits the STRING "null" instead of JSON null (observed
// 4 Aug on findings ai-010/018/019). Left unhandled, "null" reaches Postgres
// and violates findings_instrument_check / chk_instrument_pair. See D-27.
const strOrNull = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return (s === '' || s.toLowerCase() === 'null') ? null : s;
};

const rows = findings.map((f) => ({
  audit_id,
  finding_key: f.finding_key,
  source: f.source,
  wcag_criterion: strOrNull(f.wcag_criterion),
  wcag_level: strOrNull(f.wcag_level),
  instrument: strOrNull(f.instrument),
  instrument_item: numOrNull(f.instrument_item),
  category: f.category,
  severity: f.severity,
  confidence: numOrNull(f.confidence) ?? 1,
  title: f.title,
  explanation_plain: f.explanation_plain,
  recommendation: f.recommendation,
  evidence: f.evidence ?? null,
  evidence_verified: f.evidence_verified ?? (f.source === 'automated'),
  human_review_required: !!f.severity_upgraded_by || f.severity === 'critical',
  review_reason: f.severity_upgraded_by ?? null,
  original_severity: f.original_severity ?? null,
  severity_upgraded_by: f.severity_upgraded_by ?? null,
}));

// schema constraint chk_instrument_pair: instrument and item must both be set
// or both null. Fail loudly here rather than as an opaque Postgres error.
for (const r of rows) {
  if ((r.instrument === null) !== (r.instrument_item === null)) {
    throw new Error(`Build Findings Payload: finding "${r.finding_key}" names an instrument without an item (or vice versa); violates chk_instrument_pair.`);
  }
}

return [{ json: { findings_payload: JSON.stringify(rows), findings_count: rows.length, audit_id } }];
