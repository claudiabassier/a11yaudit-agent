/**
 * ============================================================================
 * Node 15a — Build Instrument Items Payload (Code)   ·   Workflow: WF1
 * Added 17 Aug (Phase 2, Woche 1b) — see decision_log.md (pending),
 * A11yAudit_Fahrplan.md Phase 2 / Woche 1b. Closes the "instrument_items
 * cut for time" gap named in decision_log.md D-14/D-20/D-34.
 * ============================================================================
 *
 * PURPOSE
 *   Sibling of 14a, same reason: one parameterised query
 *   (json_populate_recordset) instead of a per-row loop or a UI column
 *   mapping. The table and its write path (Node 15) were designed in the
 *   v2.0 schema but never got a payload builder — this is the missing
 *   write path, not a new design.
 *
 * EXPECTED INPUT
 *   audit_id          — via $('Upsert Audit') lookup, NOT the direct input
 *     item. Built this way from the start, not discovered the hard way —
 *     see the D-63 postmortem on 14a_build_findings_payload.js: this
 *     node's direct predecessor is Insert Findings, whose own output does
 *     not carry audit_id either.
 *   instrument_items  — via $('Decision Engine'), same node 14a already
 *     uses for findings. Decision Engine passes instrument_items through
 *     unchanged (spread ...j in its return) — Node 11 (Merge Findings) is
 *     where deterministic-vs-AI precedence was already applied and
 *     ai_contradiction (R6) already set, if it fired.
 *
 * DOMAIN — populated here for the first time in the project. Nothing
 *   upstream sets it (grep confirmed zero hits across code/ before this
 *   file), even though the column has existed since v2.0 and knowledge_base.md
 *   already documents the mapping. Derived from instrument + item_no using
 *   the exact ranges knowledge_base.md §2/§3 define — same PEMAT ranges
 *   12_decision_engine.js already encodes as PEMAT_U/PEMAT_A, plus the CCI
 *   four-part breakdown (§3.1-3.4: Core 1-11, Behavioral 12-14, Numbers
 *   15-17, Risk 18-20). Falls back to null for any item number outside the
 *   documented set rather than guessing.
 *
 * OUTPUT (one item)
 *   { json: { instrument_items_payload: "<json string>", instrument_items_count: n, audit_id } }
 * ============================================================================
 */

let audit_id;
try { audit_id = $('Upsert Audit').first().json.audit_id; } catch (e) { audit_id = undefined; }
if (!audit_id) throw new Error('Build Instrument Items Payload: no audit_id returned by Upsert Audit (Node 13).');

let items = [];
try { items = $('Decision Engine').first().json.instrument_items || []; } catch (e) { items = []; }

const PEMAT_UNDERSTANDABILITY = new Set([1,2,3,4,5,6,7,8,9,10,11,12,15,16,17,18,19]);
const PEMAT_ACTIONABILITY = new Set([20,21,22,23,24,25,26]);
const CCI_CORE = new Set([1,2,3,4,5,6,7,8,9,10,11]);
const CCI_BEHAVIORAL = new Set([12,13,14]);
const CCI_NUMBERS = new Set([15,16,17]);
const CCI_RISK = new Set([18,19,20]);

function domainOf(instrument, itemNo) {
  const n = Number(itemNo);
  if (instrument === 'PEMAT') {
    if (PEMAT_UNDERSTANDABILITY.has(n)) return 'understandability';
    if (PEMAT_ACTIONABILITY.has(n)) return 'actionability';
    return null; // e.g. 13/14, audiovisual-only, never scored here
  }
  if (instrument === 'CCI') {
    if (CCI_CORE.has(n)) return 'core';
    if (CCI_BEHAVIORAL.has(n)) return 'behavioral';
    if (CCI_NUMBERS.has(n)) return 'numbers';
    if (CCI_RISK.has(n)) return 'risk';
    return null;
  }
  return null; // unknown instrument — fail loudly below, not silently
}

const VALID_INSTRUMENTS = new Set(['PEMAT', 'CCI']);
const VALID_VERDICTS = new Set(['pass', 'fail', 'not_applicable', 'not_assessed']);
const VALID_DECIDED_BY = new Set(['deterministic', 'ai', 'human']);

const strOrNull = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return (s === '' || s.toLowerCase() === 'null') ? null : s;
};

const rows = items.map((it) => {
  const instrument = it.instrument;
  const item_no = Number(it.item_no);
  if (!VALID_INSTRUMENTS.has(instrument)) {
    throw new Error(`Build Instrument Items Payload: unknown instrument "${instrument}" on item_no ${item_no} — violates instrument_items_instrument_check.`);
  }
  const verdict = VALID_VERDICTS.has(it.verdict) ? it.verdict : 'not_assessed';
  const decided_by = VALID_DECIDED_BY.has(it.decided_by) ? it.decided_by : 'ai';
  return {
    audit_id,
    instrument,
    item_no,
    domain: domainOf(instrument, item_no),
    verdict,
    decided_by,
    rationale: strOrNull(it.rationale),
    evidence: strOrNull(it.evidence),
    // Never true on a fresh write — only a human review action sets this
    // later. A re-audit's upsert (ON CONFLICT) is guarded so it can never
    // flip this back to false once a human has set it (see reference query).
    overridden_by_human: false,
    ai_contradiction: strOrNull(it.ai_contradiction),
  };
});

return [{ json: { instrument_items_payload: JSON.stringify(rows), instrument_items_count: rows.length, audit_id } }];
