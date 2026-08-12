'use strict';
/**
 * ============================================================================
 * tests/golden/lib/shim.js
 * ============================================================================
 * Generalizes the pattern in code/_S4_evidence_check_harness.js (which does
 * this once, by hand, for Node A4 alone) to any node file in code/: read the
 * raw source text, execute it via `new Function`, feed it a minimal $input/$
 * shim, capture the [{json:...}] it returns.
 *
 * Every code/*.js file is written to be pasted into an n8n Code node body —
 * none of them have `module.exports`, none of them can be `require()`d as a
 * normal module. Executing the raw text via `new Function` is not a
 * workaround; it is how these files are designed to run outside n8n (see
 * _S4_evidence_check_harness.js and the "STANDALONE TEST INPUT" block at the
 * bottom of every file in code/).
 *
 * NOTE ON `require` — `new Function(...)` never closes over its enclosing
 * module's scope (only the true global scope), and `require` is a local
 * parameter of Node's CommonJS module wrapper, not a global — so a node file
 * that calls `require('cheerio')` (05) or `require('crypto')` (08) would see
 * a bare `ReferenceError: require is not defined` inside the constructed
 * function, misreported by those files' own try/catch as "not reachable"
 * (confirmed by deliberately reproducing it before landing on this fix — see
 * decision_log.md). `node -e` scripts are unaffected because `-e` puts
 * `require` on the global object as a REPL convenience; a normally required
 * module like this one does not get that treatment. Fix: pass this module's
 * own `require` through explicitly as a fourth `new Function` parameter.
 * ============================================================================
 */

/**
 * Builds the $('NodeName') shim. Throws loudly on any name not in the
 * registry — same discipline as _S4_evidence_check_harness.js — so an
 * accidental/renamed $('...') reference in a node file fails immediately
 * instead of silently resolving to undefined and masking a real defect
 * (this is exactly the class of bug D-18 found: a broken lookup that
 * degrades to a cheerful "nothing to check" instead of failing loudly).
 */
function makeDollarShim(nodeOutputs) {
  return function $(name) {
    if (!Object.prototype.hasOwnProperty.call(nodeOutputs, name)) {
      throw new Error('unreachable node: ' + name);
    }
    const json = nodeOutputs[name];
    return { first: () => ({ json }), all: () => [{ json }] };
  };
}

/**
 * Runs one code/*.js file's raw text as if it were an n8n Code node.
 *
 * @param {string} fileText   raw contents of a code/*.js file
 * @param {Array<{json:object}>} inputItems  the n8n item array this node receives
 * @param {object} [opts]
 * @param {object} [opts.nodeOutputs]  registry consulted by the $ shim
 * @param {Function} [opts.fakeDate]   class shadowing Date inside the node's scope
 * @returns {Array<{json:object}>}  the node's output, JSON round-tripped
 *
 * The JSON.parse(JSON.stringify(...)) round-trip is not cosmetic: n8n
 * actually serializes items between nodes in a real execution, so this
 * matches production semantics — e.g. it is why Node 11's own
 * `analysis: undefined` key correctly disappears before anything downstream
 * (including this harness's diff tool) ever sees it. Documented as a known,
 * deliberate limitation in README.md: the harness cannot distinguish "key
 * omitted" from "key present but undefined".
 */
function runNode(fileText, inputItems, opts = {}) {
  const { nodeOutputs = {}, fakeDate } = opts;
  const $input = { all: () => inputItems };
  const $ = makeDollarShim(nodeOutputs);
  const runner = new Function('$input', '$', 'Date', 'require', fileText + '\n');
  const out = runner($input, $, fakeDate || Date, require);
  if (!Array.isArray(out) || !out[0] || !('json' in out[0])) {
    throw new Error('node did not return the expected n8n item shape [{json:...}]');
  }
  return JSON.parse(JSON.stringify(out));
}

module.exports = { runNode, makeDollarShim };
