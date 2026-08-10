/**
 * ============================================================================
 * Node 11 — Merge Findings (Code)   ·   Workflow: WF1
 * Spec: workflow_spec.md §1 Node 11, v2.1
 * ============================================================================
 *
 * PURPOSE
 *   Brings the two evidence streams together — deterministic (Node 5/6)
 *   and AI (SUB-A) — under the core principle: where both speak, the
 *   deterministic verdict wins.
 *     - findings:   concatenated; same WCAG criterion + overlapping
 *                   evidence → automated kept, AI explanation attached
 *     - instrument: deterministic verdict overrides the AI's
 *     - cross-check: deterministic "fail" vs AI "pass" on the same item
 *                   → ai_disagreement = true (feeds rule R6)
 *
 * EXPECTED INPUT (one item — SUB-A's return, either shape)
 *   valid analysis:  { analysis: { findings[], instrument_items[], summary,
 *                      positive_observations[] }, dropped_unverified,
 *                      missing_items_count, ... }
 *   fallback object: { analysis_status: "fallback", findings: [],
 *                      instrument_items: [], fallback_reason, ... }
 *   WF1 context (automated_findings, deterministic_observations, safety
 *   flags, content metadata) is read from $('Safety Prescreen'); when that
 *   node is absent (standalone test), from the input item itself.
 *
 * OUTPUT (one item)
 *   { json: { ...WF1 context,
 *       findings: [...],            // merged, unique finding_keys, severity-sorted
 *       instrument_items: [...],    // deterministic + AI, precedence applied
 *       ai_disagreement: boolean,
 *       ai_fallback_used: boolean, ai_status: "ok"|"fallback",
 *       fallback_reason: string|null,
 *       ai_summary, positive_observations,
 *       dropped_unverified, missing_items_count } }
 *
 * OPERATIONALIZATIONS (decision-log candidates)
 *   - "overlapping evidence" = after whitespace normalisation and
 *     lowercasing, one evidence string contains the other.
 *   - "AI reports it clean" (cross-check) = AI instrument verdict "pass"
 *     where the deterministic verdict is "fail". This is the machine-
 *     checkable form of the spec's cross-check.
 * ============================================================================
 */

const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 };
const normEv = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();
const overlap = (a, b) => {
  const x = normEv(a); const y = normEv(b);
  return x.length > 0 && y.length > 0 && (x.includes(y) || y.includes(x));
};

// ---- inputs ----------------------------------------------------------------
const item = $input.all()[0] || { json: {} };
const j = item.json || {};
let ctx = {};
try { ctx = $('Safety Prescreen').first().json || {}; } catch (e) { ctx = {}; }
// standalone test: context fields may sit on the input item itself
const C = (k, d) => (ctx[k] !== undefined ? ctx[k] : (j[k] !== undefined ? j[k] : d));

const automatedFindings = Array.isArray(C('automated_findings', [])) ? C('automated_findings', []) : [];
const detObs = Array.isArray(C('deterministic_observations', [])) ? C('deterministic_observations', []) : [];

// SUB-A return: unwrap either shape
const analysis = (j.analysis && typeof j.analysis === 'object') ? j.analysis : j;
const aiStatus = analysis.analysis_status === 'ok' ? 'ok' : 'fallback';
const aiFindings = (aiStatus === 'ok' && Array.isArray(analysis.findings)) ? analysis.findings : [];
const aiItems = (aiStatus === 'ok' && Array.isArray(analysis.instrument_items)) ? analysis.instrument_items : [];

// ---- findings: concat + dedupe ---------------------------------------------
const merged = automatedFindings.map((f) => ({ ...f, source: 'automated' }));
for (const af of aiFindings) {
  const dup = merged.find((mf) => mf.source === 'automated'
    && mf.wcag_criterion && af.wcag_criterion
    && mf.wcag_criterion === af.wcag_criterion
    && overlap(mf.evidence, af.evidence));
  if (dup) {
    // keep the automated finding, attach the AI's plain-language explanation
    dup.ai_explanation_plain = af.explanation_plain || null;
    dup.merged_with_ai = true;
  } else {
    merged.push({ ...af, source: 'ai' });
  }
}
// unique finding_keys (DB upserts on (audit_id, finding_key))
const seenKeys = new Set();
for (const f of merged) {
  let key = f.finding_key || 'finding'; let n = 1;
  while (seenKeys.has(key)) key = `${f.finding_key}-${++n}`;
  seenKeys.add(key); f.finding_key = key;
}
merged.sort((a, b) => (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9));

// ---- instrument items: deterministic precedence + cross-check --------------
const byKey = new Map();
let aiDisagreement = false;
for (const o of detObs) byKey.set(`${o.instrument}_${o.item_no}`, { ...o });
for (const it of aiItems) {
  const key = `${it.instrument}_${it.item_no}`;
  const det = byKey.get(key);
  if (det) {
    // cross-check BEFORE override (feeds R6)
    if (det.verdict === 'fail' && it.verdict === 'pass') {
      aiDisagreement = true;
      det.ai_contradiction = `AI judged "pass": ${it.rationale || 'no rationale given'}`;
    }
    continue; // deterministic verdict stands (spec: precedence)
  }
  byKey.set(key, { ...it, decided_by: it.decided_by || 'ai' });
}
const instrumentItems = [...byKey.values()]
  .sort((a, b) => a.instrument === b.instrument ? a.item_no - b.item_no : a.instrument.localeCompare(b.instrument));

// ---- return ----------------------------------------------------------------
return [{
  json: {
    ...ctx, ...((Object.keys(ctx).length === 0) ? j : {}), // context passthrough (test mode: input item)
    analysis: undefined, // don't carry the raw SUB-A payload forward
    findings: merged,
    instrument_items: instrumentItems,
    ai_disagreement: aiDisagreement,
    ai_fallback_used: aiStatus === 'fallback',
    ai_status: aiStatus,
    fallback_reason: aiStatus === 'fallback' ? (j.fallback_reason || analysis.fallback_reason || (j.errors && j.errors.length ? 'validation_failed' : 'unknown')) : null,
    ai_summary: (aiStatus === 'ok' && typeof analysis.summary === 'string') ? analysis.summary : null,
    positive_observations: (aiStatus === 'ok' && Array.isArray(analysis.positive_observations)) ? analysis.positive_observations : [],
    dropped_unverified: Number(j.dropped_unverified || 0),
    missing_items_count: Number(j.missing_items_count || 0),
  },
}];

/* ============================================================================
 * STANDALONE TEST INPUT — pin this on the node in n8n (Input panel → Pin data).
 * WF1 context fields sit directly on the item (test mode). Expected:
 *   - findings: 3, severity-sorted —
 *       ai-pemat4-abbrev-bd (critical, ai),
 *       auto-3.3.2-input-label (high, automated),
 *       ai-cci11-sources (medium, ai)
 *   - instrument_items: PEMAT_8 stays "fail", decided_by "deterministic",
 *       and carries ai_contradiction (the AI said "pass");
 *       PEMAT_4 (AI only) joins as "fail"; CCI_8 stays "pass"
 *   - ai_disagreement: true (deterministic PEMAT_8 fail vs AI pass)
 *   - ai_fallback_used: false
 * Also try: add an AI finding with wcag_criterion "3.3.2" and evidence
 *   "<input type='text' name='email'>" → it disappears as a separate row;
 *   the automated finding gains merged_with_ai + ai_explanation_plain.
 * Also try: give two AI findings the same finding_key → second becomes
 *   "<key>-2" (DB upserts on (audit_id, finding_key)).
 * Then try the fallback shape: replace the whole "analysis" object with
 *   "analysis_status": "fallback", "fallback_reason": "api_error"
 *   → findings only automated, ai_fallback_used true, ai_disagreement false.

[
  {
    "json": {
      "content_text": "Take 1 tablet BD with food. If you miss a dose, contact your GP surgery.",
      "content_language": "en",
      "safety_context": true,
      "safety_terms_found": ["bd", "tablet"],
      "eaa_scope": false,
      "automated_findings": [
        { "finding_key": "auto-3.3.2-input-label", "wcag_criterion": "3.3.2", "wcag_level": "A", "category": "understandable", "severity": "high", "confidence": 1.0, "title": "1 form field(s) without a label", "explanation_plain": "Unlabelled form fields leave screen-reader users guessing what to enter.", "recommendation": "Associate every field with a label.", "evidence": "<input type='text' name='email'>", "source": "automated" }
      ],
      "deterministic_observations": [
        { "instrument": "PEMAT", "item_no": 8, "verdict": "fail", "rationale": "A section exceeds 150 words.", "evidence": null, "decided_by": "deterministic" },
        { "instrument": "CCI", "item_no": 8, "verdict": "pass", "rationale": "Lists present, none longer than 7 items.", "evidence": null, "decided_by": "deterministic" }
      ],
      "analysis": {
        "schema_version": "2.0",
        "analysis_status": "ok",
        "summary": "Unexplained dosing abbreviation; otherwise readable.",
        "findings": [
          { "finding_key": "ai-pemat4-abbrev-bd", "wcag_criterion": "3.1.4", "wcag_level": "A", "category": "understandable", "instrument": "PEMAT", "instrument_item": 4, "severity": "critical", "confidence": 0.92, "title": "Dosing abbreviation BD never explained", "explanation_plain": "BD means twice daily but is never defined.", "recommendation": "Write 'twice a day'.", "evidence": "Take 1 tablet BD with food.", "source": "ai", "evidence_verified": true },
          { "finding_key": "ai-cci11-sources", "wcag_criterion": null, "wcag_level": null, "category": "cognitive", "instrument": "CCI", "instrument_item": 11, "severity": "medium", "confidence": 0.7, "title": "No mention of what is known or unknown", "explanation_plain": "The material does not say what sources know or don't know.", "recommendation": "Add a short evidence note.", "evidence": "If you miss a dose, contact your GP surgery.", "source": "ai", "evidence_verified": true }
        ],
        "instrument_items": [
          { "instrument": "PEMAT", "item_no": 8, "verdict": "pass", "rationale": "Sections look short to me.", "evidence": null, "decided_by": "ai" },
          { "instrument": "PEMAT", "item_no": 4, "verdict": "fail", "rationale": "BD is used without definition.", "evidence": "Take 1 tablet BD with food.", "decided_by": "ai" }
        ],
        "positive_observations": ["Short sentences throughout."]
      },
      "dropped_unverified": 1,
      "missing_items_count": 26
    }
  }
]

 * ========================================================================== */
