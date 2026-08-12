#!/usr/bin/env node
'use strict';
/**
 * ============================================================================
 * tests/golden/engine_drift.js
 * ============================================================================
 * Drift watchdog between the two Node-5 engines: code/05_automated_checks.js
 * (cheerio, production) and code/05_automated_checks_regex.js (regex,
 * unused fallback — see that file's own header: "NOT THE PRODUCTION ENGINE").
 *
 * D-17 built them as twins and verified byte-identical output on Day 1. D-25
 * fixed an evidence-extraction defect in the cheerio engine on Day 3 and
 * deliberately did NOT back-port it to the regex engine, on the grounds that
 * porting a fix to unused code invites the belief it was re-verified when it
 * was not. This script re-checks that claim directly against the current
 * code, on all three fixtures, rather than trusting the decision log's prose
 * description of it — matching this project's own rule that documentation
 * drifts silently and must be checked against the artefact, not the summary
 * of the artefact (D-34's process note).
 *
 * Unlike run.js, this does NOT compare against a hand-verified expected/*
 * file — there is nothing to pin here, both engines run on the same real
 * fixture HTML, no AI involved. It compares the two engines' outputs
 * DIRECTLY against each other and reports every difference. `checks_engine`
 * is excluded from the comparison on purpose: it is supposed to differ
 * ("cheerio" vs "regex") and is not drift.
 *
 * Exit code 0 = byte-identical output (excluding checks_engine) on every
 * fixture. Exit code 1 = at least one difference found — this does not by
 * itself mean a regression (D-25's divergence, if it reproduces here, is a
 * known and accepted one for an engine that is not in production use); it
 * means a human should look at what changed and judge it.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { runNode } = require('./lib/shim');
const { makeFakeDate } = require('./lib/fakedate');
const { diff } = require('./lib/diff');
const { FIXTURES } = require('./lib/chain');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CODE_DIR = path.join(REPO_ROOT, 'code');
const FIXTURES_DIR = path.join(REPO_ROOT, 'fixtures');
const FIXED_NOW = '2026-08-01T00:00:00.000Z';

const codeCache = {};
function readCode(fileName) {
  if (!codeCache[fileName]) {
    codeCache[fileName] = fs.readFileSync(path.join(CODE_DIR, fileName), 'utf8');
  }
  return codeCache[fileName];
}

function printDiffs(deviations) {
  for (const d of deviations) {
    const detail =
      d.kind === 'missing_key' ? `only in cheerio output`
      : d.kind === 'unexpected_key' ? `only in regex output`
      : `cheerio ${JSON.stringify(d.expected)} vs regex ${JSON.stringify(d.actual)}`;
    console.log(`    ${d.path}  [${d.kind}]  ${detail}`);
  }
}

let anyDrift = false;

for (const fx of FIXTURES) {
  process.stdout.write(`\n=== ${fx.name} ===\n`);
  const FakeDate = makeFakeDate(FIXED_NOW);
  const run = (fileName, inputItems, nodeOutputs) =>
    runNode(readCode(fileName), inputItems, { nodeOutputs, fakeDate: FakeDate });

  const formItem = {
    json: {
      page_url: fx.page_url,
      page_title: fx.page_title,
      content_language: 'en',
      eaa_scope: false,
    },
  };
  const n02 = run('02_normalize_input.js', [formItem], {})[0].json;
  const nodeOutputs = { 'Normalize Input': n02 };
  const html = fs.readFileSync(path.join(FIXTURES_DIR, fx.htmlFile), 'utf8');

  let cheerioOut, regexOut;
  try {
    cheerioOut = run('05_automated_checks.js', [{ json: { data: html } }], nodeOutputs)[0].json;
  } catch (e) {
    anyDrift = true;
    console.log(`  FAIL — cheerio engine threw: ${e.message}`);
    continue;
  }
  try {
    regexOut = run('05_automated_checks_regex.js', [{ json: { data: html } }], nodeOutputs)[0].json;
  } catch (e) {
    anyDrift = true;
    console.log(`  FAIL — regex engine threw: ${e.message}`);
    continue;
  }

  // checks_engine is SUPPOSED to differ ("cheerio" vs "regex") — not drift.
  const a = { ...cheerioOut }; delete a.checks_engine;
  const b = { ...regexOut }; delete b.checks_engine;

  const deviations = diff(a, b);
  if (deviations.length === 0) {
    console.log(`  IDENTICAL (excluding checks_engine)`);
  } else {
    anyDrift = true;
    console.log(`  DRIFT — ${deviations.length} difference(s):`);
    printDiffs(deviations);
  }
}

console.log('');
process.exit(anyDrift ? 1 : 0);
