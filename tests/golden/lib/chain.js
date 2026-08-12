'use strict';
/**
 * ============================================================================
 * tests/golden/lib/chain.js
 * ============================================================================
 * Wires the fixed chain 02 → 05 → 08 → 09 → A2 → [pinned] → A4 → (A5) → 11 →
 * 12 → 18 for one fixture, using lib/shim.js's runNode for every stage.
 *
 * Deliberately out of this chain (see tests/golden/README.md for the full
 * list and why): Node 06 (text branch), Fetch Page (fixtures are local
 * files), the Postgres nodes (13/13a/14/14a/17/19), WF-Error, and the real
 * repair-chain re-call (AI Analysis (repair) → Mark Attempt 2 →
 * Call SUB-A_Validate (2)) — there is no second pinned response to feed it.
 *
 * $('...') lookups are wired to mirror the PRODUCTION path for every node
 * except A4: Node 05 receives only `{data: html}}` and must resolve metadata
 * via $('Normalize Input'). A4 is the one exception, updated 12 Aug 2026
 * (Sprint-Schritt 4-5) — it was extracted into its own subworkflow
 * (`SUB-A_Validate-dev`) and no longer resolves context via $('Build
 * Prompt') at all; the caller now merges content_text/deterministic_items
 * onto the item explicitly (mirroring the canvas Set-node "Prep Validate
 * Input"), and attempt/allow_repair are literals the caller sets, not read
 * from anywhere upstream. This fixture always represents the FIRST call
 * (attempt: 1, allow_repair: true) — there is no second pinned response to
 * exercise the repair-branch call (attempt: 2, allow_repair: false), same
 * scope limit as the real repair chain noted above.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { runNode } = require('./shim');
const { makeFakeDate } = require('./fakedate');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const CODE_DIR = path.join(REPO_ROOT, 'code');
const FIXTURES_DIR = path.join(REPO_ROOT, 'fixtures');
const RESPONSES_DIR = path.join(__dirname, '..', 'responses');

// Frozen so the ENTIRE chain output is byte-for-byte reproducible across
// runs, not just "deterministic modulo timestamps". See fakedate.js.
const FIXED_NOW = '2026-08-01T00:00:00.000Z';

const codeCache = {};
function readCode(fileName) {
  if (!codeCache[fileName]) {
    codeCache[fileName] = fs.readFileSync(path.join(CODE_DIR, fileName), 'utf8');
  }
  return codeCache[fileName];
}

const FIXTURES = [
  {
    name: 'bp-meds-poor',
    htmlFile: 'bp-meds-poor.html',
    responseFile: 'poor.json',
    page_url: 'https://example.org/med/bp-meds-poor',
    page_title: 'Blood pressure medication guide (uncorrected)',
  },
  {
    name: 'bp-meds-good',
    htmlFile: 'bp-meds-good.html',
    responseFile: 'good.json',
    page_url: 'https://example.org/med/bp-meds-good',
    page_title: 'Blood pressure medication guide (corrected)',
  },
  {
    name: 'bp-meds-short',
    htmlFile: 'bp-meds-short.html',
    responseFile: 'short.json',
    page_url: 'https://example.org/med/bp-meds-short',
    page_title: 'Water tablet (furosemide) leaflet',
  },
];

/**
 * Runs the full chain for one fixture definition (an entry of FIXTURES).
 * Returns the trace object compared against tests/golden/expected/*.json.
 */
function runFixture(fx) {
  const FakeDate = makeFakeDate(FIXED_NOW);
  const run = (fileName, inputItems, nodeOutputs) =>
    runNode(readCode(fileName), inputItems, { nodeOutputs, fakeDate: FakeDate });

  const nodeOutputs = {};
  const nodes = {};

  // ---- 02 — Normalize Input ------------------------------------------------
  const formItem = {
    json: {
      page_url: fx.page_url,
      page_title: fx.page_title,
      content_language: 'en',
      eaa_scope: false,
      // audience / auditor_note deliberately unset — exercises the default-
      // audience path in both 02 and A2 at zero extra cost.
    },
  };
  const n02 = run('02_normalize_input.js', [formItem], {})[0].json;
  nodes['02_normalize_input'] = n02;
  nodeOutputs['Normalize Input'] = n02;

  // ---- 05 — Automated Checks (cheerio) -------------------------------------
  const html = fs.readFileSync(path.join(FIXTURES_DIR, fx.htmlFile), 'utf8');
  // Only `data` is set (never body/html too) — 05_automated_checks.js picks
  // whichever candidate is the LONGEST string containing '<', so setting more
  // than one risks ambiguity for no reason. Metadata is deliberately NOT
  // merged onto this item — it must come from the $('Normalize Input') shim,
  // exercising the production lookup path rather than the standalone fallback.
  const n05 = run('05_automated_checks.js', [{ json: { data: html } }], nodeOutputs)[0].json;
  nodes['05_automated_checks'] = n05;

  // ---- 08 — Hash + Guard ----------------------------------------------------
  const n08 = run('08_hash_guard.js', [{ json: n05 }], {})[0].json;
  nodes['08_hash_guard'] = n08;

  // ---- 09 — Safety Prescreen -------------------------------------------------
  const n09 = run('09_safety_prescreen.js', [{ json: n08 }], {})[0].json;
  nodes['09_safety_prescreen'] = n09;
  nodeOutputs['Safety Prescreen'] = n09;

  // ---- A2 — Build Prompt ------------------------------------------------------
  const a2 = run('A2_build_prompt.js', [{ json: n09 }], {})[0].json;
  nodes['A2_build_prompt'] = a2;
  nodeOutputs['Build Prompt'] = a2;

  // ---- [pinned] — replaces the "AI Analysis" node ----------------------------
  const pinned = JSON.parse(fs.readFileSync(path.join(RESPONSES_DIR, fx.responseFile), 'utf8'));

  // ---- A4 — Validate Output (now: SUB-A_Validate-dev, called with attempt 1) --
  // Contract updated 12 Aug 2026 (Sprint-Schritt 4-5): explicit input, not a
  // $('Build Prompt') lookup — content_text/deterministic_items are merged
  // onto the item here, the same way the canvas Set-node "Prep Validate
  // Input" does before the real Execute-Workflow call. Passing {} (not
  // nodeOutputs) as the $ shim below is deliberate: if A4 still referenced
  // $('Build Prompt') anywhere, this would throw "unreachable node" and fail
  // the test loudly, which is the regression check that the old coupling is
  // really gone, not just assumed gone.
  const a4Input = Object.assign({}, pinned, {
    content_text: a2.content_text,
    deterministic_items: a2.deterministic_items,
    attempt: 1,
    allow_repair: true,
  });
  const a4 = run('A4_validate_output.js', [{ json: a4Input }], {})[0].json;
  nodes['A4_validate_output'] = a4;

  // ---- (A5 — Fallback, only when A4 rejects) ---------------------------------
  // Scope simplification, documented in README.md and decision_log.md: the
  // real repair chain (AI Analysis (repair) → Mark Attempt 2 →
  // Call SUB-A_Validate (2)) is NOT re-invoked — there is no second pinned
  // response. Routing A4's invalid output straight through A5 models "repair
  // was attempted and also failed", which is what actually happened in the
  // real D-27 incident this fixture reproduces (same token-ceiling cause on
  // both attempts).
  let subAReturn = a4;
  if (a4.valid !== true) {
    const a5 = run('A5_fallback.js', [{ json: a4 }], {})[0].json;
    nodes['A5_fallback'] = a5;
    subAReturn = a5;
  }

  // ---- 11 — Merge Findings ----------------------------------------------------
  const n11 = run('11_merge_findings.js', [{ json: subAReturn }], nodeOutputs)[0].json;
  nodes['11_merge_findings'] = n11;

  // ---- 12 — Decision Engine ----------------------------------------------------
  const n12 = run('12_decision_engine.js', [{ json: n11 }], {})[0].json;
  nodes['12_decision_engine'] = n12;
  nodeOutputs['Decision Engine'] = n12;

  // ---- 18 — Generate Report ----------------------------------------------------
  // 'Upsert Audit' is deliberately NOT registered — Node 18's own documented
  // fallback (audit_id: '(pending)') is what we want to exercise; there is no
  // Postgres layer in this harness.
  const n18 = run('18_generate_report.js', [{ json: n12 }], nodeOutputs)[0].json;
  nodes['18_generate_report'] = n18;

  return { fixture: fx.name, fixed_now: FIXED_NOW, nodes };
}

module.exports = { FIXTURES, runFixture, FIXED_NOW };
