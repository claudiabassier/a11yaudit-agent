/**
 * ============================================================================
 * Node: A4 — Validate Output (Code)   ·   Subworkflow: SUB-A_Validate
 * Spec: workflow_spec.md §2 (A4 / SUB-A_Validate)
 * ============================================================================
 *
 * NOTE (12 Aug 2026): this file's contract changed to support extraction
 * into its own standalone n8n subworkflow, called from two places inside
 * SUB-A (after "AI Analysis" and after "AI Analysis (repair)") instead of
 * being pasted twice as byte-identical Code nodes. See decision_log.md for
 * the entry recording this change once the canvas wiring is complete.
 *
 * PURPOSE
 *   Deterministic gate between the AI's raw response and the rest of the
 *   system. Nothing the AI says passes this node unless it is schema-valid
 *   and every evidence quote is verifiably present in the source text.
 *
 * EXPECTED INPUT (one item)
 *   item.json contains the model response text, exactly as produced by the
 *   AI chat node. The exact field varies by chat node, so several common
 *   locations are tried:
 *     output | text | response | completion | message.content |
 *     choices[0].message.content | content (string or Anthropic block array)
 *   If the chat node failed with Continue On Fail, item.json.error is set.
 *
 *   All context is now passed explicitly on the SAME item — no $() lookup
 *   of any sibling node is used inside this file:
 *     content_text          string,  required
 *     deterministic_items   object,  optional (default {})
 *     attempt                number, required — 1 on the first call, 2 on
 *                             the second; set as a literal on the caller
 *                             side, not read from anywhere upstream
 *     allow_repair           boolean, required — true only on the call made
 *                             after the first AI attempt; false on the call
 *                             made after the repair attempt. Anything other
 *                             than the literal `true` is treated as false.
 *   This makes the contract identical in workflow mode and in the
 *   standalone-test mode below — there is only one way in.
 *
 * OUTPUT (always exactly one item)
 *   { json: {
 *       valid: boolean,            // schema-valid and evidence-checked?
 *       api_error: boolean,        // true → never repair, go to fallback
 *       attempt: number,
 *       next_action: string,       // 'accept' | 'repair' | 'fallback' —
 *                                  // see next_action() below; the caller's
 *                                  // IF-routing should read this, not
 *                                  // re-derive it from valid/api_error.
 *       errors: string[],          // validation errors, for the repair message
 *       analysis: { schema_version, analysis_status, summary,
 *                   findings[], instrument_items[], positive_observations[] },
 *       dropped_unverified: number,        // findings dropped: evidence not in source
 *       instrument_evidence_removed: number,
 *       missing_items: string[],           // e.g. ["PEMAT_5","CCI_11"]
 *       missing_items_count: number
 *   } }
 *
 * DESIGN DECISIONS ENFORCED HERE
 *   - Evidence must be a literal substring of content_text after whitespace
 *     normalisation. Not found → the finding is DROPPED (not repaired) and
 *     counted in dropped_unverified. Anti-fabrication check (spec A4 step 3).
 *     This is independent of next_action: a valid response with dropped
 *     findings is still valid, never routed to repair.
 *   - Structural/enum errors → valid:false → next_action 'repair', but only
 *     if allow_repair is true; otherwise 'fallback'. This is what makes a
 *     third repair attempt structurally impossible, not just unlikely.
 *   - Non-numeric confidence is coerced to 0, not repaired: 0 is the
 *     conservative value (rule R3 then forces review on high/critical).
 *   - Missing instrument items become verdict "not_assessed" so a partial
 *     AI response cannot silently inflate subscores (review fix #5).
 *     not_assessed rows get decided_by "deterministic" (this validator is
 *     deterministic code; DB enum is deterministic|ai|human).
 *   - Max 25 findings, most severe kept.
 * ============================================================================
 */

// ---- constants -------------------------------------------------------------
const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 };
const CATEGORIES = ['perceivable', 'operable', 'understandable', 'robust', 'cognitive'];
const WCAG_LEVELS = ['A', 'AA', 'AAA'];
const WCAG_RE = /^\d\.\d{1,2}\.\d{1,2}$/;
const VERDICTS = ['pass', 'fail', 'not_applicable'];
// Items the prompt asks the AI to judge (knowledge_base.md §2.1/§2.2/§3):
const AI_ITEMS = {
  PEMAT: [1, 2, 3, 4, 5, 6, 7, 10, 11, 20, 21, 22, 24, 25],
  CCI:   [1, 2, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
};
// Any item number that may legally appear in instrument_items:
const VALID_ITEMS = {
  PEMAT: [1,2,3,4,5,6,7,8,9,10,11,12,15,16,17,18,19,20,21,22,23,24,25,26],
  CCI:   [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
};
const MAX_FINDINGS = 25;
const MAX_ERRORS = 20; // cap the error list so the repair message stays short

// ---- helpers ---------------------------------------------------------------
const normWs = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

function extractResponseText(json) {
  const cands = [
    json.output, json.text, json.response, json.completion,
    json.message && json.message.content,
    json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content,
    json.content,
  ];
  for (let c of cands) {
    if (Array.isArray(c)) c = c.map((b) => (b && (b.text || b.content)) || '').join('\n');
    if (isNonEmptyString(c)) return c;
  }
  // Model output already parsed to an object by the chat node:
  if (json.schema_version && Array.isArray(json.findings)) return JSON.stringify(json);
  return null;
}

function parseJsonLenient(raw) {
  let s = String(raw).trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, ''); // strip code fences
  try { return JSON.parse(s); } catch (e) { /* fall through */ }
  const a = s.indexOf('{'); const b = s.lastIndexOf('}');
  if (a !== -1 && b > a) {
    try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { /* fall through */ }
  }
  return null;
}

// ---- context (single input item, workflow mode or standalone-test mode) ----
const inputItem = $input.all()[0] || { json: {} };
const j = inputItem.json || {};

const contentText = isNonEmptyString(j.content_text) ? j.content_text : '';
const detItems    = (j.deterministic_items && typeof j.deterministic_items === 'object') ? j.deterministic_items : {};
const attempt     = Number(j.attempt || 1) || 1;
const allowRepair = j.allow_repair === true; // anything but literal true → false (safer default)
const normContent = normWs(contentText);

// next_action encodes the routing decision the caller's IF-node used to have
// to infer from canvas position alone. valid → accept. api_error → always
// fallback, never repair. Otherwise: repair only if this call is allowed to
// trigger one — this is what makes a third repair attempt structurally
// impossible rather than merely unlikely (see D-H / Sprint-Schritt 4).
function nextAction(valid, apiError, repairAllowed) {
  if (valid) return 'accept';
  if (apiError) return 'fallback';
  return repairAllowed ? 'repair' : 'fallback';
}

const fail = (errors, apiError = false) => [{
  json: {
    valid: false, api_error: apiError, attempt,
    next_action: nextAction(false, apiError, allowRepair),
    errors: errors.slice(0, MAX_ERRORS),
    analysis: null,
    dropped_unverified: 0, instrument_evidence_removed: 0,
    missing_items: [], missing_items_count: 0,
  },
}];

// ---- 0a. context guard (REVIEW FIX, 31 Jul; contract updated 12 Aug) -------
// If content_text is missing, EVERY evidence check would fail and the node
// would return a cheerful "valid, 0 findings" — a broken pipeline that looks
// like a clean page. Fail to fallback instead: R2 then forces a full human
// audit. This is now a genuine input-validation guard (the caller sent an
// incomplete item) rather than a defence against a specific sibling-node
// rename, but the failure mode it prevents is unchanged.
if (!normContent) {
  return [{
    json: {
      valid: false, api_error: true, attempt,
      next_action: nextAction(false, true, allowRepair),
      errors: ['context_unavailable: content_text was not provided in the subworkflow\'s input; evidence cannot be verified, so no finding may be trusted.'],
      analysis: null, dropped_unverified: 0, instrument_evidence_removed: 0,
      missing_items: [], missing_items_count: 0,
    },
  }];
}

// ---- 0b. chat-node API error → straight to fallback (no repair) ------------
if (j.error) {
  return fail(['api_error: ' + normWs(typeof j.error === 'string' ? j.error : (j.error.message || JSON.stringify(j.error))).slice(0, 200)], true);
}

// ---- 1. locate and parse the response --------------------------------------
const raw = extractResponseText(j);
if (!raw) return fail(['No response text found on the input item.']);
const p = parseJsonLenient(raw);
if (!p || typeof p !== 'object' || Array.isArray(p)) {
  return fail(['Response is not parseable as a JSON object. Respond with ONLY the JSON object, no commentary.']);
}

// ---- 2. top-level structure ------------------------------------------------
const errors = [];
if (p.schema_version !== '2.0') errors.push('schema_version must be "2.0".');
if (p.analysis_status !== 'ok') errors.push('analysis_status must be "ok".');
if (!isNonEmptyString(p.summary)) errors.push('summary must be a non-empty string.');
if (!Array.isArray(p.findings)) errors.push('findings must be an array.');
if (!Array.isArray(p.instrument_items)) errors.push('instrument_items must be an array.');
if (errors.length) return fail(errors);

// ---- 3. findings: schema, enums, clamp, evidence verification --------------
let droppedUnverified = 0;
const findings = [];
p.findings.forEach((f, i) => {
  const at = `findings[${i}]`;
  if (!f || typeof f !== 'object') { errors.push(`${at}: not an object.`); return; }
  if (!isNonEmptyString(f.finding_key)) { errors.push(`${at}: finding_key must be a non-empty string.`); return; }
  if (!SEVERITIES.includes(f.severity)) { errors.push(`${at}: severity "${f.severity}" invalid.`); return; }
  if (!CATEGORIES.includes(f.category)) { errors.push(`${at}: category "${f.category}" invalid.`); return; }
  if (f.wcag_criterion != null && !WCAG_RE.test(String(f.wcag_criterion))) {
    errors.push(`${at}: wcag_criterion "${f.wcag_criterion}" must match d.d.d or be null.`); return;
  }
  if (f.wcag_level != null && !WCAG_LEVELS.includes(f.wcag_level)) {
    errors.push(`${at}: wcag_level "${f.wcag_level}" invalid.`); return;
  }
  if (f.instrument != null && !['PEMAT', 'CCI'].includes(f.instrument)) {
    errors.push(`${at}: instrument "${f.instrument}" invalid.`); return;
  }
  if (f.instrument != null && !VALID_ITEMS[f.instrument].includes(Number(f.instrument_item))) {
    errors.push(`${at}: instrument_item ${f.instrument_item} not valid for ${f.instrument}.`); return;
  }
  if (!isNonEmptyString(f.title) || !isNonEmptyString(f.explanation_plain) || !isNonEmptyString(f.recommendation)) {
    errors.push(`${at}: title, explanation_plain and recommendation must be non-empty strings.`); return;
  }
  if (!isNonEmptyString(f.evidence)) { errors.push(`${at}: evidence must be a non-empty string.`); return; }
  if (f.evidence.length > 300) { errors.push(`${at}: evidence exceeds 300 characters.`); return; }

  // Anti-fabrication check: literal substring after whitespace normalisation.
  if (!normContent.includes(normWs(f.evidence))) { droppedUnverified += 1; return; } // drop silently, count it

  let conf = Number(f.confidence);
  if (!isFinite(conf)) conf = 0;               // conservative: 0 trips rule R3 on high/critical
  conf = Math.max(0, Math.min(1, conf));

  findings.push({
    finding_key: normWs(f.finding_key).slice(0, 120),
    wcag_criterion: f.wcag_criterion == null ? null : String(f.wcag_criterion),
    wcag_level: f.wcag_level == null ? null : f.wcag_level,
    category: f.category,
    instrument: f.instrument == null ? null : f.instrument,
    instrument_item: f.instrument == null ? null : Number(f.instrument_item),
    severity: f.severity,
    confidence: conf,
    title: normWs(f.title).slice(0, 80),
    explanation_plain: String(f.explanation_plain).trim(),
    recommendation: String(f.recommendation).trim(),
    evidence: String(f.evidence).trim(),
    evidence_verified: true,
    source: 'ai',
  });
});

// ---- 4. instrument items: enums + completeness diff ------------------------
let evidenceRemoved = 0;
const seen = new Set();
const items = [];
p.instrument_items.forEach((it, i) => {
  const at = `instrument_items[${i}]`;
  if (!it || typeof it !== 'object') { errors.push(`${at}: not an object.`); return; }
  if (!['PEMAT', 'CCI'].includes(it.instrument)) { errors.push(`${at}: instrument "${it.instrument}" invalid.`); return; }
  const no = Number(it.item_no);
  if (!VALID_ITEMS[it.instrument].includes(no)) { errors.push(`${at}: item_no ${it.item_no} not valid for ${it.instrument}.`); return; }
  if (!VERDICTS.includes(it.verdict)) { errors.push(`${at}: verdict "${it.verdict}" invalid.`); return; }
  const key = `${it.instrument}_${no}`;
  if (seen.has(key)) return; // duplicate: keep first occurrence
  seen.add(key);
  let ev = isNonEmptyString(it.evidence) ? String(it.evidence).trim() : null;
  if (ev && !normContent.includes(normWs(ev))) { ev = null; evidenceRemoved += 1; } // unverifiable quote removed, verdict kept
  items.push({
    instrument: it.instrument, item_no: no, verdict: it.verdict,
    rationale: isNonEmptyString(it.rationale) ? normWs(it.rationale) : '',
    evidence: ev, decided_by: 'ai',
  });
});

if (errors.length) return fail(errors);

// Completeness (review fix #5): required = AI-judged set minus items already
// decided deterministically (passed in via deterministic_items, e.g. "PEMAT_8").
const missing = [];
for (const instr of ['PEMAT', 'CCI']) {
  for (const no of AI_ITEMS[instr]) {
    const key = `${instr}_${no}`;
    if (key in detItems) continue;   // decided by code, AI was told not to judge it
    if (seen.has(key)) continue;
    missing.push(key);
    items.push({
      instrument: instr, item_no: no, verdict: 'not_assessed',
      rationale: 'Not returned by the AI; excluded from the subscore denominator.',
      evidence: null, decided_by: 'deterministic',
    });
  }
}

// ---- 5. cap at 25 findings, most severe kept (stable within severity) ------
findings.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
const finalFindings = findings.slice(0, MAX_FINDINGS);

// ---- 6. return -------------------------------------------------------------
return [{
  json: {
    valid: true, api_error: false, attempt,
    next_action: nextAction(true, false, allowRepair),
    errors: [],
    analysis: {
      schema_version: '2.0',
      analysis_status: 'ok',
      summary: normWs(p.summary),
      findings: finalFindings,
      instrument_items: items,
      positive_observations: Array.isArray(p.positive_observations)
        ? p.positive_observations.filter(isNonEmptyString).map(normWs) : [],
    },
    dropped_unverified: droppedUnverified,
    instrument_evidence_removed: evidenceRemoved,
    missing_items: missing,
    missing_items_count: missing.length,
  },
}];

/* ============================================================================
 * STANDALONE TEST INPUT — pin this on the node in n8n:
 * open the node → Input panel → "Pin data" (or "Edit output" on the previous
 * node) → paste the array below → Execute node.
 *
 * Expected result with this input:
 *   valid: true, next_action: 'accept'
 *   analysis.findings: 1 finding (the fabricated-evidence one is dropped)
 *   dropped_unverified: 1
 *   missing_items_count: 28  (30 AI-judged items − PEMAT_4 and CCI_1 returned;
 *     PEMAT_8 and CCI_3 are deterministic and not in the AI-judged set anyway)
 *   analysis.instrument_items: 30 rows (2 from the AI + 28 not_assessed)
 *
 * Also try: change "analysis_status" to "partial"
 *   → valid:false, 1 error, next_action: 'repair' (allow_repair is true below)
 *   → change "allow_repair" to false on the same input → next_action: 'fallback'
 * Also try: add  "error": "timeout"  at the top level
 *   → api_error:true, next_action: 'fallback' regardless of allow_repair.

[
  {
    "json": {
      "content_text": "Take 1 tablet BD with food.\nIf you miss a dose, contact your GP surgery.",
      "deterministic_items": { "PEMAT_8": "pass", "CCI_3": "fail" },
      "attempt": 1,
      "allow_repair": true,
      "output": "```json\n{\"schema_version\":\"2.0\",\"analysis_status\":\"ok\",\"summary\":\"The material uses an unexplained dosing abbreviation and lacks a defined action path.\",\"findings\":[{\"finding_key\":\"ai-pemat4-abbrev-bd\",\"wcag_criterion\":\"3.1.4\",\"wcag_level\":\"A\",\"category\":\"understandable\",\"instrument\":\"PEMAT\",\"instrument_item\":4,\"severity\":\"critical\",\"confidence\":0.92,\"title\":\"Dosing abbreviation BD is never explained\",\"explanation_plain\":\"BD means twice daily, but the material never says so. A reader could take the wrong dose.\",\"recommendation\":\"Replace BD with 'twice a day' or define it at first use.\",\"evidence\":\"Take 1 tablet BD with food.\"},{\"finding_key\":\"ai-fabricated\",\"wcag_criterion\":null,\"wcag_level\":null,\"category\":\"cognitive\",\"instrument\":null,\"instrument_item\":null,\"severity\":\"high\",\"confidence\":0.8,\"title\":\"Fabricated quote test\",\"explanation_plain\":\"This finding cites text that is not in the source.\",\"recommendation\":\"n/a\",\"evidence\":\"Consult the enclosed leaflet for details.\"}],\"instrument_items\":[{\"instrument\":\"PEMAT\",\"item_no\":4,\"verdict\":\"fail\",\"rationale\":\"BD is used without definition.\",\"evidence\":\"Take 1 tablet BD with food.\"},{\"instrument\":\"CCI\",\"item_no\":1,\"verdict\":\"pass\",\"rationale\":\"One clear main message.\",\"evidence\":null}],\"positive_observations\":[\"Short sentences throughout.\"]}\n```"
    }
  }
]

 * ========================================================================== */
