'use strict';
/**
 * ============================================================================
 * tests/golden/lib/fakedate.js
 * ============================================================================
 * Only two call sites in the whole chain use `new Date()`:
 *   code/02_normalize_input.js  → started_at
 *   code/18_generate_report.js  → completed_at / the report's own date line
 * (confirmed by grepping the full code/ tree for `new Date|Date.now|Math.random`
 * — nothing else in the chain is time- or randomness-dependent).
 *
 * Every node is executed via `new Function('$input','$','Date', fileText)`
 * (see shim.js), so passing this class as the third argument shadows the
 * global `Date` inside that function's scope only — standard JS scoping,
 * no monkey-patching of the real global Date anywhere else.
 * ============================================================================
 */

function makeFakeDate(fixedIso) {
  const Real = Date;
  return class FakeDate extends Real {
    constructor(...args) {
      if (args.length) { super(...args); return; }
      super(fixedIso);
    }
    static now() { return new Real(fixedIso).getTime(); }
  };
}

module.exports = { makeFakeDate };
