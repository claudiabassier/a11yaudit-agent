/**
 * ============================================================================
 * Node 2 — Normalize Input (Code)   ·   Workflow: WF1
 * Spec: workflow_spec.md §1 Node 2, v2.1
 * ============================================================================
 *
 * PURPOSE
 *   Turns the raw form submission into the clean contract every later node
 *   relies on. Trims everything, empty string → null, decides the branch
 *   (url vs text), rejects unusable input by THROWING (n8n routes the
 *   throw to WF-Error, which is exactly the intended Stop-and-Error path).
 *
 * EXPECTED INPUT (one item, from Node 1 Form Trigger)
 *   n8n form triggers key the fields by their LABEL, so the exact key names
 *   depend on how the form was built. This node accepts common variants
 *   (e.g. "page_url", "Page URL", "URL") via a tolerant lookup — if you
 *   name the form fields exactly page_url / pasted_content / page_title /
 *   content_language / audience / eaa_scope / auditor_note, the first
 *   variant always hits.
 *
 * OUTPUT (one item — the WF1 metadata contract)
 *   { json: { source_type: "url"|"text", page_url, pasted_content,
 *       page_title, content_language: "en"|"de", audience, eaa_scope,
 *       auditor_note, normalize_note, started_at } }
 *   (pasted_content is passed through because Node 6 consumes it on the
 *    text branch; normalize_note records the both-inputs-supplied case.)
 *
 * ERRORS (caught by WF-Error)
 *   no_content — neither URL nor pasted content supplied
 *   bad_url    — URL does not start with http:// or https://
 * ============================================================================
 */

const item = $input.all()[0] || { json: {} };
const j = item.json || {};

// ---- tolerant field lookup -------------------------------------------------
// normalizes keys: lowercase, non-alphanumerics → _ ("Page URL" → "page_url")
const norm = (k) => String(k).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const bag = {};
for (const [k, v] of Object.entries(j)) bag[norm(k)] = v;
const pick = (...names) => {
  for (const n of names) if (bag[n] !== undefined && bag[n] !== null) return bag[n];
  return null;
};
// trim; empty string → null
const clean = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

const page_url = clean(pick('page_url', 'url', 'page_url_optional'));
const pasted_content = clean(pick('pasted_content', 'content', 'pasted_text', 'text'));
const page_title = clean(pick('page_title', 'title'));
const langRaw = clean(pick('content_language', 'language', 'sprache'));
const audience = clean(pick('audience', 'primary_audience'))
  || 'patients and family members, average to low health literacy'; // form default, Node 1 spec
const auditor_note = clean(pick('auditor_note', 'note', 'notes'));
const eaaRaw = pick('eaa_scope', 'eaa', 'eaa_bfsg_scope');
const eaa_scope = eaaRaw === true || String(eaaRaw).toLowerCase() === 'true' || String(eaaRaw).toLowerCase() === 'yes';

// language: dropdown should force en/de; be tolerant of label-style values
let content_language = 'en';
if (langRaw && /^de|german|deutsch/i.test(langRaw)) content_language = 'de';
else if (langRaw && /^en|english|englisch/i.test(langRaw)) content_language = 'en';

// ---- edge cases (spec Node 2) ----------------------------------------------
// NOTE (D-35, 4 Aug): the class token is separated by a hyphen, NOT a colon.
// n8n rewrites a Code-node error message on its way to the Error Trigger: it
// appends "[line N]" and drops everything before the first colon. With a colon
// here, WF-Error received "neither a URL nor pasted content was supplied.
// [line 70]" — no class token — and correctly classified it 'unknown_error'.
// Demonstrated by the first E1 run. Keep the token dash-separated.
if (!page_url && !pasted_content) {
  throw new Error('no_content - neither a URL nor pasted content was supplied.');
}
let normalize_note = null;
if (page_url && pasted_content) {
  normalize_note = 'Both URL and pasted content supplied; URL takes precedence (spec Node 2), pasted content ignored.';
}
if (page_url && !/^https?:\/\//i.test(page_url)) {
  // REVIEW FIX (10 Aug, pre-commit review Teil 2 #1): the raw value used to be
  // quoted directly into this message, which reaches error_log verbatim after
  // WFE_strip_payload.js (whose defences target secrets, not free text/PII).
  // Log length + whitespace presence only — enough to tell "URL typo" from
  // "pasted content in the wrong field" without ever storing the content.
  // No colon in this message: n8n's Error Trigger drops everything before the
  // first colon on its way through (see D-35) — a literal "http://" here would
  // risk cutting the "bad_url" class token off along with it.
  const meta = `${page_url.length} chars, ${/\s/.test(page_url) ? 'contains whitespace' : 'no whitespace'}`;
  throw new Error(`bad_url - the URL field (${meta}) did not begin with http or https.`);
}

// ---- return the contract ---------------------------------------------------
return [{
  json: {
    source_type: page_url ? 'url' : 'text',
    page_url,
    pasted_content: page_url ? null : pasted_content, // URL wins; don't carry ignored text forward
    page_title,
    content_language,
    audience,
    eaa_scope,
    auditor_note,
    normalize_note,
    started_at: new Date().toISOString(),
  },
}];

/* ============================================================================
 * STANDALONE TEST INPUT — pin this on the node in n8n (Input panel → Pin data).
 * Expected: source_type "url", pasted_content null, normalize_note set
 * (both inputs were supplied), eaa_scope true, content_language "de",
 * audience falls back to the form default (field was whitespace only).
 *
 * Also try: remove page_url AND pasted_content → node fails "no_content"
 *           (correct: WF-Error catches it).
 * Also try: page_url "www.example.org" (no scheme) → fails "bad_url".
 * Also try: rename keys to "Page URL" / "Pasted content" → still works
 *           (tolerant lookup).

[
  {
    "json": {
      "page_url": "  https://example.org/gesundheit/blutdruck  ",
      "pasted_content": "Dieser Text wird ignoriert, weil eine URL angegeben wurde.",
      "page_title": "Blutdruck verstehen",
      "content_language": "de",
      "audience": "   ",
      "eaa_scope": true,
      "auditor_note": ""
    }
  }
]

 * ========================================================================== */
