/**
 * ============================================================================
 * Node 9 — Safety Prescreen (Code, deterministic)   ·   Workflow: WF1
 * Spec: workflow_spec.md §1 Node 9 · Term list: knowledge_base.md §4 (v2.1)
 * ============================================================================
 *
 * PURPOSE
 *   Deterministic scan of the content for medical-safety terms BEFORE the
 *   AI call, so that safety routing (rules R7/R9) never depends on the AI
 *   being available or correct.
 *
 * TWO-TIER MATCHING RULE (v2.1 review fix)
 *   Tier A — long, unambiguous terms match standalone (word-bounded;
 *            stems like "contraindicat" also match their inflections).
 *   Tier B — short dosing abbreviations (bd, im, od, stat, …) match ONLY
 *            within 40 characters of a number, unit, or dose-form word.
 *            Otherwise German "im" ("in the") would flag every German page
 *            and destroy the tool's ability to discriminate (test E14).
 *
 * EXPECTED INPUT (one item, from Node 8 Hash + Guard)
 *   { json: { content_text: string, ...other fields } }
 *
 * OUTPUT (one item — input json passed through, plus:)
 *   { json: { ...input,
 *       safety_terms_found: string[],   // unique canonical terms, e.g. ["bd","tablet"]
 *       safety_context: boolean         // true → rule R7 forces human review
 *   } }
 *
 * NOTES
 *   - \b does not work next to umlauts (ü is a non-word char to \b), so
 *     boundaries are Unicode-letter lookarounds instead: (?<!\p{L}) … (?!\p{L}).
 *   - Stems marked prefix:true match continuations ("contraindicated",
 *     "Nebenwirkungen"). Case-insensitive throughout.
 *   - This list is FIXED in knowledge_base.md §4. Change it there first.
 * ============================================================================
 */

// ---- Tier A: standalone terms (knowledge_base.md §4, all four groups) ------
// { t: term, p: true } → prefix/stem match (inflections allowed)
const TIER_A = [
  // dose / units
  { t: 'mg' }, { t: 'mcg' }, { t: 'µg' }, { t: 'ml' }, { t: 'IU' }, { t: 'units' },
  { t: 'tablet', p: true }, { t: 'capsule', p: true }, { t: 'drops' }, { t: 'puffs' },
  { t: 'Dosis' }, { t: 'Dosierung', p: true }, { t: 'Tablette', p: true }, { t: 'Tropfen' },
  // emergency / escalation
  { t: 'emergency' }, { t: 'immediately' }, { t: 'urgent', p: true },
  { t: 'call\\s+911', rx: true }, { t: 'call\\s+your\\s+doctor', rx: true },
  { t: 'seek\\s+medical\\s+attention', rx: true },
  { t: 'Notfall', p: true }, { t: 'sofort' }, { t: 'Notaufnahme', p: true },
  // NOTE: "112" is NOT here. REVIEW FIX (31 Jul): on a blood-pressure page
  // "112/70" is a reading, not an emergency number, and standalone matching
  // fired R7 on ordinary content. It is context-gated below instead.
  // risk terms
  { t: 'contraindicat', p: true }, { t: 'overdose', p: true }, { t: 'side\\s+effect', rx: true, p: true },
  { t: 'adverse' }, { t: 'allergic' }, { t: 'interaction', p: true }, { t: 'warning', p: true },
  { t: 'Nebenwirkung', p: true }, { t: 'Wechselwirkung', p: true },
  // stem "Überdos" so Überdosis, Überdosen AND Überdosierung all match
  // (KB §4 lists "Überdosis"; the literal stem misses "Überdosierung"):
  { t: 'Gegenanzeige', p: true }, { t: 'Überdos', p: true, label: 'überdosis' },
  // vulnerable-context terms
  { t: 'pregnan', p: true }, { t: 'Schwangerschaft', p: true },
  { t: 'breastfeed', p: true }, { t: 'Stillzeit' },
  { t: 'child\\s+dose', rx: true, p: true }, { t: 'Kinderdosis' },
  { t: 'suicid', p: true }, { t: 'Suizid', p: true }, { t: 'self-harm' },
];

// ---- Tier B: dosing abbreviations, context-gated ---------------------------
const TIER_B = ['bd','bid','tid','qid','qd','qhs','prn','po','sc','im','iv','stat','ac','pc','od','os','ou'];
const CONTEXT_WINDOW = 40; // chars on each side of the abbreviation
// FIX (19 Aug, external programmer review): the bare \d branch matched ANY
// digit anywhere in the 40-char window, including years and ages nowhere
// near a dose — reproduced with "im Jahr 2020" and "im Alter ab 18 Jahren",
// two ordinary sentences with no dosing content, both flagged safety_context
// true via "im". Bounded to 1–3 digit numbers with digit boundaries
// ((?<!\d)\d{1,3}(?!\d)) so a dose quantity ("1 tablet", "5 mg", "12
// Tropfen") still matches but no digit inside a 4+-digit run (any year,
// most large IDs) does. Does not close every case — a 1–2 digit age
// ("im Alter von 68") can still coincide with "im" by chance — but removes
// the single most common noise source. Reviewer explicitly called this
// low-severity (routes only to an extra human glance, never a missed
// escalation), so narrowing rather than removing the digit branch entirely
// keeps the safety-net property the file's own header documents.
const CONTEXT_RE = /(?<!\d)\d{1,3}(?!\d)|(?<!\p{L})(mg|mcg|µg|ml|tablets?|Tabletten?|capsules?|Kapseln?|drops|Tropfen|dose|Dosis)(?!\p{L})/iu;

// ---- Tier C: emergency numbers, context-gated (REVIEW FIX, 31 Jul) --------
// "112" standalone matches blood-pressure readings, ages, quantities. It
// counts only near a word that makes it a phone number.
// D-37 (5 Aug): '999' and '111' added. The S5 fixture said "Call 111 for
// advice, or 999 if you feel very unwell" and the prescreen saw neither —
// the list held only the EU/German (112) and US (911) numbers while
// English-language patient material is in scope. R7 still fired on that
// page via the word "tablet", so routing was correct, but the emergency
// signal itself was missed. Both remain context-gated, so "111 mg" or a
// quantity of 999 does not fire.
const TIER_C = ['112', '911', '999', '111'];
const EMERGENCY_CONTEXT_RE = /(call|dial|phone|ring|rufen|wähl|anrufen|notruf|notfall|emergency|ambulance|Rettungsdienst)/iu;

// ---- helpers ---------------------------------------------------------------
const B_L = '(?<!\\p{L})'; // left boundary: previous char is not a letter
const B_R = '(?!\\p{L})';  // right boundary: next char is not a letter
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function tierARegex(entry) {
  const core = entry.rx ? entry.t : escapeRx(entry.t);
  return new RegExp(B_L + core + (entry.p ? '' : B_R), 'iu');
}

// ---- run -------------------------------------------------------------------
const out = [];
for (const item of $input.all()) {
  const j = item.json || {};
  const text = (typeof j.content_text === 'string') ? j.content_text : '';
  const found = new Set();

  // Tier A — standalone
  for (const entry of TIER_A) {
    if (tierARegex(entry).test(text)) {
      found.add(entry.label || entry.t.replace(/\\s\+/g, ' ').toLowerCase());
    }
  }

  // Tier B — abbreviation counts only near a number, unit, or dose-form word
  for (const abbr of TIER_B) {
    const re = new RegExp(B_L + escapeRx(abbr) + B_R, 'giu');
    let m;
    while ((m = re.exec(text)) !== null) {
      const from = Math.max(0, m.index - CONTEXT_WINDOW);
      const to = Math.min(text.length, m.index + abbr.length + CONTEXT_WINDOW);
      if (CONTEXT_RE.test(text.slice(from, to))) { found.add(abbr); break; }
    }
  }

  // Tier C — emergency numbers only when the surrounding words make them one
  for (const num of TIER_C) {
    const re = new RegExp('(?<!\\d)' + num + '(?!\\d)', 'g');
    let m;
    while ((m = re.exec(text)) !== null) {
      const from = Math.max(0, m.index - CONTEXT_WINDOW);
      const to = Math.min(text.length, m.index + num.length + CONTEXT_WINDOW);
      if (EMERGENCY_CONTEXT_RE.test(text.slice(from, to))) { found.add(num); break; }
    }
  }

  const terms = [...found].sort();
  out.push({ json: { ...j, safety_terms_found: terms, safety_context: terms.length > 0 } });
}
return out;

/* ============================================================================
 * STANDALONE TEST INPUT — pin this on the node in n8n:
 * open the node → Input panel → "Pin data" → paste the array below → Execute.
 *
 * Expected results, item by item:
 *   1. English dosing text  → safety_context: true,
 *      safety_terms_found contains "bd" (near "1" and "tablet") and "tablet".
 *   2. German everyday text → safety_context: false, terms [].
 *      "im Krankenhaus" does NOT fire (no number/unit/dose word within 40
 *      chars) and "statt" does NOT match "stat" (word boundary).
 *   3. German dosing text   → safety_context: true,
 *      terms contain "mg", "tablette" (stem) and "im" (gated: near "5 mg").
 *   4. Risk-term text       → safety_context: true, contains "side effect",
 *      "überdosis" — stems match "side effects", "Überdosierung".

[
  { "json": { "content_text": "Take 1 tablet BD with food. Do not exceed the stated amount." } },
  { "json": { "content_text": "Unsere Sprechzeiten finden im Krankenhaus statt. Termine bitte online buchen." } },
  { "json": { "content_text": "Nehmen Sie 5 mg (eine halbe Tablette) morgens ein, i.m. Injektionen nur beim Arzt — im Notdienst 5 mg zusätzlich." } },
  { "json": { "content_text": "Side effects include dizziness. Eine Überdosierung kann gefährlich sein." } }
]

 * ========================================================================== */
