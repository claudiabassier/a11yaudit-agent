'use strict';
/**
 * ============================================================================
 * tests/golden/lib/diff.js
 * ============================================================================
 * Pure recursive dotted-path deep-diff. No npm dependency — deliberately;
 * cheerio is the only external dependency this harness needs at all.
 *
 * Design notes (see decision_log.md for the full reasoning):
 *   - NaN vs NaN counts as equal, checked explicitly. By the time a value
 *     reaches this function it has already been through the runner's
 *     JSON.parse(JSON.stringify(...)) round-trip (shim.js), which turns any
 *     real NaN into JSON null before the diff ever runs — so this branch is
 *     a belt-and-braces safety net, not something expected to fire on these
 *     3 fixtures. Named explicitly because of D-18 defect #2 (`NaN < 0.6`
 *     silently evaluating false) — this is the class of bug a regression
 *     harness exists to catch, so NaN handling is not left implicit.
 *   - Arrays are compared INDEX-WISE, not as sets. The chain applies stable
 *     sorts at several points (severity rank in Nodes 11/12/18/A4). Since
 *     every input here is pinned (no live-AI variance to tolerate), a strict
 *     index-wise comparison is correct and is itself a regression check on
 *     sort stability — order-independence would hide exactly the bug a
 *     stable sort is meant to prevent.
 *   - `undefined` vs "missing key" are both reported as `missing_key` /
 *     `unexpected_key` rather than a `value_mismatch` — clearer in the
 *     printed report than "expected undefined, got undefined".
 * ============================================================================
 */

function classify(v) {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number' && Number.isNaN(v)) return 'nan';
  return typeof v;
}

function diff(actual, expected, path = '') {
  const a = classify(actual);
  const e = classify(expected);

  if (a !== e) {
    return [{ path: path || '(root)', kind: 'type_mismatch', actual, expected }];
  }
  if (a === 'nan') {
    return []; // NaN === NaN for this purpose (see header note)
  }
  if (a === 'array') {
    const out = [];
    const len = Math.max(actual.length, expected.length);
    for (let i = 0; i < len; i++) {
      out.push(...diff(actual[i], expected[i], `${path}[${i}]`));
    }
    return out;
  }
  if (a === 'object') {
    const out = [];
    const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
    for (const k of keys) {
      const aHas = Object.prototype.hasOwnProperty.call(actual, k);
      const eHas = Object.prototype.hasOwnProperty.call(expected, k);
      const childPath = path ? `${path}.${k}` : k;
      if (aHas !== eHas) {
        out.push({ path: childPath, kind: aHas ? 'unexpected_key' : 'missing_key', actual: aHas ? actual[k] : undefined, expected: eHas ? expected[k] : undefined });
        continue;
      }
      out.push(...diff(actual[k], expected[k], childPath));
    }
    return out;
  }
  if (a === 'number') {
    if (Math.abs(actual - expected) > 1e-9) {
      return [{ path: path || '(root)', kind: 'value_mismatch', actual, expected }];
    }
    return [];
  }
  if (actual !== expected) {
    return [{ path: path || '(root)', kind: 'value_mismatch', actual, expected }];
  }
  return [];
}

module.exports = { diff };
