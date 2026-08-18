/**
 * ============================================================================
 * Node 12 — Decision Engine (Code) — deterministic, AI-independent
 * Workflow: WF1 · Spec: workflow_spec.md §1 Node 12, v2.1
 * ============================================================================
 *
 * PURPOSE
 *   Every score and every escalation decision, computed by code alone.
 *   Nothing here consults the AI; the AI's output is by now just data that
 *   has already passed validation (A4) and deterministic precedence (N11).
 *
 * EXPECTED INPUT (one item, from Node 11 Merge Findings)
 *   { json: { findings[], instrument_items[], safety_context,
 *       ai_fallback_used, ai_disagreement, eaa_scope, ...context } }
 *
 * OUTPUT (one item — input passed through, plus:)
 *   { json: { ...input,
 *       findings,                  // R9 may have upgraded severities
 *       screening_score, screening_label,               // null if nothing was screened (D-36)
 *       pemat_understandability, pemat_actionability, cci_score, // null if no applicable items
 *       not_assessed_count,
 *       human_review_required, triggered_rules: ["R1","R7",...],
 *       legally_relevant } }
 *
 * IMPLEMENTATION NOTES (defend these in review)
 *   - ORDER MATTERS: R9's severity upgrade runs FIRST, so an upgraded
 *     finding is a critical finding when the score is computed (penalty 15)
 *     and when R1 is evaluated. The upgrade is recorded on the finding
 *     (severity_upgraded_by: "R9", original severity kept).
 *   - Score contamination guard (review fix #7): only findings with a
 *     non-null wcag_criterion count toward the screening score.
 *   - CCI item 17 reverse scoring is normalized at the VERDICT level: the
 *     prompt instructs "yes, must calculate" = fail, so by the time
 *     verdicts reach this node, pass = good for every item. The engine
 *     therefore counts pass uniformly — reversing again here would be a
 *     double-reversal bug.
 *   - The four scores are NEVER blended into one number (D-05).
 *   - not_applicable and not_assessed are both excluded from denominators;
 *     a subscore with zero applicable items is null, and null never fires
 *     a threshold rule (R8).
 *   - FIX (D-36, 13 Aug): screening_score/screening_score_deterministic used
 *     to be pure 100 − penalty, with no concept of "how much was actually
 *     screened" — so pasted text (checks_engine "none") with the AI
 *     unavailable produced a penalty of 0 from zero checks, not zero
 *     problems, and printed 100/"no issues in screened subset" for a page
 *     nobody assessed. Now null in that exact case, mirroring the
 *     instrument-subscore pattern above (18_generate_report.js's existing
 *     score() formatter already renders null as "not computable" — no
 *     report-layer change needed). R4 guards against null explicitly,
 *     mirroring R8's guard on pemat_understandability, rather than relying
 *     on JS's `null < 70 === true` coercion (which happened to already be
 *     conservative here, but implicitly — the file's own R3 comment already
 *     warns against relying on that kind of coercion for anything
 *     safety-relevant).
 *   - All nine rules are implemented. Tiering (build_runbook §0) concerns
 *     build time, not this file — if R3/R5/R6/R8/R9 are descoped, they are
 *     simply already present; nothing to remove.
 * ============================================================================
 */

const PENALTY = { critical: 15, high: 8, medium: 4, low: 1 };
const PEMAT_U = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19]);
const PEMAT_A = new Set([20, 21, 22, 23, 24, 25, 26]);
const round1 = (x) => Math.round(x * 10) / 10;

const item = $input.all()[0] || { json: {} };
const j = item.json || {};
const findings = Array.isArray(j.findings) ? j.findings.map((f) => ({ ...f })) : [];
const items = Array.isArray(j.instrument_items) ? j.instrument_items : [];
const safety = j.safety_context === true;

const verdictOf = (instr, no) => {
  const it = items.find((x) => x.instrument === instr && Number(x.item_no) === no);
  return it ? it.verdict : undefined;
};

// ---- R9 severity upgrade FIRST (see ordering note) -------------------------
const r9Trigger = safety && (verdictOf('PEMAT', 4) === 'fail' || verdictOf('CCI', 7) === 'fail');
if (r9Trigger) {
  for (const f of findings) {
    // REVIEW FIX (31 Jul): match the undefined-term finding by instrument
    // reference OR by WCAG criterion. The AI often reports the abbreviation
    // problem as 3.1.4/3.1.3 without tagging the instrument item, and the
    // spec requires R9 to force THE FINDING to critical, not just escalate
    // the audit.
    const isTermFinding = (f.instrument === 'PEMAT' && Number(f.instrument_item) === 4)
      || (f.instrument === 'CCI' && Number(f.instrument_item) === 7)
      || f.wcag_criterion === '3.1.4' || f.wcag_criterion === '3.1.3';
    if (isTermFinding && f.severity !== 'critical') {
      f.original_severity = f.severity;
      f.severity = 'critical';
      f.severity_upgraded_by = 'R9';
    }
  }
}

// ---- (a) WCAG screening score ----------------------------------------------
// Only findings with a non-null wcag_criterion count (review fix #7).
let penalty = 0;
let penalty_deterministic = 0;
for (const f of findings) {
  if (f.wcag_criterion == null) continue;
  const p = PENALTY[f.severity] || 0;
  penalty += p;
  // Deterministic-only score: automated markup findings, at the severity the
  // check assigned. R9 upgrades are AI-triggered, so the ORIGINAL severity is
  // used here — otherwise an AI-driven escalation would leak into the number
  // that exists precisely to be AI-independent. Added 4 Aug — see D-32.
  if (f.source === 'automated') penalty_deterministic += PENALTY[f.original_severity || f.severity] || 0;
}
// D-36 guard: nothing was actually screened when the deterministic checks
// were skipped (pasted text, no markup) AND the AI produced nothing usable.
// Same two fields R2 already tests, so no new field is introduced.
const nothingScreened = j.checks_engine === 'none'
  && (j.ai_fallback_used === true || j.ai_status === 'fallback');
const label = (s) => (s >= 90 ? 'no issues in screened subset' : s >= 70 ? 'issues found' : 'severe issues found');
const screening_score = nothingScreened ? null : Math.max(0, 100 - penalty);
const screening_label = nothingScreened ? null : label(screening_score);
// Reproducible half of the screening result: identical input gives an
// identical number, because no AI output contributes to it (D-30, D-32).
const screening_score_deterministic = nothingScreened ? null : Math.max(0, 100 - penalty_deterministic);
const screening_label_deterministic = nothingScreened ? null : label(screening_score_deterministic);
// This is a SCREENING score over the listed subset — never a conformance
// score, and the labels deliberately avoid ACR/VPAT language (fix #3).

// ---- (b) instrument subscores ----------------------------------------------
const subscore = (filter) => {
  let passed = 0; let applicable = 0;
  for (const it of items) {
    if (!filter(it)) continue;
    if (it.verdict === 'pass') { passed++; applicable++; }
    else if (it.verdict === 'fail') { applicable++; }
    // not_applicable / not_assessed: excluded from the denominator
  }
  return applicable === 0 ? null : round1((passed / applicable) * 100);
};
const pemat_understandability = subscore((it) => it.instrument === 'PEMAT' && PEMAT_U.has(Number(it.item_no)));
const pemat_actionability = subscore((it) => it.instrument === 'PEMAT' && PEMAT_A.has(Number(it.item_no)));
const cci_score = subscore((it) => it.instrument === 'CCI');
// not_assessed_count counts EVERY scored instrument item that produced no
// verdict, for three distinct reasons (corrected 4 Aug — see D-29):
//   1. never requested — PEMAT 15/16/18/23/26 and CCI 4 are "Not assessed"
//      by design (knowledge_base.md §2.1/§2.2/§3), because they require
//      judging visual aids that this text-and-markup pipeline cannot see;
//   2. requested but absent from the AI's response;
//   3. returned with an explicit "not_assessed" verdict.
// Counting only (3) — the previous behaviour — reported 0 on a run where six
// items were never assessed, which overstates coverage in the report.
const PEMAT_SCORED = [...PEMAT_U, ...PEMAT_A];              // 1–12, 15–26
const CCI_SCORED = Array.from({ length: 20 }, (_, i) => i + 1); // 1–20
const DECIDED = new Set(['pass', 'fail', 'not_applicable']);
const decidedKeys = new Set(
  items.filter((it) => DECIDED.has(it.verdict)).map((it) => `${it.instrument}_${it.item_no}`)
);
const not_assessed_items = [];
for (const [instrument, nums] of [['PEMAT', PEMAT_SCORED], ['CCI', CCI_SCORED]]) {
  for (const n of nums) {
    if (!decidedKeys.has(`${instrument}_${n}`)) not_assessed_items.push(`${instrument} ${n}`);
  }
}
const not_assessed_count = not_assessed_items.length;

// ---- (c) hard rules — any hit forces human review --------------------------
const triggered_rules = [];
const R = (name, cond) => { if (cond) triggered_rules.push(name); };

R('R1', findings.some((f) => f.severity === 'critical'));
R('R2', j.ai_fallback_used === true || j.ai_status === 'fallback');
// R3: missing/non-numeric confidence counts as 0 (REVIEW FIX, 31 Jul):
// NaN < 0.6 is false in JS, so an absent confidence would silently FAIL to
// escalate — the one direction this system must never fail in.
R('R3', findings.some((f) => {
  if (f.severity !== 'critical' && f.severity !== 'high') return false;
  const c = Number(f.confidence);
  return (isFinite(c) ? c : 0) < 0.6;
}));
R('R4', screening_score !== null && screening_score < 70);
R('R5', j.eaa_scope === true);
R('R6', j.ai_disagreement === true);
R('R7', safety);
R('R8', pemat_understandability !== null && pemat_understandability < 70);
R('R9', r9Trigger);

const human_review_required = triggered_rules.length > 0;
// FIX (17 Aug, Phase 2 backlog, decision_log.md D-65): R9 firing alone used
// to leave legally_relevant false unless the combined score also happened
// to drop below 70 — R9 upgrades a finding to critical specifically because
// it is safety-relevant (undefined medical term in safety-relevant
// content); that severity should count toward legal relevance on its own,
// not depend on an unrelated score threshold also being crossed.
const legally_relevant = triggered_rules.includes('R5')
  || triggered_rules.includes('R9')
  || (triggered_rules.includes('R4') && triggered_rules.includes('R1'));

// ---- return ----------------------------------------------------------------
return [{
  json: {
    ...j,
    findings,
    screening_score, screening_label,
    screening_score_deterministic, screening_label_deterministic,
    pemat_understandability, pemat_actionability, cci_score,
    not_assessed_count, not_assessed_items,
    human_review_required, triggered_rules, legally_relevant,
  },
}];

/* ============================================================================
 * STANDALONE TEST INPUT — pin this on the node in n8n (Input panel → Pin data).
 * HAND CALCULATION (this is the Day-4 gate check — verify by hand):
 *   R9: safety_context true AND PEMAT_4 = fail → fires.
 *       BOTH findings referencing the undefined-term items are upgraded to
 *       critical: ai-pemat4-abbrev-bd (was high) and ai-cog-structure
 *       (CCI 7, was medium). original_severity is kept on each.
 *   Screening: findings with wcag_criterion = upgraded critical (15)
 *       + high 3.3.2 (8) = 23 penalty. ai-cog-structure has
 *       wcag_criterion null, so despite being critical it does NOT
 *       count toward the score (fix #7) — it still fires R1.
 *       → screening_score 77, label "issues found".
 *   PEMAT understandability: items 1(pass) 3(pass) 4(fail) 8(fail)
 *       11(not_applicable) → 2/4 = 50.0 → R8 fires (< 70).
 *   PEMAT actionability: 20(pass) 21(fail) → 1/2 = 50.0.
 *   CCI: 1(pass) 7(fail) 8(pass) 17(pass) 15(not_assessed) → 3/4 = 75.0.
 *   not_assessed_count: 1.
 *   Rules: R1 (upgraded critical), R7 (safety), R8 (50 < 70), R9 →
 *       triggered_rules ["R1","R7","R8","R9"], human_review_required true.
 *   R4 does NOT fire (77 ≥ 70), no R5, no R4+R1 — but R9 fires on its own,
 *   so legally_relevant is true (D-65, 17 Aug) — this exact case is what
 *   D-65 fixed: before the fix, legally_relevant read false here despite
 *   R9's critical upgrade, because the formula only checked R5 and R4+R1.
 *
 * Also try: set safety_context false → R9/R7 gone, finding stays "high",
 *   penalty 8+8=16 → score 84; rules ["R8"] only; legally_relevant false.
 * Also try: set eaa_scope true → R5 joins, legally_relevant true (already was, via R9).
 * Also try (D-36): set checks_engine "none", ai_fallback_used true,
 *   findings [], instrument_items [] → screening_score, screening_label,
 *   screening_score_deterministic and screening_label_deterministic all
 *   null ("not computable" once rendered by 18_generate_report.js), R4
 *   does NOT fire (guarded against null), R2/R7 still fire on their own
 *   conditions so human_review_required stays true regardless.

[
  {
    "json": {
      "content_text": "Take 1 tablet BD with food. If you miss a dose, contact your GP surgery.",
      "checks_engine": "cheerio",
      "safety_context": true,
      "safety_terms_found": ["bd", "tablet"],
      "eaa_scope": false,
      "ai_fallback_used": false,
      "ai_status": "ok",
      "ai_disagreement": false,
      "findings": [
        { "finding_key": "ai-pemat4-abbrev-bd", "wcag_criterion": "3.1.4", "wcag_level": "A", "category": "understandable", "instrument": "PEMAT", "instrument_item": 4, "severity": "high", "confidence": 0.92, "title": "Dosing abbreviation BD never explained", "explanation_plain": "BD means twice daily but is never defined.", "recommendation": "Write 'twice a day'.", "evidence": "Take 1 tablet BD with food.", "source": "ai" },
        { "finding_key": "auto-3.3.2-input-label", "wcag_criterion": "3.3.2", "wcag_level": "A", "category": "understandable", "severity": "high", "confidence": 1.0, "title": "1 form field(s) without a label", "explanation_plain": "Unlabelled form fields leave screen-reader users guessing.", "recommendation": "Associate every field with a label.", "evidence": "<input type='text' name='email'>", "source": "automated" },
        { "finding_key": "ai-cog-structure", "wcag_criterion": null, "wcag_level": null, "category": "cognitive", "instrument": "CCI", "instrument_item": 7, "severity": "medium", "confidence": 0.7, "title": "Specialized term unexplained", "explanation_plain": "A specialized term is not explained at first use.", "recommendation": "Explain terms at first use.", "evidence": "Take 1 tablet BD with food.", "source": "ai" }
      ],
      "instrument_items": [
        { "instrument": "PEMAT", "item_no": 1, "verdict": "pass", "decided_by": "ai", "rationale": "" },
        { "instrument": "PEMAT", "item_no": 3, "verdict": "pass", "decided_by": "ai", "rationale": "" },
        { "instrument": "PEMAT", "item_no": 4, "verdict": "fail", "decided_by": "ai", "rationale": "BD undefined." },
        { "instrument": "PEMAT", "item_no": 8, "verdict": "fail", "decided_by": "deterministic", "rationale": "Section exceeds 150 words." },
        { "instrument": "PEMAT", "item_no": 11, "verdict": "not_applicable", "decided_by": "ai", "rationale": "Very short material." },
        { "instrument": "PEMAT", "item_no": 20, "verdict": "pass", "decided_by": "ai", "rationale": "" },
        { "instrument": "PEMAT", "item_no": 21, "verdict": "fail", "decided_by": "ai", "rationale": "" },
        { "instrument": "CCI", "item_no": 1, "verdict": "pass", "decided_by": "ai", "rationale": "" },
        { "instrument": "CCI", "item_no": 7, "verdict": "fail", "decided_by": "ai", "rationale": "Term not explained at first use." },
        { "instrument": "CCI", "item_no": 8, "verdict": "pass", "decided_by": "deterministic", "rationale": "" },
        { "instrument": "CCI", "item_no": 15, "verdict": "not_assessed", "decided_by": "deterministic", "rationale": "Not returned by the AI." },
        { "instrument": "CCI", "item_no": 17, "verdict": "pass", "decided_by": "ai", "rationale": "No calculation required (reverse-scored at verdict level)." }
      ]
    }
  }
]

 * ========================================================================== */
