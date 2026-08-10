# Paste-ready doc updates — end of Day 0 (31 July 2026)

Two blocks. **Block 1** → `decision_log.md`, insert **before** the `---` that
precedes "## Sources consulted", i.e. after D-15. Then bump the version header
to **2.2 · 31 July 2026**. **Block 2** → replaces sections in
`PROJECT_STATUS.md` as marked.

---

# BLOCK 1 — for `decision_log.md`

## D-16 — Front-load all Code-node JavaScript before Day 1 (Day 0)
**Context:** roughly 600–700 lines of Code-node logic sit across ten nodes. Writing them inside n8n during the build days means debugging JavaScript and learning n8n's item-array data model (`$input.all()`, `item.json`, returning arrays) at the same time, under a hard deadline.
**Alternatives:** write each node on the day it is needed (original plan); write only the two hardest nodes in advance; write all of them in advance.
**Rationale:** the schedule's fragile points are Days 3 and 4, where a single misunderstanding of the data model could cost half a day. Pre-writing converts those days from "write, misunderstand, debug, retry" into "paste, execute, compare against a documented expected output". Every file was additionally executed outside n8n against a simulated `$input`/`$()` environment, so syntax and logic errors were removed before the build began.
**Consequences:** Day 0 spent entirely on code and fixtures; 11 files plus a review record produced. Each file carries a header comment (node, input shape, output shape) and a pinnable test-input block, so any node can be executed standalone in n8n. The trade-off accepted: code written against the *specified* interfaces, so any deviation discovered in the live n8n environment must be reconciled on the day and logged.

## D-17 — Both check engines (cheerio and regex) written in advance
**Context:** `N8N_RUNNERS_ENABLED=true` may prevent Code nodes from reaching `cheerio`; the pre-committed rule (`PROJECT_STATUS.md`) allowed 30 minutes of configuration on Day 1 before switching permanently to a regex fallback.
**Alternatives:** write the cheerio version only and port under time pressure if it fails; write the regex version only (guaranteed to work, weaker parsing); write both.
**Rationale:** the fallback was already committed to; writing it on Day 1 would consume the very time the decision rule was designed to protect. Both engines were written and **verified to produce byte-identical output** on both demo fixtures and on deliberately malformed HTML.
**Consequences:** the cheerio decision now costs zero build time — paste one file or the other. The regex engine records `checks_engine: "regex"` in every audit, and the report prints its known approximations (nested lists flattened; `figcaption`-to-image association and `<input>`-wrapped-in-`<label>` not verified). A second environment dependency, `require('crypto')` in Node 8, was removed the same way: a self-contained SHA-256 fallback, verified byte-identical to Node's crypto including umlauts and non-Latin text.

## D-18 — Code review before Day 1: eight defects found in my own Day-0 code
**Context:** the Day-0 files passed the tests written alongside them. Those tests exercised the paths just written, which is not the same as attacking them. A separate review pass was run before any code entered n8n: spec re-read node by node, contract check along the whole chain, adversarial tests aimed at suspected weak points, and one full end-to-end execution of the real pipeline on the poor fixture.
**Findings:** eight defects; seven fixed and re-tested, one carried as a Day-2 build instruction. Three failed in the unsafe direction:
1. **`A4 Validate Output` returned "valid, 0 findings" when `content_text` was unreachable.** If the Build Prompt node is renamed — n8n node names are editable text — the context lookup fails, every evidence check fails, and every finding is dropped silently. The output was a clean-looking audit produced by a broken pipeline: the one failure direction this system must not have. → Empty context now returns `api_error` → fallback → **R2 → mandatory human audit**.
2. **R3 never fired when `confidence` was absent.** `NaN < 0.6` evaluates to `false` in JavaScript, so a finding with no confidence value skipped the low-trust rule — failing *not* to escalate. → Missing or non-numeric confidence now counts as 0.
3. **R9 did not upgrade findings tagged only by WCAG criterion.** The AI typically reports an undefined abbreviation as WCAG 3.1.4 without filling `instrument`/`instrument_item`, so the "forces the finding to critical" half of R9 found nothing to upgrade. Escalation still occurred; the report understated severity. → R9 now matches on instrument reference **or** WCAG 3.1.3/3.1.4.

Four quality defects: long pasted text classified "very short" (single-newline text collapses to one paragraph, wrongly turning PEMAT 8/9/11 into N/A) → single-newline fallback plus a word guard, `very_short = paragraphs ≤ 2 AND words ≤ 300`, operationalizing the second half of AHRQ's "two or fewer paragraphs **and no more than one page**"; `112` firing on blood-pressure readings such as `112/70` → emergency numbers moved to a context-gated tier, the same correction the v2.1 review applied to German `im` (D-13.1); the regex engine merging unclosed `<p>` tags, disagreeing with cheerio on paragraph counts; and the text branch injecting `not_assessed` items into the prompt as "already decided".

**Carried forward (D-H):** `attempt` is always 1, because `A4` reads it from the Build Prompt node. Routing is unaffected (it goes by `valid`/`api_error`), but the repair pass is not distinguishable in logs. To be set on the canvas on Day 2.
**Rationale for recording this in full:** the defects are more instructive than the code. Two of them are the same mistake in different clothes — a JavaScript comparison that silently yields "no problem" (`NaN < 0.6`) and a lookup that silently yields "nothing to check" (empty `content_text`). A system whose thesis is *fail safe* must be tested by trying to make it fail unsafely, not by confirming that it works.
**Consequences:** all fixes are marked `REVIEW FIX (31 Jul)` in the code with the reasoning inline. Full record in `code/_DAY0_REVIEW.md`, including the end-to-end run output. Regression suites re-run green after the fixes.

## D-19 — Operationalizations required to make the spec executable
Four points where `workflow_spec.md` used language that code cannot execute directly. Each was decided in favour of the conservative reading and is recorded so the choice is visible rather than buried:
1. **"Overlapping evidence"** (Node 11 dedupe) = after whitespace normalisation and lowercasing, one evidence string contains the other. Strict containment; near-matches do not merge. Over-merging would let AI text displace a deterministic finding — the wrong direction to err in.
2. **"AI reports it clean"** (Node 11 cross-check, feeds R6) = AI instrument verdict `pass` where the deterministic verdict is `fail`. The AI never declares a criterion clean explicitly, so this is the machine-checkable reading.
3. **"First section"** (CCI 3) = everything before the second heading. The CDC defines the item for print materials and does not define "first section" for web pages.
4. **CCI item 17 reverse scoring** is applied once, at the verdict level: the prompt instructs "must calculate = fail", so by the time verdicts reach the Decision Engine, `pass` means good for every item and the engine counts uniformly. Reversing again in the engine would be a double-reversal bug. Noted in the code so it is not "fixed" later.

Two smaller deviations from the written spec, both conservative:
- **Instrument-item evidence is substring-verified too** (the spec required this only for findings). An unverifiable quote is set to `null`, the verdict is kept, and the count is reported as `instrument_evidence_removed`.
- **The JSON output schema is appended to the system prompt** rather than sent separately: the prompt instructs the model to match "this schema exactly", so the schema must be visible in the same message.
- **`knowledge_base.md` §4 stem correction:** the listed stem `Überdosis` does not match "Überdosierung" (the word splits Überdos-ierung). Implemented as `Überdos`; the term is still reported as "überdosis". KB §4 to be updated to match.

---

# BLOCK 2 — for `PROJECT_STATUS.md`

**Replace the "Where things stand in one line" section with:**

## Where things stand in one line

Design and documentation are **complete and reviewed (v2.1)**. **Day 0 is complete: all Code-node JavaScript is written, executed outside n8n, reviewed, and paste-ready in `code/`, with demo fixtures in `fixtures/`.** Environment setup remains where it was: Docker files located and `.env` created; the compose file still needs one line added; containers not yet started. **Next action: Day 1 environment work.**

**Replace the whole "Day 0 (today, 31 July)" section with:**

## Day 0 — complete (31 July)

All eleven items delivered, plus a regex twin of the checks node and a review record. Every file carries a header comment (node, input shape, output shape) and a commented test-input block that can be pinned in n8n to execute the node standalone. Every file was executed outside n8n against a simulated `$input`/`$()` environment before handover.

| File | Node | Needed | Verified by |
|---|---|---|---|
| `code/A4_validate_output.js` | A4 Validate Output | Day 2 | valid input · fabricated quote · bad enum · API error · prose response · 25-finding cap · unreachable context |
| `code/A2_build_prompt.js` | A2 Build Prompt | Day 2 | system prompt diffed **character-for-character** against `workflow_spec.md` §2 · defaults · empty-content refusal |
| `code/09_safety_prescreen.js` | Node 9 | Day 3 | two-tier rule: "1 tablet BD" fires, "im Krankenhaus statt" does not · umlaut boundaries · context-gated emergency numbers |
| `code/05_automated_checks.js` | Node 5 (cheerio) | Day 3 | 9 checks + 8 instrument items + markdown extraction, on both fixtures |
| `code/05_automated_checks_regex.js` | Node 5 (fallback) | Day 3 | **byte-identical output to the cheerio engine** on both fixtures and on malformed HTML |
| `code/02_normalize_input.js` | Node 2 | Day 3 | label-style form keys · both-inputs case · `no_content` · `bad_url` |
| `code/06_prepare_text.js` | Node 6 | Day 3 | counts · all 8 items `not_assessed` · long single-newline text |
| `code/08_hash_guard.js` | Node 8 | Day 3 | SHA-256 fallback byte-identical to Node crypto incl. umlauts/CJK · <200 · >30 000 |
| `code/11_merge_findings.js` | Node 11 | Day 4 | precedence · R6 cross-check · evidence-overlap merge · duplicate keys · fallback shape |
| `code/12_decision_engine.js` | Node 12 | Day 4 | four scores · contamination guard · all rules R1–R9 · null subscores · **test block doubles as the Day-4 hand calculation** |
| `code/18_generate_report.js` | Node 18 | Day 5 | all sections · limitations assembled from actual flags · text-branch and fallback variants |
| `fixtures/` + `README.md` | demo pair | Day 5 | run through the real pipeline: poor = 8 findings, score 52; corrected = 0 findings, score 100 |

**Reviewed before Day 1.** Eight defects found in the Day-0 code; seven fixed and re-tested, one carried to Day 2 (`attempt` is always 1 — set it on the canvas). Three failed in the unsafe direction, including a validator that returned "valid, 0 findings" when its context was unreachable. Full record: `code/_DAY0_REVIEW.md`; decisions: `decision_log.md` D-16…D-19.

**Also available now:** `code/_e2e_report_poor.md` — a real audit report and statement draft, produced by running the actual pipeline end to end on the poor fixture. Useful for the presentation before n8n exists.

**Second environment dependency removed:** `require('crypto')` in Node 8 carries the same task-runner risk as cheerio; the node falls back to a self-contained SHA-256. Neither module can now cost build time.

**Append to the Update log:**

- **31 Jul 2026 (Day 0)** — all Code-node JavaScript and demo fixtures written, executed outside n8n, and reviewed: 8 defects found in my own code, 7 fixed, 1 carried to Day 2. Both check engines pre-written and verified identical, so the Day-1 cheerio decision costs no build time. Decisions D-16…D-19 added. Build not yet started; Day 1 is next.
