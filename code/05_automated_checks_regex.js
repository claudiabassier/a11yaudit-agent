/**
 * ###########################################################################
 * ###  NOT THE PRODUCTION ENGINE — DO NOT USE WITHOUT FIXING D-25 FIRST   ###
 * ###########################################################################
 *
 * This is the regex fallback twin of `05_automated_checks.js`. It was written
 * on Day 0 so that the Day-1 cheerio decision would cost no build time
 * (decision_log.md D-17). Cheerio PASSED on Day 1, so this file was never
 * deployed and is kept only as the record of that contingency.
 *
 * IT CARRIES A KNOWN DEFECT. D-25: the missing-`lang` finding quotes the
 * wrong evidence. The fix was applied to the cheerio engine on Day 3 and
 * deliberately NOT back-ported here, because back-porting a fix to unused
 * code invites the belief that the code was re-verified — it was not.
 *
 * If this engine is ever needed, fix D-25 first and re-run both fixtures
 * against `05_automated_checks.js` to confirm byte-identical output.
 * ###########################################################################
 */

/**
 * ============================================================================
 * Node 5 (URL branch) — Automated Checks, REGEX FALLBACK   ·   Workflow: WF1
 * Spec: workflow_spec.md §1 Node 5 · Checks: knowledge_base.md §1.1 (v2.1)
 * VERSION: regex, no external modules. Use this if the Day-1 cheerio test
 * fails (task-runner cannot reach NODE_FUNCTION_ALLOW_EXTERNAL modules).
 * Log the switch in decision_log.md per the pre-committed decision rule.
 * ============================================================================
 *
 * SAME PURPOSE AND OUTPUT SHAPE as 05_automated_checks.js, so the two are
 * drop-in interchangeable. Differences to state honestly in the report:
 *   - Regex parsing of HTML is approximate. It handles ordinary pages but
 *     can miss malformed/exotic markup a real parser would catch.
 *   - The label-association check (3.3.2) and accessible-name check (2.4.4)
 *     are simplified: aria-labelledby resolution and images-as-link-text
 *     are checked by attribute presence only.
 *   - checks_engine: "regex" is written to the output and shown in the
 *     report's limitations section.
 *
 * INPUT / OUTPUT: identical to 05_automated_checks.js (see that header).
 * ============================================================================
 */

// ---- input -----------------------------------------------------------------
const item = $input.all()[0] || { json: {} };
const j = item.json || {};
let meta = {};
try { meta = $('Normalize Input').first().json || {}; } catch (e) { meta = {}; }
const M = (k, d = null) => (j[k] !== undefined ? j[k] : (meta[k] !== undefined ? meta[k] : d));

let html = '';
for (const c of [j.data, j.body, j.html]) if (typeof c === 'string' && c.includes('<') && c.length > html.length) html = c;
if (!html) throw new Error('Automated Checks (regex): no HTML string found on the input item (looked in data/body/html).');

// ---- helpers ---------------------------------------------------------------
const decode = (s) => String(s)
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const stripTags = (s) => decode(String(s).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const trunc = (s, n = 200) => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };
const words = (s) => (String(s).trim().match(/\S+/g) || []).length;
const attr = (tag, name) => {
  const m = tag.match(new RegExp(name + `\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4]) : undefined;
};

// strip non-content regions BEFORE any check or extraction
let doc = html.replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1\s*>/gi, '');
const bodyMatch = doc.match(/<body[^>]*>([\s\S]*?)<\/body\s*>/i);
const body = bodyMatch ? bodyMatch[1] : doc;

// ---- markdown extraction (review fix #2) -----------------------------------
// Walk the body via a block-level tokenizer: headings, paragraphs, lists,
// tables, blockquotes in document order.
// REVIEW FIX (31 Jul): <p> without a closing tag is common in real HTML and
// a naive <p>…</p> regex swallows several paragraphs into one, which changes
// paragraph_count, is_very_short and the PEMAT 8 section word counts. So:
// containers are matched pairwise; <p> is matched with a lookahead terminator
// (its own close tag OR the next block-level tag), and any <p> that starts
// inside a container is skipped.
const raw = [];
const containerRe = /<(h[1-6]|ul|ol|table|blockquote)[^>]*>([\s\S]*?)<\/\1\s*>/gi;
const ranges = [];
let cm;
while ((cm = containerRe.exec(body)) !== null) {
  raw.push({ at: cm.index, tag: cm[1].toLowerCase(), inner: cm[2] });
  ranges.push([cm.index, cm.index + cm[0].length]);
}
const pRe = /<p\b[^>]*>([\s\S]*?)(?=<\/p\s*>|<p\b|<h[1-6]\b|<ul\b|<ol\b|<table\b|<blockquote\b|<\/body\b|$)/gi;
let pm;
while ((pm = pRe.exec(body)) !== null) {
  if (ranges.some(([a, b]) => pm.index > a && pm.index < b)) continue; // inside a container
  raw.push({ at: pm.index, tag: 'p', inner: pm[1] });
}
raw.sort((a, b) => a.at - b.at);

const blocks = [];
for (const bm of raw.map((r) => [null, r.tag, r.inner])) {
  const tag = bm[1]; const inner = bm[2];
  if (/^h[1-6]$/.test(tag)) {
    const t = stripTags(inner);
    if (t) blocks.push({ kind: 'h', level: +tag[1], text: '#'.repeat(+tag[1]) + ' ' + t, words: words(t) });
  } else if (tag === 'ul' || tag === 'ol') {
    const lines = []; let li; const liRe = /<li[^>]*>([\s\S]*?)(?=<li[^>]*>|<\/(?:ul|ol)|$)/gi; let i = 0;
    while ((li = liRe.exec(inner)) !== null) {
      const t = stripTags(li[1].replace(/<\/li\s*>/gi, ' '));
      if (t) lines.push((tag === 'ol' ? (++i) + '. ' : '- ') + t);
    }
    if (lines.length) blocks.push({ kind: 'list', text: lines.join('\n'), words: words(lines.join(' ')) });
  } else if (tag === 'table') {
    const rows = []; let tr; const trRe = /<tr[^>]*>([\s\S]*?)<\/tr\s*>/gi;
    while ((tr = trRe.exec(inner)) !== null) {
      const cells = []; let c; const cRe = /<(th|td)[^>]*>([\s\S]*?)<\/\1\s*>/gi;
      while ((c = cRe.exec(tr[1])) !== null) cells.push(stripTags(c[2]));
      if (cells.join('').length) rows.push(cells.join(' | '));
    }
    if (rows.length) blocks.push({ kind: 'table', text: rows.join('\n'), words: words(rows.join(' ')) });
  } else {
    const t = stripTags(inner);
    if (t) blocks.push({ kind: tag === 'blockquote' ? 'quote' : 'p', text: (tag === 'blockquote' ? '> ' : '') + t, words: words(t) });
  }
}
// Fallback for pages without semantic block markup:
if (blocks.reduce((n, b) => n + b.words, 0) < 30) {
  const t = stripTags(body);
  if (words(t) > 30) blocks.push({ kind: 'p', text: t, words: words(t) });
}

const content_text = blocks.map((b) => b.text).join('\n\n').trim();
const word_count = blocks.reduce((n, b) => n + b.words, 0);
const paragraph_count = blocks.filter((b) => b.kind !== 'h').length;
const is_very_short = paragraph_count <= 2;

// ---- nine WCAG checks (knowledge_base.md §1.1) -----------------------------
const findings = [];
const F = (key, sc, level, category, severity, title, expl, rec, evidence) =>
  findings.push({ finding_key: key, wcag_criterion: sc, wcag_level: level, category, severity,
    confidence: 1.0, title, explanation_plain: expl, recommendation: rec, evidence, source: 'automated' });

const imgTags = doc.match(/<img\b[^>]*>/gi) || [];

// 1 — <img> without alt (1.1.1, high)
const badImgs = imgTags.filter((t) => attr(t, 'alt') === undefined);
if (badImgs.length) F('auto-1.1.1-img-alt', '1.1.1', 'A', 'perceivable', 'high',
  `${badImgs.length} image(s) without alt attribute`,
  'Images without an alt attribute are invisible to screen-reader users; assistive technology may read the file name instead.',
  'Add an alt attribute to every image: descriptive if informative, empty (alt="") if decorative.',
  trunc(badImgs[0]));

// 2 — <html> missing lang (3.1.1, high)
const htmlTag = (doc.match(/<html\b[^>]*>/i) || [''])[0];
if (!htmlTag || !(attr(htmlTag, 'lang') || '').trim()) F('auto-3.1.1-html-lang', '3.1.1', 'A', 'understandable', 'high',
  'Page language not declared',
  'Without a lang attribute, screen readers guess the pronunciation rules and may read the text in the wrong language.',
  'Add lang="de" or lang="en" to the <html> element.', trunc(htmlTag || '<html>'));

// 3 — no <h1> / heading level skipped (1.3.1, medium)
const hLevels = (body.match(/<h([1-6])[\s>]/gi) || []).map((t) => +t.match(/\d/)[0]);
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

// 4 — link or button without accessible name (2.4.4/4.1.2, high) — simplified
const ctlRe = /<(a|button)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi;
let ctl; const noName = [];
while ((ctl = ctlRe.exec(body)) !== null) {
  const attrs = ctl[2]; const inner = ctl[3];
  if (stripTags(inner).length) continue;
  if (/aria-label\s*=|aria-labelledby\s*=|title\s*=/i.test(attrs)) continue;
  const innerImgAlt = (inner.match(/<img\b[^>]*>/gi) || []).some((t) => (attr(t, 'alt') || '').trim());
  if (innerImgAlt) continue;
  noName.push(ctl[0]);
}
if (noName.length) F('auto-2.4.4-link-name', '2.4.4', 'A', 'operable', 'high',
  `${noName.length} link(s)/button(s) without accessible name`,
  'A control with no text and no label is announced only as "link" or "button" — the user cannot know what it does.',
  'Give every link and button visible text, or an aria-label if it is icon-only.', trunc(noName[0]));

// 5 — <input> without label (3.3.2, high) — simplified association check
const labelForIds = new Set((body.match(/<label\b[^>]*\bfor\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi) || [])
  .map((t) => attr(t, 'for')).filter(Boolean));
const fieldTags = body.match(/<(input|select|textarea)\b[^>]*>/gi) || [];
const noLabel = fieldTags.filter((t) => {
  const type = (attr(t, 'type') || 'text').toLowerCase();
  if (/^(hidden|submit|button|reset|image)$/.test(type)) return false;
  if (/aria-label\s*=|aria-labelledby\s*=/i.test(t)) return false;
  const id = attr(t, 'id');
  if (id && labelForIds.has(id)) return false;
  return true; // note: <input> wrapped inside <label> is not detected here (regex limitation)
});
if (noLabel.length) F('auto-3.3.2-input-label', '3.3.2', 'A', 'understandable', 'high',
  `${noLabel.length} form field(s) without a label`,
  'Unlabelled form fields leave screen-reader users guessing what to enter.',
  'Associate every field with a <label for="…">, or add aria-label.', trunc(noLabel[0]));

// 6 — missing <title> (2.4.2, medium)
const titleM = doc.match(/<title[^>]*>([\s\S]*?)<\/title\s*>/i);
if (!titleM || !stripTags(titleM[1])) F('auto-2.4.2-title', '2.4.2', 'A', 'operable', 'medium',
  'Page has no title',
  'The title is the first thing a screen reader announces and what appears in tabs and bookmarks.',
  'Add a descriptive <title> in the <head>.', '<head> contains no non-empty <title>');

// 7 — positive tabindex (2.4.3, medium)
const posTab = (body.match(/<[^>]*\btabindex\s*=\s*("?\+?\d+"?|'\+?\d+')[^>]*>/gi) || [])
  .filter((t) => parseInt(String(attr(t, 'tabindex')).replace(/['"+]/g, ''), 10) > 0);
if (posTab.length) F('auto-2.4.3-tabindex', '2.4.3', 'A', 'operable', 'medium',
  `${posTab.length} element(s) with positive tabindex`,
  'Positive tabindex overrides the natural keyboard order and makes focus jump unpredictably.',
  'Remove positive tabindex values; use tabindex="0" or source order instead.', trunc(posTab[0]));

// 8 — meta refresh (2.2.1, high)
const metaRefresh = (doc.match(/<meta\b[^>]*>/gi) || []).filter((t) => /^refresh$/i.test(attr(t, 'http-equiv') || ''));
if (metaRefresh.length) F('auto-2.2.1-meta-refresh', '2.2.1', 'A', 'operable', 'high',
  'Page uses meta refresh',
  'Automatic refresh or redirect takes control away from the user and can interrupt reading mid-task.',
  'Remove the meta refresh; let the user control navigation and reloads.', trunc(metaRefresh[0]));

// 9 — table without <th> (1.3.1, medium)
const tables = body.match(/<table\b[\s\S]*?<\/table\s*>/gi) || [];
const badTables = tables.filter((t) => !/<th[\s>]/i.test(t));
if (badTables.length) F('auto-1.3.1-table-th', '1.3.1', 'A', 'perceivable', 'medium',
  `${badTables.length} data table(s) without header cells`,
  'Without <th> header cells a screen reader cannot tell the user what each column or row means.',
  'Mark header cells with <th> (and scope="col"/"row" where needed).', trunc(badTables[0]));

// ---- deterministic instrument observations ---------------------------------
const det = {}; const obs = [];
const O = (instr, no, verdict, rationale) => {
  det[`${instr}_${no}`] = verdict;
  obs.push({ instrument: instr, item_no: no, verdict, rationale, evidence: null, decided_by: 'deterministic' });
};
const sections = []; let cur = 0;
for (const b of blocks) { if (b.kind === 'h') { sections.push(cur); cur = 0; } else cur += b.words; }
sections.push(cur);
const headingCount = hLevels.length;
const hasEmphasis = /<(strong|em|b)[\s>]/i.test(body);
const listTags = body.match(/<(ul|ol)\b[\s\S]*?<\/\1\s*>/gi) || [];
const hasList = listTags.length > 0;

if (is_very_short) O('PEMAT', 8, 'not_applicable', 'Material is very short (≤2 paragraphs); chunking not applicable per AHRQ.');
else if (sections.some((w) => w > 150)) O('PEMAT', 8, 'fail', `At least one section between headings exceeds 150 words (max found: ${Math.max(...sections)}).`);
else O('PEMAT', 8, 'pass', 'No section between headings exceeds 150 words.');

if (is_very_short) O('PEMAT', 9, 'not_applicable', 'Material is very short; headers not applicable per AHRQ.');
else O('PEMAT', 9, headingCount ? 'pass' : 'fail', headingCount ? `${headingCount} heading(s) present. Informativeness is judged separately by the AI.` : 'No headings in the material.');

O('PEMAT', 12, (hasList || hasEmphasis) ? 'pass' : 'fail',
  (hasList || hasEmphasis) ? 'Lists or emphasis markup present as visual cues.' : 'No lists or emphasis markup found.');

if (!imgTags.length) O('PEMAT', 17, 'not_applicable', 'No images in the material.');
else {
  // partial: alt presence only; figcaption association is a parser-level check
  const allAlt = imgTags.every((t) => (attr(t, 'alt') || '').trim());
  const hasFigcaption = /<figcaption[\s>]/i.test(body);
  O('PEMAT', 17, (allAlt || hasFigcaption) ? 'pass' : 'fail',
    allAlt ? 'Every image has non-empty alt text.' : hasFigcaption ? 'Figcaptions present (association not verified — regex engine).' : 'At least one image lacks alt text and no figcaptions found.');
}

if (!tables.length) O('PEMAT', 19, 'not_applicable', 'No tables in the material.');
else O('PEMAT', 19, badTables.length ? 'fail' : 'pass', badTables.length ? 'At least one table has no header cells.' : 'Every table has header cells.');

let firstSectionHtml = body;
const hMatches = [...body.matchAll(/<h[1-6][\s>]/gi)];
if (hMatches.length >= 2) firstSectionHtml = body.slice(0, hMatches[1].index);
const cci3 = (blocks[0] && blocks[0].kind === 'h') || /<(strong|em|b)[\s>]/i.test(firstSectionHtml);
O('CCI', 3, cci3 ? 'pass' : 'fail', cci3 ? 'First section starts with a heading or contains emphasis markup.' : 'No heading or emphasis markup in the first section.');

const longList = listTags.some((t) => (t.match(/<li[\s>]/gi) || []).length > 7);
O('CCI', 8, (hasList && !longList) ? 'pass' : 'fail',
  !hasList ? 'No bulleted or numbered lists in the material.' : longList ? 'A list runs longer than 7 items without a break (CDC rule).' : 'Lists present, none longer than 7 items.');

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
    checks_engine: 'regex',
  },
}];

/* ============================================================================
 * STANDALONE TEST INPUT — identical fixture to 05_automated_checks.js, so the
 * two engines can be compared directly. Pin in n8n → Execute node.
 * Expected: same 6 findings, same 8 instrument verdicts, same markdown,
 * checks_engine: "regex". (Known simplification: an <input> wrapped inside a
 * <label> would be flagged here but not by the cheerio version.)

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
