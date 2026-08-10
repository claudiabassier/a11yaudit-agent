/**
 * ============================================================================
 * Node 18 — Generate Report + Statement (Code, deterministic templates)
 * Workflow: WF1 · Spec: workflow_spec.md §1 Node 18, v2.1
 * ============================================================================
 *
 * PURPOSE
 *   Renders the audit report (markdown) and the accessibility-statement
 *   draft from data alone — fixed templates, no AI. Every honesty
 *   commitment lives here in writing: screening (not conformance),
 *   PEMAT-informed / CCI-informed labels, explicit in/out-of-scope lists,
 *   auto-generated limitations, DRAFT banner on the statement.
 *
 * EXPECTED INPUT
 *   The Decision Engine's output — read from $('Decision Engine') because
 *   the Postgres nodes between 12 and 18 replace the item with DB results.
 *   Standalone test: the same fields on the input item. audit_id is taken
 *   from $('Upsert Audit') when reachable, else input, else "(pending)".
 *
 * OUTPUT (one item)
 *   { json: { report_md, statement_draft, completed_at,
 *       status: "needs_review"|"completed", audit_id } }
 *   → Node 19 writes report_md, statement_draft, completed_at, status.
 * ============================================================================
 */

// ---- context ---------------------------------------------------------------
const inputItem = $input.all()[0] || { json: {} };
let d = {};
try { d = $('Decision Engine').first().json || {}; } catch (e) { d = inputItem.json || {}; }
let audit_id = d.audit_id || null;
try { const u = $('Upsert Audit').first().json || {}; audit_id = u.audit_id || u.id || audit_id; } catch (e) { /* standalone */ }
audit_id = audit_id || '(pending)';

const findings = Array.isArray(d.findings) ? d.findings : [];
const items = Array.isArray(d.instrument_items) ? d.instrument_items : [];
const skipped = d.automated_checks_skipped === true;
const fallback = d.ai_fallback_used === true;
const now = new Date().toISOString();

const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
const score = (v) => (v === null || v === undefined) ? 'not computable' : String(v);
const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const sorted = [...findings].sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9));

// ---- WCAG scope lists (knowledge_base.md §1.1–§1.3) ------------------------
const DETERMINISTIC_SCS = ['1.1.1', '1.3.1', '2.2.1', '2.4.2', '2.4.3 (markup-level tabindex only)', '2.4.4 / 4.1.2', '3.1.1', '3.3.2'];
const AI_SCS = ['1.3.1 (structure quality)', '2.4.6', '3.1.3', '3.1.4', '3.1.5 (AAA)', '3.3.2 (instruction quality)'];
const evaluated = skipped ? AI_SCS : [...DETERMINISTIC_SCS, ...AI_SCS];
const OUT_OF_SCOPE = 'Colour contrast (1.4.3, 1.4.11 — requires rendered CSS) · keyboard operability (2.1.x) · focus order and visibility beyond markup-level tabindex (2.4.3, 2.4.7, 2.4.11) · time-based media (1.2.x) · reflow and zoom (1.4.4, 1.4.10) · pointer and motion input (2.5.x) · status messages (4.1.3) · anything rendered by JavaScript after page load (raw HTML is fetched).';
const DISCLAIMER = 'Assessment is informed by PEMAT-P (AHRQ) and the CDC Clear Communication Index. It is an automated adaptation and is not an official or validated application of either instrument.';

// ---- report ----------------------------------------------------------------
const L = [];
L.push(`# Accessibility & Health-Literacy Screening Report`);
L.push('');
L.push(`**Audit:** ${audit_id} · **Date:** ${now.slice(0, 10)} · **Status:** ${d.human_review_required ? 'NEEDS HUMAN REVIEW' : 'screening complete'}`);
L.push('');
L.push(`| | |`);
L.push(`|---|---|`);
L.push(`| Source | ${esc(d.source_type === 'text' ? 'pasted text' : d.page_url || 'n/a')} |`);
L.push(`| Title | ${esc(d.page_title || '—')} |`);
L.push(`| Language | ${esc(d.content_language || '—')} |`);
L.push(`| Primary audience | ${esc(d.audience || '—')} |`);
L.push(`| EAA/BFSG scope (auditor's declaration) | ${d.eaa_scope ? 'yes' : 'no'} |`);
L.push(`| Words analyzed | ${d.word_count ?? '—'}${d.content_truncated ? ' (content truncated at 30,000 characters)' : ''} |`);
if (d.auditor_note) L.push(`| Auditor note | ${esc(d.auditor_note)} |`);
if (d.normalize_note) L.push(`| Intake note | ${esc(d.normalize_note)} |`);
L.push('');
L.push(`## Scores`);
L.push('');
L.push(`These numbers measure different things on different scales and are deliberately never combined into one figure. The first is computed from the deterministic checks alone and re-runs to the same value; the second includes AI-proposed findings and varies between runs.`);
L.push('');
L.push(`| Measure | Score | Reading |`);
L.push(`|---|---|---|`);
// Two screening numbers, deliberately shown side by side (D-32): the
// deterministic one is reproducible and AI-independent; the combined one
// includes AI-proposed findings and therefore varies between runs (D-30).
L.push(`| WCAG screening score — deterministic checks only (reproducible) | ${score(d.screening_score_deterministic)} | ${esc(d.screening_label_deterministic || '')} |`);
L.push(`| WCAG screening score — including AI-proposed findings (varies between runs) | ${score(d.screening_score)} | ${esc(d.screening_label || '')} |`);
L.push(`| PEMAT-informed understandability | ${score(d.pemat_understandability)} | of applicable items passed (%) |`);
L.push(`| PEMAT-informed actionability | ${score(d.pemat_actionability)} | of applicable items passed (%) |`);
L.push(`| CCI-informed score | ${score(d.cci_score)} | CDC interpretation: ≥90 good, ≤89 revise |`);
L.push('');
if (d.human_review_required) {
  L.push(`## Human review required`);
  L.push('');
  L.push(`Triggered rules: **${(d.triggered_rules || []).join(', ') || '—'}**${d.legally_relevant ? ' · flagged legally relevant' : ''}`);
  L.push('');
  if (fallback) L.push(`- R2: AI analysis was unavailable or invalid (${esc(d.fallback_reason || 'unknown')}); this report contains deterministic results only. A full human audit is required.`);
  if (d.safety_context) L.push(`- Safety-relevant terms found by deterministic prescreen: ${(d.safety_terms_found || []).join(', ')}.`);
  if (d.ai_disagreement) L.push(`- The AI contradicted at least one deterministic verdict; the deterministic verdict stands.`);
  L.push('');
}
if (d.ai_summary) { L.push(`## Summary (AI-generated, validated)`); L.push(''); L.push(d.ai_summary); L.push(''); }
L.push(`## Findings (${sorted.length})`);
L.push('');
if (!sorted.length) L.push(`No findings in the screened subset.`);
else {
  L.push(`| # | Severity | Title | Criterion / item | Confidence | Source |`);
  L.push(`|---|---|---|---|---|---|`);
  sorted.forEach((f, i) => {
    const ref = [f.wcag_criterion ? `WCAG ${f.wcag_criterion}${f.wcag_level ? ' (' + f.wcag_level + ')' : ''}` : null,
      f.instrument ? `${f.instrument} ${f.instrument_item}` : null].filter(Boolean).join(' · ') || '—';
    L.push(`| ${i + 1} | ${f.severity}${f.severity_upgraded_by ? ` (upgraded from ${f.original_severity} by ${f.severity_upgraded_by})` : ''} | ${esc(f.title)} | ${ref} | ${f.confidence ?? '—'} | ${f.source || '—'} |`);
  });
  L.push('');
  sorted.forEach((f, i) => {
    L.push(`### ${i + 1}. ${esc(f.title)}`);
    L.push('');
    L.push(`${f.explanation_plain || ''}${f.ai_explanation_plain ? ' ' + f.ai_explanation_plain : ''}`);
    L.push('');
    L.push(`**Recommendation:** ${f.recommendation || '—'}`);
    L.push('');
    if (f.evidence) { L.push(`> ${String(f.evidence).replace(/\n+/g, ' ')}`); L.push(''); }
  });
}
L.push(`## Instrument items`);
L.push('');
L.push(DISCLAIMER);
L.push('');
if (!items.length) L.push(`No instrument items were assessed${fallback ? ' (AI fallback)' : ''}.`);
else {
  L.push(`| Instrument | Item | Verdict | Decided by | Rationale |`);
  L.push(`|---|---|---|---|---|`);
  for (const it of items) {
    L.push(`| ${it.instrument} | ${it.item_no} | ${it.verdict} | ${it.decided_by || '—'} | ${esc(it.rationale || '')}${it.ai_contradiction ? ' ⚠ ' + esc(it.ai_contradiction) : ''} |`);
  }
}
L.push('');
if ((d.positive_observations || []).length) {
  L.push(`## Positive observations`);
  L.push('');
  for (const p of d.positive_observations) L.push(`- ${p}`);
  L.push('');
}
L.push(`## Limitations of this screening`);
L.push('');
L.push(`- This tool produces a report about the material; it does not produce accessible content, and it measures the material's literacy demand, not any person's health literacy.`);
L.push(`- WCAG coverage is limited to the listed subset. Out of scope: ${OUT_OF_SCOPE}`);
L.push(`- ${d.not_assessed_count ?? 0} instrument item(s) were not assessed and are excluded from all score denominators.`);
if (Number(d.dropped_unverified) > 0) L.push(`- ${d.dropped_unverified} AI finding(s) were discarded because their evidence quote could not be verified verbatim in the source (anti-fabrication check).`);
if (Number(d.missing_items_count) > 0) L.push(`- The AI did not return ${d.missing_items_count} requested instrument item(s); they are counted as not assessed.`);
if (skipped) L.push(`- Input was pasted text without markup: all deterministic HTML checks were skipped (checks engine: none).`);
if (d.checks_engine === 'regex') L.push(`- HTML checks ran on the regex engine (approximate parsing); see decision log.`);
if (d.content_truncated) L.push(`- Content was truncated at 30,000 characters; everything beyond that point was not analyzed.`);
if (fallback) L.push(`- AI analysis unavailable/invalid (${esc(d.fallback_reason || 'unknown')}): findings and instrument verdicts above are deterministic-only.`);
L.push(`- Accuracy of the AI-assisted findings is unmeasured; confirmed/dismissed review decisions accumulate an empirical false-positive rate over time.`);
L.push('');
L.push(`---`);
L.push(`*${DISCLAIMER}*`);
const report_md = L.join('\n');

// ---- accessibility statement draft -----------------------------------------
const knownIssues = sorted.filter((f) => ['critical', 'high', 'medium'].includes(f.severity));
const S = [];
S.push(`# Accessibility Statement — DRAFT`);
S.push('');
S.push(`> **DRAFT — requires human legal review and a full accessibility audit before publication. No conformance claim is made or implied.**`);
S.push('');
S.push(`This draft is based on an automated screening of ${d.source_type === 'text' ? 'supplied text content' : `the page ${d.page_url || ''}`} on ${now.slice(0, 10)}.`);
S.push('');
S.push(`## What was evaluated`);
S.push('');
S.push(`The screening covered the following WCAG 2.2 success criteria only: ${evaluated.join(', ')}.`);
S.push('');
S.push(`## What was NOT evaluated`);
S.push('');
S.push(OUT_OF_SCOPE);
S.push('');
S.push(`Because the evaluation covers only this subset, this statement cannot and does not claim WCAG 2.2 conformance at any level.`);
S.push('');
S.push(`## Screening result`);
S.push('');
S.push(`Within the screened subset: **${esc(d.screening_label || 'not available')}** (screening score ${score(d.screening_score)} of 100, including AI-proposed findings; ${score(d.screening_score_deterministic)} of 100 from the deterministic checks alone).`);
S.push('');
S.push(`## Known issues`);
S.push('');
if (!knownIssues.length) S.push(`No issues of medium or higher severity were found within the screened subset.`);
else for (const f of knownIssues) S.push(`- ${esc(f.title)} (${f.severity})`);
S.push('');
if (d.eaa_scope) {
  S.push(`## Legal framework`);
  S.push('');
  S.push(`The auditor has declared this service within scope of the European Accessibility Act (Directive (EU) 2019/882) / German BFSG. Whether the EAA/BFSG actually applies is a legal determination that must be made by a qualified person; this tool records the declaration and makes no legal assessment.`);
  S.push('');
}
S.push(`## Feedback`);
S.push('');
S.push(`If you encounter barriers using this content, contact: **[CONTACT DETAILS — TO BE COMPLETED]**`);
S.push('');
S.push(`---`);
S.push(`*Generated by A11yAudit (automated screening). ${DISCLAIMER}*`);
const statement_draft = S.join('\n');

// ---- return ----------------------------------------------------------------
return [{
  json: {
    audit_id,
    report_md,
    statement_draft,
    // completed_at is set ONLY when the audit is actually complete. An audit
    // awaiting human review is not finished, and a timestamp in that column
    // would read as if it were (corrected 4 Aug — see D-31). The report's own
    // generation time is printed in the report header regardless.
    completed_at: d.human_review_required ? null : now,
    status: d.human_review_required ? 'needs_review' : 'completed',
  },
}];

/* ============================================================================
 * STANDALONE TEST INPUT — pin this on the node in n8n (Input panel → Pin data).
 * This is the Decision Engine's output for the known BD scenario. Expected:
 *   - report_md: metadata table · four scores (77 / 50 / 50 / 75) ·
 *     "Human review required" with rules R1, R7, R8, R9 · 3 findings
 *     (upgrade noted "critical (upgraded from high by R9)") · instrument
 *     table with the ⚠ AI-contradiction on PEMAT 8 · limitations incl.
 *     1 dropped unverified finding · adaptation disclaimer at the end
 *   - statement_draft: DRAFT banner · evaluated criteria list (full, since
 *     automated checks ran) · known issues: the 3 findings ≥ medium ·
 *     no "Legal framework" section (eaa_scope false)
 *   - status: "needs_review"

[
  {
    "json": {
      "source_type": "url",
      "page_url": "https://example.org/med",
      "page_title": "Medication guide",
      "content_language": "en",
      "audience": "patients and family members, average to low health literacy",
      "eaa_scope": false,
      "word_count": 44,
      "content_truncated": false,
      "automated_checks_skipped": false,
      "checks_engine": "cheerio",
      "safety_context": true,
      "safety_terms_found": ["bd", "tablet"],
      "ai_fallback_used": false,
      "ai_disagreement": true,
      "ai_summary": "The material uses an unexplained dosing abbreviation; otherwise readable.",
      "positive_observations": ["Short sentences throughout."],
      "dropped_unverified": 1,
      "missing_items_count": 26,
      "not_assessed_count": 1,
      "screening_score": 77,
      "screening_label": "issues found",
      "pemat_understandability": 50,
      "pemat_actionability": 50,
      "cci_score": 75,
      "human_review_required": true,
      "triggered_rules": ["R1", "R6", "R7", "R8", "R9"],
      "legally_relevant": false,
      "findings": [
        { "finding_key": "ai-pemat4-abbrev-bd", "wcag_criterion": "3.1.4", "wcag_level": "A", "category": "understandable", "instrument": "PEMAT", "instrument_item": 4, "severity": "critical", "original_severity": "high", "severity_upgraded_by": "R9", "confidence": 0.92, "title": "Dosing abbreviation BD never explained", "explanation_plain": "BD means twice daily but is never defined. A reader could take the wrong dose.", "recommendation": "Write 'twice a day' or define BD at first use.", "evidence": "Take 1 tablet BD with food.", "source": "ai" },
        { "finding_key": "auto-3.3.2-input-label", "wcag_criterion": "3.3.2", "wcag_level": "A", "category": "understandable", "severity": "high", "confidence": 1.0, "title": "1 form field(s) without a label", "explanation_plain": "Unlabelled form fields leave screen-reader users guessing what to enter.", "recommendation": "Associate every field with a label.", "evidence": "<input type='text' name='email'>", "source": "automated", "ai_explanation_plain": "The email box has no visible label." },
        { "finding_key": "ai-cci11-sources", "wcag_criterion": null, "wcag_level": null, "category": "cognitive", "instrument": "CCI", "instrument_item": 11, "severity": "medium", "confidence": 0.7, "title": "No mention of what is known or unknown", "explanation_plain": "The material does not say what authoritative sources know or do not know.", "recommendation": "Add a short evidence note.", "evidence": "If you miss a dose, contact your GP surgery.", "source": "ai" }
      ],
      "instrument_items": [
        { "instrument": "CCI", "item_no": 8, "verdict": "pass", "decided_by": "deterministic", "rationale": "Lists present, none longer than 7 items." },
        { "instrument": "CCI", "item_no": 11, "verdict": "fail", "decided_by": "ai", "rationale": "Known/unknown not addressed." },
        { "instrument": "CCI", "item_no": 15, "verdict": "not_assessed", "decided_by": "deterministic", "rationale": "Not returned by the AI." },
        { "instrument": "PEMAT", "item_no": 4, "verdict": "fail", "decided_by": "ai", "rationale": "BD is used without definition." },
        { "instrument": "PEMAT", "item_no": 8, "verdict": "fail", "decided_by": "deterministic", "rationale": "A section exceeds 150 words.", "ai_contradiction": "AI judged \"pass\": Sections look short to me." }
      ]
    }
  }
]

 * ========================================================================== */
