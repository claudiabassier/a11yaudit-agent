/**
 * ============================================================================
 * Node 6 (text branch) — Prepare Text (Code)   ·   Workflow: WF1
 * Spec: workflow_spec.md §1 Node 6, v2.1
 * ============================================================================
 *
 * PURPOSE
 *   Text-branch counterpart of Node 5. Pasted text has no markup, so no
 *   automated checks are possible: content passes through, all eight
 *   machine-decidable instrument items become "not_assessed", and the
 *   skip is flagged so the report states this limitation.
 *
 * EXPECTED INPUT (one item, from Node 3 IF — i.e. Node 2's output)
 *   { json: { pasted_content: string, ...Node 2 metadata contract } }
 *
 * OUTPUT (one item — same shape as Node 5's output, so Node 7 Merge and
 * everything downstream is branch-agnostic)
 *   { json: { ...metadata, content_text, word_count, paragraph_count,
 *       is_very_short, automated_findings: [],
 *       deterministic_items: { all 8 → "not_assessed" },
 *       deterministic_observations: [ 8 rows with rationale ],
 *       automated_checks_skipped: true, checks_engine: "none" } }
 *
 *   word_count / paragraph_count / is_very_short are computed here because
 *   the Node 10 contract requires is_very_short on both branches
 *   (paragraphs = text blocks separated by blank lines).
 * ============================================================================
 */

const item = $input.all()[0] || { json: {} };
const j = item.json || {};

const content_text = (typeof j.pasted_content === 'string') ? j.pasted_content.trim() : '';
if (!content_text) {
  throw new Error('no_content: text branch reached but pasted_content is empty (Node 2 should have prevented this).');
}

// Paragraphs: blank-line separated. REVIEW FIX (31 Jul): pasted text often
// arrives with single newlines only; that would count as ONE paragraph and
// wrongly mark a long article "very short", turning PEMAT 8/9/11 into N/A.
// Fall back to single-newline splitting when no blank lines are present.
let paragraphs = content_text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
if (paragraphs.length < 2) {
  const lines = content_text.split(/\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length >= 2) paragraphs = lines;
}
const word_count = (content_text.match(/\S+/g) || []).length;
const paragraph_count = paragraphs.length;
// AHRQ: "two or fewer paragraphs AND no more than one page". The word guard
// operationalizes the second half — without it, one long unbroken block of
// text would be treated as very short material.
const is_very_short = paragraph_count <= 2 && word_count <= 300;

// all machine-decidable items: no markup → not_assessed (spec Node 6)
const DET_ITEMS = [['PEMAT', 8], ['PEMAT', 9], ['PEMAT', 12], ['PEMAT', 17], ['PEMAT', 19], ['CCI', 3], ['CCI', 8], ['CCI', 9]];
const deterministic_items = {};
const deterministic_observations = DET_ITEMS.map(([instrument, item_no]) => {
  deterministic_items[`${instrument}_${item_no}`] = 'not_assessed';
  return {
    instrument, item_no, verdict: 'not_assessed',
    rationale: 'Pasted text carries no markup; deterministic structure checks were skipped.',
    evidence: null, decided_by: 'deterministic',
  };
});

return [{
  json: {
    ...j,
    pasted_content: null, // consumed; don't carry the duplicate forward
    content_text, word_count, paragraph_count, is_very_short,
    automated_findings: [],
    deterministic_items,
    deterministic_observations,
    automated_checks_skipped: true,
    checks_engine: 'none',
  },
}];

/* ============================================================================
 * STANDALONE TEST INPUT — pin this on the node in n8n (Input panel → Pin data).
 * Expected: content_text set, word_count 22, paragraph_count 2,
 * is_very_short true, automated_checks_skipped true, all 8 deterministic
 * items "not_assessed", automated_findings [].
 * Also try: pasted_content "" → node fails with "no_content" (correct).

[
  {
    "json": {
      "source_type": "text",
      "page_url": null,
      "pasted_content": "Take one tablet every morning with water.\n\nIf you miss a dose, do not take a double dose. Contact your GP surgery.",
      "page_title": "Medication note",
      "content_language": "en",
      "audience": "patients and family members, average to low health literacy",
      "eaa_scope": false,
      "auditor_note": null,
      "started_at": "2026-08-03T09:00:00.000Z"
    }
  }
]

 * ========================================================================== */
