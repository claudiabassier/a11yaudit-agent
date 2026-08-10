/**
 * ============================================================================
 * Node: A2 — Build Prompt (Code)   ·   Subworkflow: SUB-A
 * Spec: workflow_spec.md §2 (A2, A3 system prompt + user message), v2.1
 * ============================================================================
 *
 * PURPOSE
 *   Assembles everything the AI chat node (A3) needs: the fixed system
 *   prompt (verbatim from the spec) and the per-audit user message.
 *   Also passes context through, because A4 (Validate Output) reads
 *   content_text / deterministic_items / attempt from THIS node via
 *   $('Build Prompt').
 *
 * EXPECTED INPUT (one item, from A1 Execute Workflow Trigger — the
 * contract defined at WF1 Node 10):
 *   { json: {
 *       content_text: string,          // required
 *       content_language: "en"|"de",
 *       page_title: string|null,
 *       audience: string,
 *       is_very_short: boolean,
 *       content_truncated: boolean,
 *       deterministic_items: { "PEMAT_8": "pass", "CCI_3": "fail", ... }
 *   } }
 *
 * OUTPUT (one item)
 *   { json: {
 *       system_prompt: string,         // → A3 "System Message" field
 *       user_message: string,          // → A3 "Prompt"/"Text" field
 *       attempt: 1,
 *       content_text, content_language, page_title, audience,
 *       is_very_short, content_truncated, deterministic_items   // pass-through
 *   } }
 *
 *   In the A3 chat node, reference these as expressions:
 *     System Message: {{ $json.system_prompt }}
 *     Prompt:         {{ $json.user_message }}
 *
 * DEFENSIVE DEFAULTS (real input is messy; the AI call must still be sane)
 *   - content_text missing/empty → throw. Upstream Hash+Guard (Node 8)
 *     should have stopped this; failing loudly here beats sending the AI
 *     an empty MATERIAL block and getting 30 hallucinated verdicts back.
 *   - audience missing → "general public / patients (assume low prior
 *     medical knowledge)" — the conservative reading level.
 *   - page_title null → "(not provided)". language unknown → "en".
 *   - deterministic_items not an object → {} (AI then judges everything;
 *     Node 11 precedence still lets deterministic verdicts override later).
 * ============================================================================
 */

// System prompt — verbatim from workflow_spec.md §2 (A3), v2.1.
// If the spec prompt changes, change it THERE first, then re-copy here.
const SYSTEM_PROMPT = `You are an accessibility and health-literacy analysis assistant. You
support a human auditor of digital health content. You never make final
compliance, legal, or clinical decisions.

You perform two tasks.

TASK 1 — BARRIER FINDINGS
Identify accessibility barriers detectable from text and markup:
 - WCAG 2.2 criteria that require judgment: 3.1.3 (unusual words),
   3.1.4 (abbreviations), 3.1.5 (reading level), 2.4.6 (headings and
   labels), 3.3.2 (instructions), 1.3.1 (semantic structure).
 - Comprehension barriers for patients: unexplained jargon, undefined
   abbreviations, complex sentences, missing or unclear instructions,
   ambiguous dosing or timing language, unstated action triggers.
Do NOT report colour contrast, keyboard operation, focus order, media
captions, or anything requiring a rendered page — you cannot observe them.

TASK 2 — INSTRUMENT ASSESSMENT
Score the items listed below, drawn from PEMAT-P (AHRQ) and the CDC Clear
Communication Index. For each: verdict "pass", "fail" or "not_applicable",
plus a one-sentence rationale citing evidence from the material.
Items already decided deterministically are given to you in
\`deterministic_items\` — do NOT re-judge those; they are fixed.
Judge every item strictly from the material itself. Do not use outside
knowledge of the subject. Rate "pass" only if the criterion holds
throughout the material (AHRQ guidance: 80–100% of the time).

PEMAT understandability items to judge:
 1 purpose completely evident
 2 no content that distracts from the purpose
 3 uses common, everyday language
 4 medical terms defined when used
 5 uses active voice
 6 numbers clear and easy to understand      [not_applicable if no numbers]
 7 does not expect the user to perform calculations
 10 information in a logical sequence
 11 provides a summary                        [not_applicable if very short]
PEMAT actionability items to judge:
 20 clearly identifies at least one action the user can take
 21 addresses the user directly when describing actions
 22 breaks actions into manageable, explicit steps
 24 gives instructions or examples for any calculations [n/a if none]
 25 explains how to use charts/tables to take action    [n/a if none]

CDC Index items to judge:
 1 contains one main message statement
 2 main message at the top (first section, visible without scrolling)
 5 includes at least one call to action for the audience
 6 main message and call to action both use active voice
 7 always uses words the audience uses; all specialized terms and
   abbreviations explained (not merely defined) at first use
 10 most important information summarized in the first section
 11 explains what authoritative sources know AND do not know
 12–14 behavioral recommendation present / why it matters / specific
   directions how to perform it                [n/a if no recommendation]
 15–17 numbers familiar and necessary / meaning explained / audience
   must calculate (item 17: "yes, must calculate" = fail)  [n/a if no numbers]
 18–20 nature of risk explained / risks AND benefits addressed / numeric
   probability also given in words or visual    [n/a if no risk content]

RULES
- Evidence must be quoted verbatim from the input, max 300 characters.
  Never invent content. If you cannot quote it, do not report it.
- severity: critical = could lead to patient harm or blocks the task;
  high = major barrier for a user group; medium = significant difficulty;
  low = minor friction.
- confidence: your certainty (0.0-1.0) that this is a real barrier.
- explanation_plain: 1-3 sentences a non-expert understands.
- recommendation: one concrete, actionable fix.
- Maximum 25 findings, most severe first.
- Do NOT assess legal compliance (EAA/BFSG/EN 301 549). That is decided
  outside this call.
- Do NOT give clinical advice or judge medical correctness.

Respond with ONLY a JSON object matching this schema exactly — no markdown,
no code fences, no commentary.

{
  "schema_version": "2.0",
  "analysis_status": "ok",
  "summary": "2-4 sentences",
  "findings": [
    {
      "finding_key": "ai-pemat4-abbrev-bd",
      "wcag_criterion": "3.1.4",
      "wcag_level": "A",
      "category": "perceivable|operable|understandable|robust|cognitive",
      "instrument": "PEMAT|CCI|null",
      "instrument_item": 4,
      "severity": "critical|high|medium|low",
      "confidence": 0.92,
      "title": "max 80 chars",
      "explanation_plain": "string",
      "recommendation": "string",
      "evidence": "verbatim quote, max 300 chars"
    }
  ],
  "instrument_items": [
    { "instrument": "PEMAT", "item_no": 4, "verdict": "fail",
      "rationale": "string", "evidence": "verbatim quote or null" }
  ],
  "positive_observations": ["string"]
}`;

// ---- read input defensively ------------------------------------------------
const item = $input.all()[0] || { json: {} };
const j = item.json || {};

const contentText = (typeof j.content_text === 'string') ? j.content_text.trim() : '';
if (!contentText) {
  // Node 8 (Hash + Guard) should have stopped empty content already.
  throw new Error('A2 Build Prompt: content_text is missing or empty — refusing to call the AI without material.');
}

const audience = (typeof j.audience === 'string' && j.audience.trim())
  ? j.audience.trim()
  : 'general public / patients (assume low prior medical knowledge)';
const pageTitle = (typeof j.page_title === 'string' && j.page_title.trim())
  ? j.page_title.trim()
  : '(not provided)';
const language = (j.content_language === 'de' || j.content_language === 'en')
  ? j.content_language
  : 'en';
const isVeryShort = j.is_very_short === true;
const isTruncated = j.content_truncated === true;
const detItems = (j.deterministic_items && typeof j.deterministic_items === 'object' && !Array.isArray(j.deterministic_items))
  ? j.deterministic_items
  : {};

// REVIEW FIX (31 Jul): only items with a real verdict are "already decided".
// On the text branch every deterministic item is "not_assessed"; telling the
// model «already decided: not_assessed» is meaningless instruction noise.
const decidedItems = {};
for (const [k, v] of Object.entries(detItems)) {
  if (v === 'pass' || v === 'fail' || v === 'not_applicable') decidedItems[k] = v;
}

// ---- user message — template from workflow_spec.md §2 ----------------------
const userMessage =
  `Audience: ${audience} | Title: ${pageTitle} | Language: ${language}` +
  ` | Very short: ${isVeryShort} | Truncated: ${isTruncated}\n` +
  `Already decided (do not re-judge): ${JSON.stringify(decidedItems)}\n\n` +
  `MATERIAL:\n${contentText}`;

// ---- return ----------------------------------------------------------------
return [{
  json: {
    system_prompt: SYSTEM_PROMPT,
    user_message: userMessage,
    attempt: 1,
    // pass-through — A4 reads these via $('Build Prompt'):
    content_text: contentText,
    content_language: language,
    page_title: (typeof j.page_title === 'string' && j.page_title.trim()) ? j.page_title.trim() : null,
    audience,
    is_very_short: isVeryShort,
    content_truncated: isTruncated,
    deterministic_items: detItems,
  },
}];

/* ============================================================================
 * STANDALONE TEST INPUT — pin this on the node in n8n:
 * open the node → Input panel → "Pin data" → paste the array below → Execute.
 *
 * Expected result:
 *   - one output item
 *   - system_prompt: the full fixed prompt (starts "You are an accessibility…")
 *   - user_message starts:
 *       Audience: adults newly prescribed anticoagulants | Title: Taking your
 *       blood thinner | Language: en | Very short: false | Truncated: false
 *     then the deterministic_items JSON, then "MATERIAL:" and the text.
 *   - attempt: 1, all pass-through fields present.
 *
 * Also try: delete "audience"      → default audience string is used.
 * Also try: set "content_text": "" → node fails with a clear error (correct:
 *           empty material must never reach the AI).

[
  {
    "json": {
      "content_text": "Take 1 tablet BD with food.\nIf you miss a dose, contact your GP surgery.",
      "content_language": "en",
      "page_title": "Taking your blood thinner",
      "audience": "adults newly prescribed anticoagulants",
      "is_very_short": false,
      "content_truncated": false,
      "deterministic_items": { "PEMAT_8": "pass", "CCI_3": "fail" }
    }
  }
]

 * ========================================================================== */
