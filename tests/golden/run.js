#!/usr/bin/env node
'use strict';
/**
 * ============================================================================
 * tests/golden/run.js
 * ============================================================================
 * CLI entry point. Runs the chain (lib/chain.js) for all three fixtures and
 * either:
 *   - diffs the result against tests/golden/expected/<fixture>.trace.json
 *     and prints every deviation (default), or
 *   - regenerates expected/<fixture>.trace.json from the current run
 *     (--update — see README.md for the required hand-verification step
 *     before committing what this writes).
 *
 * Exit code 0 = all fixtures matched their expected trace. Exit code 1 =
 * at least one deviation, or a fixture threw while running.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { FIXTURES, runFixture } = require('./lib/chain');
const { diff } = require('./lib/diff');

const EXPECTED_DIR = path.join(__dirname, 'expected');
const UPDATE = process.argv.includes('--update');

function expectedPath(fixtureName) {
  return path.join(EXPECTED_DIR, `${fixtureName}.trace.json`);
}

function printDiffs(deviations) {
  for (const d of deviations) {
    const detail =
      d.kind === 'missing_key' ? `missing (expected present)`
      : d.kind === 'unexpected_key' ? `unexpected (not in expected)`
      : `expected ${JSON.stringify(d.expected)}, got ${JSON.stringify(d.actual)}`;
    console.log(`    ${d.path}  [${d.kind}]  ${detail}`);
  }
}

let anyFailed = false;

for (const fx of FIXTURES) {
  process.stdout.write(`\n=== ${fx.name} ===\n`);
  let trace;
  try {
    trace = runFixture(fx);
  } catch (e) {
    anyFailed = true;
    console.log(`  FAIL — chain threw: ${e.message}`);
    console.log(e.stack);
    continue;
  }

  // content_hash is checked first and separately — if it matches, the
  // fixture read, Node 02 and the entire cheerio extraction were
  // byte-identical, which narrows any further diff immediately to Node 05
  // onward. See lib/diff.js header and decision_log.md.
  const hash = trace.nodes['08_hash_guard'] && trace.nodes['08_hash_guard'].content_hash;
  console.log(`  content_hash: ${hash || '(missing)'}`);

  if (UPDATE) {
    fs.mkdirSync(EXPECTED_DIR, { recursive: true });
    fs.writeFileSync(expectedPath(fx.name), JSON.stringify(trace, null, 2) + '\n');
    console.log(`  WROTE ${path.relative(process.cwd(), expectedPath(fx.name))} — hand-verify before committing (see README.md).`);
    continue;
  }

  if (!fs.existsSync(expectedPath(fx.name))) {
    anyFailed = true;
    console.log(`  FAIL — no expected/${fx.name}.trace.json yet. Run with --update after hand-verifying the output.`);
    continue;
  }

  const expected = JSON.parse(fs.readFileSync(expectedPath(fx.name), 'utf8'));
  const deviations = diff(trace, expected);
  if (deviations.length === 0) {
    console.log(`  PASS (${Object.keys(trace.nodes).length} node outputs matched exactly)`);
  } else {
    anyFailed = true;
    console.log(`  FAIL — ${deviations.length} deviation(s):`);
    printDiffs(deviations);
  }
}

console.log('');
if (UPDATE) {
  console.log('Done. expected/*.json written — hand-verify against fixtures/README.md and responses/*.json before committing (see tests/golden/README.md).');
  process.exit(0);
}
process.exit(anyFailed ? 1 : 0);
