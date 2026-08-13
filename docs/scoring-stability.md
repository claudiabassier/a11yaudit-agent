# Scoring stability — R4 and the combined score

**13 August 2026.** Written per Tag 8 of the sprint plan, in the exact form requested: three options weighed against each other on impact, cost, runtime and drawbacks, with a way to measure success for each. No recommendation is made here — the decision is the author's, made after reading this.

## Where this stands already

The instability itself is not new information; it is measured and the architectural consequence has already been drawn. `screening_score_deterministic` — computed from automated markup findings only, using `original_severity` so an AI-triggered R9 upgrade cannot leak into it — is reproducible: byte-identical across runs on identical input, verified independently in D-30 and again in D-37. `screening_score`, which folds in AI-proposed findings, is explicitly documented and reported as advisory, not reproducible (`readme.md`, "Measured AI variability"; `decision_log.md` D-30, D-32). The conceptually hard part — recognising that one number cannot honestly serve both purposes, and splitting it — is done.

**What is still open, and narrow:** rule R4 (`screening_score !== null && screening_score < 70`, `code/12_decision_engine.js:158`, guard added 13 August for D-36) reads the **combined**, non-reproducible score, not the deterministic one. D-37 measured what that costs concretely: the same fixture, submitted three times with byte-identical content, produced `screening_score` **42 → 72 → 65**, and `triggered_rules` **`{R1,R4,R7,R9}` → `{R1,R7,R9}` → `{R1,R4,R7,R9}`**. R4 fired, then didn't, then did — on identical input. `screening_score_deterministic` stayed at 100 throughout; `R7` (the safety prescreen) fired all three times, independent of the AI entirely. The system's safety routing did not depend on R4's flicker in this case, but a rule that is supposed to detect "severe issue density" and instead detects "which of three runs you happened to get" is not measuring what its name says it measures.

**Also relevant, and already documented as its own open item (D-33), not solved here:** the verbal labels (`≥90` / `70–89` / `<70`) were calibrated when only the nine deterministic checks fed the score. AI-proposed comprehension findings are numerous by nature — the readme cites seven findings on a *well-written* page — so content pages tend to land under 70 regardless of quality. This note is scoped to R4's **input**, not the label bands; recalibrating the bands is a separate, corpus-dependent task (readme's future-work list) and applies to whichever score R4 ends up reading.

## The three options

### Option A — switch R4 to read the deterministic score

**Mechanism.** `R('R4', screening_score_deterministic !== null && screening_score_deterministic < 70)` — one line changed in `code/12_decision_engine.js`. `screening_score` (combined) stays exactly as-is, printed and labelled, purely advisory.

**Impact.** Removes the flicker entirely — `screening_score_deterministic` is reproducible by construction, so R4 becomes reproducible by construction too, not just usually stable. Directly closes what D-37 measured. Narrows what R4 can detect: it would no longer escalate purely on AI-proposed comprehension findings, only on markup-level ones (missing alt text, unlabelled fields, missing `lang`, etc.) — a page with severe *language* barriers but clean markup would not trigger R4 on that basis alone. This is a real behaviour change, not just a stability fix, and needs to be stated as such rather than presented as a pure bugfix.

**Cost.** One line of code, no new fields, no schema change. Lowest-cost option by a wide margin.

**Runtime.** None. No additional computation, no additional AI calls.

**Drawback.** Some genuine language-only barriers currently captured by R4 via the combined score would no longer trigger it through R4 specifically — though they may still trigger via other rules: R1 (any critical finding) already fires regardless of `screening_score`, and R9's upgrade-to-critical mechanism (safety content + undefined term) already routes the worst language-barrier case to R1. The narrowing is real but partially, not fully, absorbed elsewhere — a language-heavy page with no critical findings and clean markup could pass R4 clean where it currently sometimes wouldn't. Whether that gap matters depends on how often it occurs in practice, which is not currently measured (see "How to measure success," below).

**How to measure success.** Re-run the D-37 fixture (or any fixture) three times and confirm `triggered_rules` is now identical across all three runs whenever the only variation is the AI layer — this is a deterministic property, so a single set of repeat runs is sufficient proof, unlike the other two options. Separately, and only if the drawback above turns out to matter: audit a sample of real runs for cases where `screening_score_deterministic ≥ 70` but `screening_score < 70` *and* the page has a genuine language-only safety concern R1/R9 didn't catch — if that combination doesn't occur in practice, the drawback is theoretical, not real.

### Option B — run the AI multiple times and aggregate before the threshold check

**Mechanism.** Call SUB-A N times (e.g. N=3) per audit, aggregate the resulting `screening_score` values (e.g. median or mean) before R4 reads it, rather than trusting a single call's output.

**Impact.** Reduces variance without giving up the combined score's broader detection scope (unlike option A, R4 would still be sensitive to AI-proposed language findings, just averaged over multiple samples). Does not eliminate variance the way option A does — it's a statistical smoothing, not a structural guarantee, so a rare but real "unlucky majority" (2 of 3 runs landing on the same side of the threshold by chance) remains possible, just less likely than with N=1.

**Cost.** Real API cost, multiplied by N per audit — roughly 3× the Anthropic API spend for N=3, since the AI call is by far the dominant cost driver in this pipeline (see runtime, below). Also nontrivial engineering cost: SUB-A's contract, the repair-chain logic (D-55), and the report generator would all need to handle N parallel or sequential results instead of one, which is a larger change than either other option — this is not a one-line fix.

**Runtime.** Measured directly against a real successful execution (`WF1-dev`, execution 97, 12 August): the `Call SUB-A` node — which contains the entire AI round trip — took **75,173 ms**; every other node in the pipeline combined took under 200 ms. The AI call is, for practical purposes, the entire runtime of an audit. N=3 sequential calls would push a single audit from roughly 75 seconds to roughly 3–4 minutes; parallel calls would keep wall-clock time closer to the current ~75s but would not reduce the API cost multiplication, and would need SUB-A to be called N times concurrently from WF1, a wiring change of its own scale.

**Drawback.** The most expensive option on every axis measured (API cost, engineering cost, runtime or wiring complexity), for a partial (not structural) fix. Aggregating scores also raises a question this note does not answer: aggregating the *findings themselves* (union? intersection? majority-vote per finding?) is a harder problem than aggregating the *score*, and a naive score-only aggregation would produce a `screening_score` whose underlying `findings` list no longer corresponds cleanly to any single run — a report that shows an aggregated score next to one run's findings would itself be a new form of the inconsistency this note is trying to fix.

**How to measure success.** Run the same fixture N times under the aggregated design, repeat the whole N-run batch several times, and compare *batch-to-batch* variance of the aggregated score against the *run-to-run* variance already measured for a single call (D-37's 42/72/65 spread). Success is a materially smaller spread across batches than across single runs — this needs to be measured, not assumed, since aggregation of a noisy signal reduces variance by a knowable but not by an arbitrarily large amount, and the actual reduction depends on how correlated the underlying AI outputs are, not just how many samples are taken.

### Option C — only let AI-driven penalty count above defined confidence/agreement thresholds

**Mechanism.** In the WCAG-screening-score computation (`code/12_decision_engine.js:83-96`), each finding already carries a `confidence` value (0.0–1.0, from the AI's own output) and, for instrument items with a deterministic counterpart, the audit already computes `ai_disagreement` (Node 11: deterministic "fail" vs AI "pass" on the same item). Option C would exclude an AI-sourced finding's penalty from the score sum unless `confidence` is above a defined threshold (e.g. 0.7) — reusing a field the AI already returns on every call, no new call needed. A secondary, coarser signal — treating the whole audit's AI contribution more conservatively when `ai_disagreement` is already `true` — could optionally be layered on top, though this is an audit-level flag today, not a per-finding one, so it cannot gate individual findings the way `confidence` can.

**Impact.** Reduces the influence of the AI's least-certain findings on the number that feeds a hard rule, without removing the AI's contribution to the score entirely (unlike option A) and without any additional API calls (unlike option B). Directly attacks a plausible mechanism behind D-37's measured flicker: the AI's own stated uncertainty is itself unstable at temperature 0 (a finding reported at confidence 0.55 in one run and 0.75 in the next would cross a fixed threshold), so this option trades score-value instability for confidence-value instability — an improvement only if confidence estimates are themselves more stable than the findings they attach to, which is plausible but not yet measured on this system.

**Cost.** Small — a filter condition added where findings are summed for the score, plus picking and justifying a threshold value. No schema change (confidence is already stored per finding), no new fields required for the core mechanism.

**Runtime.** None — same single AI call as today, no additional computation of consequence.

**Drawback.** Introduces a new tunable (the confidence threshold) with no principled way to set it from first principles — it would need to be chosen either arbitrarily or by fitting it against the same kind of repeat-run measurement described in "How to measure success" below, which is itself extra work before the fix can be trusted. Also weakens the score's coverage in a different way than option A: a genuinely severe but AI-under-confident finding (the model correctly spots a real problem but hedges its own certainty) would be excluded from the score even though it is real — this is the mirror-image risk of option A's coverage gap, not a strictly better trade, just a different one. Existing rule R3 already treats missing/non-numeric confidence as `0` for a *different* purpose (forcing escalation, the opposite conservative direction) — this option would need its own, separately-reasoned threshold, not reuse R3's.

**How to measure success.** Re-run D-37's fixture (or a similarly AI-sensitive one) three times under a chosen threshold and compare the resulting `screening_score` spread to the unfiltered 42/72/65 baseline. Because this option does not make the score reproducible by construction (unlike option A), success has to be demonstrated empirically, the same way the instability itself was originally measured — and, since a single re-run of three is a small sample, a threshold that looks stable on one batch of three should be checked against at least one more independent batch before being trusted, for the same reason option B's aggregated score needs batch-to-batch comparison, not just one batch.

## Summary, for the decision — not a recommendation

| | Impact on the flicker | Cost | Runtime | Coverage trade-off |
|---|---|---|---|---|
| **A — R4 reads deterministic score** | Eliminates it structurally | Lowest (1 line) | None | Narrows what R4 can catch to markup-level findings |
| **B — multiple AI calls, aggregate** | Reduces it statistically, not structurally | Highest (≈3× API cost + real engineering) | ≈3–4 min per audit (sequential) or unchanged wall-clock with added wiring complexity (parallel) | Keeps combined-score coverage, but raises an unanswered findings-aggregation question |
| **C — confidence/agreement gate** | Reduces it, mechanism-dependent, unmeasured magnitude | Low (1 filter + a threshold to justify) | None | Trades "coverage gap on markup-only pages" for "coverage gap on under-confident AI findings" |

All three are compatible with the existing architecture; none requires reversing D-32's two-score split or D-36's `null`-when-unscreened fix (13 August, D-59) — R4's `!== null` guard stays regardless of which value it ends up comparing.
