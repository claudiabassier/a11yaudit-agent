/**
 * ============================================================================
 * Node 5 (URL branch) — Automated Checks (Code, no AI)   ·   Workflow: WF1
 * Spec: workflow_spec.md §1 Node 5 · Checks: knowledge_base.md §1.1 (v2.1)
 * VERSION: cheerio. Requires NODE_FUNCTION_ALLOW_EXTERNAL=cheerio on the
 * n8n container AND the Day-1 cheerio test passing. There is no fallback
 * engine any more — a regex-based twin existed as a Day-1 contingency
 * (decision_log.md D-17) in case cheerio was unreachable, was never
 * deployed (cheerio passed Day 1), and was retired 18 August (D-69) once it
 * had drifted three known defects behind this file with no production use
 * to justify keeping it current. If cheerio ever becomes unreachable again,
 * that is a new, undiagnosed problem — do not assume the old fallback is
 * still an option.
 * ============================================================================
 *
 * PURPOSE
 *   Everything machine-decidable about the fetched HTML, decided by code:
 *   (a) nine deterministic WCAG checks → automated_findings
 *   (b) machine-decidable instrument items → deterministic_items
 *   (c) content_text extracted as lightweight MARKDOWN (review fix #2), so
 *       the AI can still see headings/lists/order, plus word & paragraph
 *       counts and the AHRQ "very short" flag.
 *
 * EXPECTED INPUT (one item, from Node 4 Fetch Page)
 *   item.json.data | .body | .html — the HTML string (field varies with the
 *   HTTP Request node's response settings; all three are tried).
 *   Form metadata is read from $('Normalize Input'); when that node is
 *   absent (standalone test), the same fields are read off the input item.
 *
 * OUTPUT (one item)
 *   { json: {
 *       ...form metadata (source_type, page_url, page_title,
 *          content_language, audience, eaa_scope, auditor_note, started_at),
 *       content_text: string (markdown), word_count, paragraph_count,
 *       is_very_short: boolean,               // ≤2 paragraphs (AHRQ)
 *       automated_findings: [ { finding_key, wcag_criterion, wcag_level,
 *          category, severity, confidence: 1.0, title, explanation_plain,
 *          recommendation, evidence, source: "automated" } ],
 *       deterministic_items: { "PEMAT_8": "pass|fail|not_applicable", ... },
 *       deterministic_observations: [ { instrument, item_no, verdict,
 *          rationale, evidence: null, decided_by: "deterministic" } ],
 *       automated_checks_skipped: false,
 *       checks_engine: "cheerio"
 *   } }
 * ============================================================================
 */

let cheerio;
try { cheerio = require('cheerio'); }
catch (e) {
  throw new Error('cheerio is not reachable in this Code node. The regex fallback that used to handle this case was retired 18 August (decision_log.md D-69, never deployed, three known defects behind this file) — this now needs fresh diagnosis, not a switch to a standby file.');
}

// ---- input -----------------------------------------------------------------
const item = $input.all()[0] || { json: {} };
const j = item.json || {};
let meta = {};
try { meta = $('Normalize Input').first().json || {}; } catch (e) { meta = {}; }
const M = (k, d = null) => (j[k] !== undefined ? j[k] : (meta[k] !== undefined ? meta[k] : d));

const htmlCandidates = [j.data, j.body, j.html];
let html = '';
for (const c of htmlCandidates) if (typeof c === 'string' && c.includes('<') && c.length > html.length) html = c;
if (!html) throw new Error('Automated Checks: no HTML string found on the input item (looked in data/body/html).');

const $doc = cheerio.load(html);
$doc('script,style,noscript,svg,iframe,template').remove();
const trunc = (s, n = 200) => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };
const outer = (el) => trunc($doc.html(el) || '');
const words = (s) => (String(s).trim().match(/\S+/g) || []).length;

// ---- content scope: isolate main content from navigation/boilerplate ------
// FIX (18 Aug, Woche 1b real-page testing, decision_log.md D-68): the block
// extraction below used to walk h1-h6/p/ul/ol/table across the WHOLE
// document. Fine for the fixtures (bare <body>, no surrounding chrome),
// broken on any real page — found live against
// nhs.uk/medicines/paracetamol-for-adults/, whose navigation ("Health A to
// Z", "NHS services", …) and breadcrumbs are real <ul>/<ol> markup and got
// extracted as if they were article content, corrupting content_text,
// word_count, and every instrument item derived from them.
// Deliberately scoped to CONTENT extraction only — the 9 raw WCAG checks
// below (img alt, link names, form labels, …) still scan the whole $doc,
// unchanged: an unlabelled nav link is a real WCAG violation regardless of
// where on the page it sits, and narrowing those to "main content only"
// would make the tool miss real accessibility problems.
//
// FIX 2 (18 Aug, rigorous review after D-68 landed, decision_log.md
// pending): the first version only stripped nav/header/footer/aside on the
// no-<main> fallback path. When a real <main>/<article>/[role="main"] WAS
// found, it was used as-is with no stripping — but real pages routinely
// nest an in-page "on this page" jump-list or a breadcrumb <nav> INSIDE
// <main>, not just around it. Proven with a synthetic fixture (nested
// <nav><ul>…</ul></nav> as the first child of <main>): content_text came
// back starting with the jump-list's three items ahead of the real <h1> —
// the exact same defect class D-68 fixed, just not closed on this branch.
// Fix: always clone whichever root was chosen (found <main>/<article>, or
// the <body> fallback) and always strip nested nav/header/footer/aside from
// the clone — one code path instead of two asymmetric ones. Cloning before
// stripping (not stripping $doc itself) is required either way, same
// reason as originally documented: the WCAG checks below still need the
// unmodified whole-page $doc.
let $scopeRoot;
for (const sel of ['main', 'article', '[role="main"]']) {
  const found = $doc(sel).first();
  if (found.length && found.text().trim().length > 30) { $scopeRoot = found.clone(); break; }
}
if (!$scopeRoot) $scopeRoot = $doc('body').clone(); // no semantic content container found
$scopeRoot.find('nav,header,footer,aside,[role="navigation"],[role="banner"],[role="contentinfo"]').remove();
// Scoped HTML string, for the one place downstream (CCI 3) that inspects
// raw markup via regex rather than cheerio selectors.
const scopedHtml = $doc.html($scopeRoot) || html;

// ---- (c) markdown extraction (review fix #2) -------------------------------
// blocks: { kind: 'h'|'p'|'list'|'table'|'quote', level?, text, words }
const blocks = [];
const isNested = (el, sel) => $doc(el).parents(sel).length > 0;
$scopeRoot.find('h1,h2,h3,h4,h5,h6,p,ul,ol,table,blockquote,pre').each((_, el) => {
  const tag = el.tagName.toLowerCase();
  if (['p', 'blockquote', 'pre'].includes(tag) && isNested(el, 'ul,ol,table,blockquote')) return;
  if ((tag === 'ul' || tag === 'ol') && isNested(el, 'ul,ol')) return; // nested lists flatten into parent
  if (tag === 'table' && isNested(el, 'table')) return;
  const $el = $doc(el);
  if (/^h[1-6]$/.test(tag)) {
    const t = $el.text().replace(/\s+/g, ' ').trim();
    if (t) blocks.push({ kind: 'h', level: +tag[1], text: '#'.repeat(+tag[1]) + ' ' + t, words: words(t) });
  } else if (tag === 'ul' || tag === 'ol') {
    const lines = [];
    $el.find('li').each((i, li) => {
      const t = $doc(li).clone().children('ul,ol').remove().end().text().replace(/\s+/g, ' ').trim();
      if (t) lines.push((tag === 'ol' ? (i + 1) + '. ' : '- ') + t);
    });
    if (lines.length) blocks.push({ kind: 'list', text: lines.join('\n'), words: words(lines.join(' ')) });
  } else if (tag === 'table') {
    const rows = [];
    $el.find('tr').each((_, tr) => {
      const cells = [];
      $doc(tr).find('th,td').each((_, c) => cells.push($doc(c).text().replace(/\s+/g, ' ').trim()));
      if (cells.join('').length) rows.push(cells.join(' | '));
    });
    if (rows.length) blocks.push({ kind: 'table', text: rows.join('\n'), words: words(rows.join(' ')) });
  } else {
    const t = $el.text().replace(/\s+/g, ' ').trim();
    if (t) blocks.push({ kind: tag === 'blockquote' ? 'quote' : 'p', text: (tag === 'blockquote' ? '> ' : '') + t, words: words(t) });
  }
});
// Fallback for pages with no semantic block markup (text sitting in bare divs):
// FIX (19 Aug, rigorous consistency review): re-scanning $scopeRoot.text()
// directly re-included whatever the semantic pass above had already
// captured, duplicating it in content_text/word_count on any page with a
// LITTLE semantic markup (e.g. one short <p>) plus a lot of bare-div bulk
// text — the < 30-word trigger fires on total semantic word count, not on
// "zero semantic markup found", so the original code's intent (comment
// above) and its actual condition didn't match. Reproduced: a two-word <p>
// next to a 100+-word bare <div> caused the two words to appear twice in
// content_text. Fixed by excluding already-matched elements from a clone
// before reading its text, so only genuinely unclaimed text is added.
if (blocks.reduce((n, b) => n + b.words, 0) < 30) {
  const $unclaimed = $scopeRoot.clone();
  $unclaimed.find('h1,h2,h3,h4,h5,h6,p,ul,ol,table,blockquote,pre').remove();
  const bodyText = $unclaimed.text().replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
  if (words(bodyText) > 30) bodyText.split('\n').map((s) => s.trim()).filter(Boolean)
    .forEach((t) => blocks.push({ kind: 'p', text: t, words: words(t) }));
}

const content_text = blocks.map((b) => b.text).join('\n\n').trim();
const word_count = blocks.reduce((n, b) => n + b.words, 0);
const paragraph_count = blocks.filter((b) => b.kind !== 'h').length;
const is_very_short = paragraph_count <= 2;

// ---- (a) nine WCAG checks (knowledge_base.md §1.1) -------------------------
const findings = [];
const F = (key, sc, level, category, severity, title, expl, rec, evidence) =>
  findings.push({ finding_key: key, wcag_criterion: sc, wcag_level: level, category, severity,
    confidence: 1.0, title, explanation_plain: expl, recommendation: rec, evidence, source: 'automated' });

// 1 — <img> without alt (1.1.1, high)
const badImgs = $doc('img').filter((_, el) => $doc(el).attr('alt') === undefined);
if (badImgs.length) F('auto-1.1.1-img-alt', '1.1.1', 'A', 'perceivable', 'high',
  `${badImgs.length} image(s) without alt attribute`,
  'Images without an alt attribute are invisible to screen-reader users; assistive technology may read the file name instead.',
  'Add an alt attribute to every image: descriptive if informative, empty (alt="") if decorative.',
  outer(badImgs.get(0)));

// 2 — <html> missing lang (3.1.1, high)
const lang = ($doc('html').attr('lang') || '').trim();
if (!lang) F('auto-3.1.1-html-lang', '3.1.1', 'A', 'understandable', 'high',
  'Page language not declared',
  'Without a lang attribute, screen readers guess the pronunciation rules and may read the text in the wrong language.',
  'Add lang="de" or lang="en" to the <html> element.',
  // evidence: the opening <html …> tag itself. Comments are stripped first,
  // otherwise a leading <!-- … --> block would be quoted as the evidence
  // (defect found on the Day-3 fixture run, 4 Aug — see decision_log D-25).
  trunc((html.replace(/<!--[\s\S]*?-->/g, '').match(/<html[^>]*>/i) || ['<html>'])[0]));

// 3 — no <h1> / heading level skipped (1.3.1, medium)
const hLevels = []; $doc('h1,h2,h3,h4,h5,h6').each((_, el) => hLevels.push(+el.tagName[1]));
if (hLevels.length && !hLevels.includes(1)) F('auto-1.3.1-no-h1', '1.3.1', 'A', 'perceivable', 'medium',
  'No top-level heading (h1)',
  'Screen-reader users navigate by headings; without an h1 the page has no announced main topic.',
  'Give the page exactly one h1 stating its main topic.', `heading levels found: ${hLevels.join(', ')}`);
for (let i = 1; i < hLevels.length; i++) if (hLevels[i] - hLevels[i - 1] > 1) {
  F('auto-1.3.1-heading-skip', '1.3.1', 'A', 'perceivable', 'medium',
    `Heading level skipped (h${hLevels[i - 1]} → h${hLevels[i]})`,
    'Skipped heading levels break the outline that assistive technology builds from the page.',
    'Use consecutive heading levels; do not jump levels for visual effect.',
    `heading sequence: ${hLevels.join(' → ')}`);
  break;
}

// 4 — link or button without accessible name (2.4.4/4.1.2, high)
const noName = $doc('a,button').filter((_, el) => {
  const $el = $doc(el);
  if ($el.text().replace(/\s+/g, '').length) return false;
  if (($el.attr('aria-label') || '').trim() || ($el.attr('title') || '').trim() || $el.attr('aria-labelledby')) return false;
  if ($el.find('img').filter((_, im) => ($doc(im).attr('alt') || '').trim()).length) return false;
  return true;
});
if (noName.length) F('auto-2.4.4-link-name', '2.4.4', 'A', 'operable', 'high',
  `${noName.length} link(s)/button(s) without accessible name`,
  'A control with no text and no label is announced only as "link" or "button" — the user cannot know what it does.',
  'Give every link and button visible text, or an aria-label if it is icon-only.',
  outer(noName.get(0)));

// 5 — <input> without label (3.3.2, high)
const noLabel = $doc('input,select,textarea').filter((_, el) => {
  const $el = $doc(el);
  const type = ($el.attr('type') || 'text').toLowerCase();
  if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) return false;
  if (($el.attr('aria-label') || '').trim() || $el.attr('aria-labelledby')) return false;
  // BUG FOUND (18 Aug, rigorous review after D-68): building a CSS
  // attribute selector by interpolating the id straight into a string
  // (`label[for="${id}"]`) throws uncaught ("Attribute selector didn't
  // terminate") on any id containing a double quote — legal in HTML, and
  // this tool audits arbitrary untrusted pages, so a single malformed id
  // anywhere on the page crashed the whole node. Reproduced with
  // id='weird"id' before fixing. Fixed by comparing the attribute value
  // directly instead of building a selector string — immune to special
  // characters by construction, not by escaping.
  const id = $el.attr('id');
  if (id && $doc('label').filter((_, l) => $doc(l).attr('for') === id).length) return false;
  if ($el.parents('label').length) return false;
  return true;
});
if (noLabel.length) F('auto-3.3.2-input-label', '3.3.2', 'A', 'understandable', 'high',
  `${noLabel.length} form field(s) without a label`,
  'Unlabelled form fields leave screen-reader users guessing what to enter.',
  'Associate every field with a <label for="…">, or add aria-label.',
  outer(noLabel.get(0)));

// 6 — missing <title> (2.4.2, medium)
if (!$doc('head title').text().trim()) F('auto-2.4.2-title', '2.4.2', 'A', 'operable', 'medium',
  'Page has no title',
  'The title is the first thing a screen reader announces and what appears in tabs and bookmarks.',
  'Add a descriptive <title> in the <head>.', '<head> contains no non-empty <title>');

// 7 — positive tabindex (2.4.3, medium)
const posTab = $doc('[tabindex]').filter((_, el) => parseInt($doc(el).attr('tabindex'), 10) > 0);
if (posTab.length) F('auto-2.4.3-tabindex', '2.4.3', 'A', 'operable', 'medium',
  `${posTab.length} element(s) with positive tabindex`,
  'Positive tabindex overrides the natural keyboard order and makes focus jump unpredictably.',
  'Remove positive tabindex values; use tabindex="0" or source order instead.',
  outer(posTab.get(0)));

// 8 — meta refresh (2.2.1, high)
const metaRefresh = $doc('meta').filter((_, el) => /^refresh$/i.test($doc(el).attr('http-equiv') || ''));
if (metaRefresh.length) F('auto-2.2.1-meta-refresh', '2.2.1', 'A', 'operable', 'high',
  'Page uses meta refresh',
  'Automatic refresh or redirect takes control away from the user and can interrupt reading mid-task.',
  'Remove the meta refresh; let the user control navigation and reloads.',
  outer(metaRefresh.get(0)));

// 9 — table without <th> (1.3.1, medium)
const badTables = $doc('table').filter((_, el) => !$doc(el).find('th').length);
if (badTables.length) F('auto-1.3.1-table-th', '1.3.1', 'A', 'perceivable', 'medium',
  `${badTables.length} data table(s) without header cells`,
  'Without <th> header cells a screen reader cannot tell the user what each column or row means.',
  'Mark header cells with <th> (and scope="col"/"row" where needed).',
  outer(badTables.get(0)));

// ---- (b) deterministic instrument observations -----------------------------
const det = {}; const obs = [];
const O = (instr, no, verdict, rationale) => {
  det[`${instr}_${no}`] = verdict;
  obs.push({ instrument: instr, item_no: no, verdict, rationale, evidence: null, decided_by: 'deterministic' });
};
// section word counts: text between consecutive headings
const sections = []; let cur = 0;
for (const b of blocks) { if (b.kind === 'h') { sections.push(cur); cur = 0; } else cur += b.words; }
sections.push(cur);
// Content-scoped heading count — deliberately NOT the same as hLevels
// above (which stays whole-page for the WCAG no-h1/heading-skip check,
// a legitimate page-wide concern). PEMAT 9 / CCI 9 are about the
// material's own structure, so nav/footer headings shouldn't count here.
const headingCount = $scopeRoot.find('h1,h2,h3,h4,h5,h6').length;
const hasEmphasis = $scopeRoot.find('strong,em,b').length > 0;
const hasList = $scopeRoot.find('ul,ol').length > 0;

// PEMAT 8 — chunking (N/A if very short, AHRQ)
if (is_very_short) O('PEMAT', 8, 'not_applicable', 'Material is very short (≤2 paragraphs); chunking not applicable per AHRQ.');
else if (sections.some((w) => w > 150)) O('PEMAT', 8, 'fail', `At least one section between headings exceeds 150 words (max found: ${Math.max(...sections)}).`);
else O('PEMAT', 8, 'pass', 'No section between headings exceeds 150 words.');
// PEMAT 9 — headers present (informativeness judged by AI)
if (is_very_short) O('PEMAT', 9, 'not_applicable', 'Material is very short; headers not applicable per AHRQ.');
else O('PEMAT', 9, headingCount ? 'pass' : 'fail', headingCount ? `${headingCount} heading(s) present. Informativeness is judged separately by the AI.` : 'No headings in the material.');
// PEMAT 12 — visual cues
O('PEMAT', 12, (hasList || hasEmphasis) ? 'pass' : 'fail',
  (hasList || hasEmphasis) ? 'Lists or emphasis markup present as visual cues.' : 'No lists or emphasis markup found.');
// PEMAT 17 — visual aids have titles/captions (partial: alt/figcaption)
// FIX (rigorous review, 19 Aug): this used to read $doc('img') — the WHOLE
// page, same as WCAG finding #1 above, which is deliberately whole-page
// (an unlabelled nav image is still a real WCAG defect). PEMAT 17 judges
// "the material", the same principle headingCount/hasList/hasEmphasis
// above are already scoped for — reproduced with a synthetic fixture: a
// <main> whose only image has correct alt text still failed PEMAT 17
// because an unrelated <footer> tracking pixel had none. Scoped to
// $scopeRoot, matching every other instrument-item check in this section.
const scopedImgs = $scopeRoot.find('img');
if (!scopedImgs.length) O('PEMAT', 17, 'not_applicable', 'No images in the material.');
else {
  const allCaptioned = scopedImgs.filter((_, el) => !(($doc(el).attr('alt') || '').trim()) && !$doc(el).parents('figure').find('figcaption').length).length === 0;
  O('PEMAT', 17, allCaptioned ? 'pass' : 'fail', allCaptioned ? 'Every image has non-empty alt text or a figcaption.' : 'At least one image lacks both alt text and a figcaption.');
}
// PEMAT 19 — simple tables with headings (partial: <th> present)
// Same fix as PEMAT 17 above: was $doc('table')/badTables (whole-page,
// correct for WCAG finding #9, wrong for this instrument judgment) —
// reproduced the same way, a footer copyright table with no <th> failing
// PEMAT 19 despite a correctly-headed table inside <main>.
const scopedTables = $scopeRoot.find('table');
const scopedBadTables = scopedTables.filter((_, el) => !$doc(el).find('th').length);
if (!scopedTables.length) O('PEMAT', 19, 'not_applicable', 'No tables in the material.');
else O('PEMAT', 19, scopedBadTables.length ? 'fail' : 'pass', scopedBadTables.length ? 'At least one table has no header cells.' : 'Every table has header cells.');
// CCI 3 — main message emphasized with visual cues (partial)
// Operationalized: the first section (before the 2nd heading) starts with a
// heading or contains emphasis markup. Scoped to scopedHtml, not the raw
// page html — otherwise a nav/breadcrumb heading before the real content
// would be misread as "the first section".
let firstSectionHtml = scopedHtml;
const hMatches = [...scopedHtml.matchAll(/<h[1-6][\s>]/gi)];
if (hMatches.length >= 2) firstSectionHtml = scopedHtml.slice(0, hMatches[1].index);
const cci3 = (blocks[0] && blocks[0].kind === 'h') || /<(strong|em|b)[\s>]/i.test(firstSectionHtml);
O('CCI', 3, cci3 ? 'pass' : 'fail', cci3 ? 'First section starts with a heading or contains emphasis markup.' : 'No heading or emphasis markup in the first section.');
// CCI 8 — lists used, none unbroken > 7 items
let longList = false;
$scopeRoot.find('ul,ol').each((_, el) => { if ($doc(el).children('li').length > 7) longList = true; });
O('CCI', 8, (hasList && !longList) ? 'pass' : 'fail',
  !hasList ? 'No bulleted or numbered lists in the material.' : longList ? 'A list runs longer than 7 items without a break (CDC rule).' : 'Lists present, none longer than 7 items.');
// CCI 9 — organized in chunks with headings
O('CCI', 9, headingCount >= 2 ? 'pass' : 'fail',
  headingCount >= 2 ? `${headingCount} headings structure the material into chunks.` : 'Fewer than 2 headings; material is not chunked with headings.');

// ---- return ----------------------------------------------------------------
return [{
  json: {
    source_type: M('source_type', 'url'), page_url: M('page_url'), page_title: M('page_title'),
    content_language: M('content_language', 'en'), audience: M('audience'),
    eaa_scope: M('eaa_scope', false) === true, auditor_note: M('auditor_note'), started_at: M('started_at'),
    content_text, word_count, paragraph_count, is_very_short,
    automated_findings: findings,
    deterministic_items: det,
    deterministic_observations: obs,
    automated_checks_skipped: false,
    checks_engine: 'cheerio',
  },
}];

/* ============================================================================
 * STANDALONE TEST INPUT — pin this on the node in n8n (Input panel → Pin data).
 * A deliberately faulty page. Expected result:
 *   - automated_findings: 6 findings —
 *       1.1.1 (img without alt), 3.1.1 (no lang), 1.3.1 heading skip (h1→h3),
 *       2.4.4 (empty link), 3.3.2 (unlabelled input), 1.3.1 table without th
 *   - deterministic_items: PEMAT_8 pass (very short? no — 3 paragraphs+list),
 *       PEMAT_9 pass, PEMAT_12 pass (list present), PEMAT_17 fail,
 *       PEMAT_19 fail, CCI_3 pass (starts with h1), CCI_8 pass, CCI_9 pass
 *   - content_text: markdown starting "# Taking your medicine"
 *   - is_very_short: false, checks_engine: "cheerio"

[
  {
    "json": {
      "source_type": "url",
      "page_url": "https://example.org/med",
      "content_language": "en",
      "audience": "patients and family members, average to low health literacy",
      "data": "<html><head><title>Medication guide</title></head><body><h1>Taking your medicine</h1><p>Take <strong>one tablet</strong> every morning with water.</p><img src='pill.jpg'><h3>If you miss a dose</h3><p>Do not take a double dose. Contact your GP surgery for advice.</p><ul><li>Keep tablets dry</li><li>Store below 25 degrees</li></ul><table><tr><td>Mon</td><td>1</td></tr></table><a href='/more'></a><form><input type='text' name='email'></form><p>Read the leaflet before use.</p></body></html>"
    }
  }
]

 * ========================================================================== */
