# A11yAudit — Design Decision Log

**Version 3.5 · 10 August 2026**
Purpose: record *why* the system is built the way it is, including alternatives rejected and claims corrected. This document is the primary artefact for technical review and for the STL presentation — it evidences reasoning, not just output.

Format per entry: **Decision · Context · Alternatives considered · Rationale · Consequences.**

**Changelog:** v2.1 D-01…D-15 (design) · v2.2 D-16…D-19 (Day 0) · v2.3 D-20…D-23 (Days 1–2) · v2.4 D-24…D-33 (Days 3–5) · v2.5 D-12 gap recorded, D-34 (documentation review) · v2.6 D-35…D-39 (Day 6 tests and second review pass) · v2.7 D-40 (GitHub packaging) · v2.8 D-41 (Day 7: presentation format, and a headline claim corrected) · v2.9 D-42 (slide deck, reversing D-41) · v3.0 D-43 (an unsupported claim about BD/bedtime retracted and replaced) · v3.1 D-44 (packaging by web upload; the staging folder had gone stale) · v3.2 D-45 (a fourth false claim, and a check built to catch the next one) · v3.3 D-46 (pre-commit review, 10 August: D-20's cut list corrected — five of six items were built after all) · v3.4 D-47 (pre-commit review, 10 August: `v_review_queue` INNER JOIN could hide escalated audits with no qualifying finding row — fixed to LEFT JOIN) · v3.5 D-48 (post-commit setup review, 10 August: `docker-compose.yml` project name pinned after a repo folder rename would have silently changed container names).

**Completeness:** D-01 to D-48, no missing numbers, no duplicates. D-12 is an unused number, recorded as such below.

---

## D-01 — Postgres instead of Google Sheets
**Context:** the predecessor project (an earlier project [project name]) used Google Sheets as its data layer and I identified this as a weakness in its retrospective.
**Alternatives:** stay on Sheets (fastest); SQLite (no extra container); Postgres.
**Rationale:** Sheets cannot enforce value constraints, cannot express foreign-key relationships between audits and findings, and requires hand-written lookup logic for idempotent updates. Postgres gives `CHECK` constraints, referential integrity with cascade delete, `ON CONFLICT` upserts, and cross-audit querying. SQLite would have satisfied most of this, but Postgres is the realistic production choice and runs as a first-class n8n container.
**Consequences:** one more container; schema must be migrated by hand; the `v_audit_summary` view becomes possible, which is the concrete payoff (cross-page questions that were impossible in Sheets).

## D-02 — Deterministic checks in addition to AI
**Context:** the predecessor relied on manual/screenshot testing, the second identified weakness.
**Alternatives:** AI-only analysis; integrate axe-core via a headless browser; hand-written HTML checks.
**Rationale:** AI-only would make every result unverifiable. A headless browser (Playwright + axe-core) would give far better WCAG coverage including colour contrast and computed styles — this is the technically superior option and is recorded here as the **top candidate for future work**. It was rejected for this iteration purely on time risk: a third container, browser dependencies, and a new failure mode, against a hard 13 August deadline. Hand-written cheerio checks deliver nine reliable criteria in a few hours.
**Consequences:** contrast and all interaction criteria are out of scope and must be declared as such in every report (`knowledge_base.md` §1.3). Documented honestly rather than hidden.

## D-03 — Ground the language analysis in PEMAT-P and the CDC Clear Communication Index
**Context:** v1.0 asked the AI for "cognitive accessibility and plain language" issues in general terms.
**Alternatives:** generic prompt; readability formulas (Flesch-Kincaid/SMOG); validated health-literacy instruments.
**Rationale:** a generic prompt produces generic findings and is unfalsifiable — there is no standard against which to say the tool was right or wrong. Readability formulas count syllables and miss undefined jargon entirely. PEMAT-P and the CDC Index are validated, item-level, publicly available instruments designed for exactly this material type. Grounding the prompt in named items makes each finding traceable to a published criterion, makes disagreement possible, and constitutes independent research beyond the course material.
**Consequences:** longer prompt; instrument items must be stored per audit (`instrument_items` table); an adaptation disclaimer becomes mandatory (see D-07).

## D-04 — Item lists verified against primary sources
**Context:** an initial draft cited PEMAT items as "U2/U3/A19/A20". Those labels do not exist.
**Action:** fetched the AHRQ PEMAT-P page and the CDC Index score sheet directly and rebuilt `knowledge_base.md` from them. PEMAT-P has 24 scored items — understandability 1–12 and 15–19, actionability 20–26; items 13–14 exist only in the audiovisual version. The CDC Index has 20 items in four parts, with item 17 reverse-scored.
**Rationale:** citing an instrument incorrectly in front of a reviewer with health-domain knowledge destroys credibility faster than not citing one at all.
**Consequences:** every item reference in the system now traces to a fetched primary source, listed in `knowledge_base.md`.

## D-05 — Four separate scores, never one blended number
**Context:** it is tempting to output a single headline "accessibility score".
**Alternatives:** one weighted composite; separate scores.
**Rationale:** the WCAG conformance score is a penalty-based construct of my own design; PEMAT understandability/actionability and the CCI score are percentages defined by their instruments with their own scoring rules and interpretation thresholds (CDC: ≥90 good). Averaging measures on different scales with different provenance produces a number that cannot be defended or interpreted. Reviewers should see four numbers and what each means.
**Consequences:** the report is slightly less punchy and considerably more honest. Rule R8 uses the PEMAT understandability score directly as a threshold rather than via a composite.

## D-06 — Safety prescreen runs *before* the AI call
**Context:** rule R7 routes medical-safety content to human review.
**Alternatives:** derive safety context from the AI's findings; deterministic regex prescreen.
**Rationale:** if the safety signal came from the AI, an AI outage would silently disable the most important safety control. Running a regex prescreen at Node 9 means R7 fires even when SUB-A returns nothing at all.
**Consequences:** regex will over-trigger (a page merely mentioning "warning" routes to a human). Over-triggering in this direction is the acceptable failure mode; the false-positive cost is a human glance, the false-negative cost is a patient dosing error.

## D-07 — Label all instrument output as an unvalidated adaptation
**Context:** PEMAT and the CDC Index were designed for trained human raters scoring complete materials.
**Rationale:** applying them to web text via an LLM is an adaptation nobody has validated, including me. Presenting the output as a "PEMAT score" would misrepresent both the instrument and this tool. Labelling it "PEMAT-informed" with an explicit disclaimer in every report is the accurate description.
**Consequences:** the disclaimer appears in `knowledge_base.md`, every generated report, and the presentation. This is a strength in review, not a weakness — it demonstrates understanding of what validation means.

## D-08 — Evidence quotes verified as literal substrings
**Context:** the main failure mode of LLM analysis is confident fabrication.
**Alternatives:** trust the model; ask for line numbers; verify quotes programmatically.
**Rationale:** requiring a verbatim quote and then checking in code that the quote actually occurs in the source is a cheap, complete test for fabricated findings. A finding whose evidence cannot be located is dropped before reaching the database.
**Consequences:** the model occasionally normalises whitespace or quotation marks, so the check compares whitespace-normalised strings. Findings dropped this way are counted and reported.

## D-09 — Store per-item verdicts and human overrides
**Context:** the tool's own reliability is unknown.
**Rationale:** recording every instrument item with its verdict, who decided it (`deterministic` / `ai` / `human`), and whether a human overrode it turns routine use into data. Once enough audits are reviewed, `dismissed ÷ total` per criterion in `v_audit_summary` yields an empirical false-positive rate — the beginning of a validation story and the natural next project.
**Consequences:** extra table and two extra Postgres nodes. Worth it: it converts "I don't know how accurate this is" into "here is how I would find out."

## D-10 — Health-specific knowledge base, domain-neutral architecture
**Context:** asked why the tool is restricted to health content.
**Rationale:** the instruments, the jargon sensitivity, and the safety-keyword list are health-specific; the markup checks, workflow structure, decision engine, and data model are not. The stakes argument (readers of health content are frequently in pain, frightened, or medicated, i.e. at reduced cognitive capacity precisely when comprehension matters most) justifies the health focus on its merits rather than by convenience.
**Consequences:** re-targeting to another domain is a knowledge-base swap, not a rebuild. This is stated in the docs so the scope reads as a deliberate choice rather than a limitation.

## D-11 — Claims corrected during design
Recorded because a reviewer will probe these, and because being able to name what I got wrong is part of the argument that the rest is sound.

| Initial claim | Corrected to |
|---|---|
| "The tool covers WCAG." | It covers a listed subset; roughly a quarter to a third of WCAG success criteria are machine-testable at all, and this tool addresses nine deterministically plus six by AI judgment. |
| "Nobody automates cognitive accessibility / health literacy." | Accessibility tools do offer readability formulas; health-literacy instruments exist but are manual rubrics. The genuine gap is the *bridge* between the two, not the absence of either. |
| "It makes health literacy accessible for everyone." | Health literacy is a property of people and cannot be changed by a workflow. The tool measures *literacy demand* of the material — the organisational-health-literacy framing. It also only serves readers of the language the page is written in. |
| "It produces accessible health information." | It produces a report. A human confirms it and a content owner rewrites the page; both steps are outside this system. |
| "Conformance score" with labels "supports / partially supports / does not support" (v2.0) | Renamed to **screening score** with non-conformance labels (v2.1). The tool screens a listed subset of WCAG criteria; ACR/VPAT conformance language over 87 criteria after screening nine would be an overclaim with legal weight under BFSG. The statement draft now lists evaluated and non-evaluated criteria explicitly. |

## D-12 — *(number not used)*
No entry was ever written under this number. The gap is a numbering slip made while drafting D-11 and D-13 on 31 July, not a removed or retracted decision. Recorded explicitly so that the sequence D-01…D-34 can be read as complete.

## D-13 — Changes from pre-build design review (v2.1, 31 July 2026)
A full design review before the build surfaced seven defects; all fixed on paper before any node was built.
1. **Safety regex would have broken German audits** — standalone `im`/`od`/`ac` matching fires on ordinary German words, routing every German page to review. → Two-tier matching: long terms standalone, short dosing abbreviations only near a number/unit/dose-form word (`knowledge_base.md` §4).
2. **Flat-text extraction destroyed the structure the AI must judge** (headings, chunking, sequence, main-message position). → Extraction now produces lightweight markdown.
3. **Conformance overclaim** → screening rename (see D-11 last row).
4. **Loop-based retry in SUB-A replaced by a linear repair chain.** One duplicated AI node, traded deliberately for canvas legibility and testability — n8n loop-backs with modified state are fragile.
5. **Instrument completeness check added** — missing items become `not_assessed` instead of silently biasing subscore denominators.
6. **Partial-write claim corrected** — n8n has no transaction across Postgres nodes; an audit row can exist without findings if the DB fails mid-write. True behaviour: detectable via `status = 'in_progress'`. Test E12 expectation amended.
7. **Score contamination rule** — only findings with a WCAG criterion count toward the screening score; cognitive findings are measured by the instrument subscores alone (no double counting).

## D-14 — Rescope to a 7-day build window
**Context:** review deadline moved; 7 build days remain (submit 7 August to receive review before platform access ends 13 August).
**Decision:** tiered scope with a pre-committed cut order (see `build_runbook.md` §0). Tier 1 (core thesis, non-negotiable): WF1 core path, SUB-A with fallback, rules R1/R2/R4/R7, `audits`+`findings` tables, report, demo audit. Tier 2 (adds depth, cut first if behind): deterministic instrument observations, CCI Part A scoring, `instrument_items` table, R8/R9, before/after demo. Tier 3 (cut without hesitation): CCI Parts B–D, R3/R5/R6 refinements beyond basics, `v_audit_summary` polish, statement-draft niceties.
**Rationale:** deciding the cut order now, while calm, prevents the classic failure of cutting quality (tests, docs) instead of scope under deadline pressure. Every tier boundary keeps the core thesis demonstrable: AI proposes, deterministic rules dispose, fails safe.

## D-15 — Open questions / known limitations
1. **No validation.** Accuracy against expert human auditors is unmeasured. Sample size for the capstone is 2–3 pages.
2. **No JavaScript rendering.** Client-rendered health portals will return near-empty content. Detected via `word_count` guard, not solved.
3. **LLM non-determinism.** Temperature 0 reduces but does not eliminate run-to-run variance; identical content can produce slightly different instrument verdicts. Not yet quantified — a repeat-run comparison is a cheap next experiment.
4. **Regex over-triggering** on safety terms (accepted, see D-06).
5. **German-language coverage** of the safety term list is smaller than the English list.
6. **Single rater design.** PEMAT is normally applied by two independent raters with agreement measured; this system has one AI rater and no inter-rater reliability measure.

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
**Rationale for recording this in full:** the defects are more instructive than the code. Two of them are the same mistake wearing different clothes — a JavaScript comparison that silently yields "no problem" (`NaN < 0.6`) and a lookup that silently yields "nothing to check" (empty `content_text`). A system whose thesis is *fail safe* must be tested by trying to make it fail unsafely, not by confirming that it works.
**Consequences:** all fixes are marked `REVIEW FIX (31 Jul)` in the code with the reasoning inline. Full record in `code/_DAY0_REVIEW.md`, including the end-to-end run output. Regression suites re-run green after the fixes.

## D-19 — Operationalizations required to make the spec executable
Four points where `workflow_spec.md` used language that code cannot execute directly. Each was decided in favour of the conservative reading and is recorded so the choice is visible rather than buried:
1. **"Overlapping evidence"** (Node 11 dedupe) = after whitespace normalisation and lowercasing, one evidence string contains the other. Strict containment; near-matches do not merge. Over-merging would let AI text displace a deterministic finding — the wrong direction to err in.
2. **"AI reports it clean"** (Node 11 cross-check, feeds R6) = AI instrument verdict `pass` where the deterministic verdict is `fail`. The AI never declares a criterion clean explicitly, so this is the machine-checkable reading.
3. **"First section"** (CCI 3) = everything before the second heading. The CDC defines the item for print materials and does not define "first section" for web pages.
4. **CCI item 17 reverse scoring** is applied once, at the verdict level: the prompt instructs "must calculate = fail", so by the time verdicts reach the Decision Engine, `pass` means good for every item and the engine counts uniformly. Reversing again in the engine would be a double-reversal bug. Noted in the code so it is not "fixed" later.

Two smaller deviations from the written spec, both conservative, plus one source correction:
- **Instrument-item evidence is substring-verified too** (the spec required this only for findings). An unverifiable quote is set to `null`, the verdict is kept, and the count is reported as `instrument_evidence_removed`.
- **The JSON output schema is appended to the system prompt** rather than sent separately: the prompt instructs the model to match "this schema exactly", so the schema must be visible in the same message.
- **`knowledge_base.md` §4 stem correction:** the listed stem `Überdosis` does not match "Überdosierung" (the word splits Überdos-ierung). Implemented as `Überdos`; the term is still reported as "überdosis". KB §4 updated to match.

## D-20 — Schedule slip on 3 August: all Tier 2 scope cut
**Context:** the runbook (§7) placed Day 3 on 3 August. Actual position on the evening of 3 August: Days 0 and 1 complete, Day 2 half complete (WF-Error built, SUB-A not started). Six runbook days of work remain against roughly four and a half calendar days, submission Friday 7 August.
**Alternatives:** (a) compress every remaining day proportionally; (b) move the submission date; (c) invoke the pre-committed cut order in `build_runbook.md` §0 and drop Tier 2 in full.
**Decision:** (c). Day 7 is not compressible — docs sync, readme, presentation and packaging are the graded deliverables, and the three evaluation criteria are met by documentation and explanation, not by feature count. Moving the submission was rejected: platform access ends 13 August and a later submission risks losing the STL review entirely.
**Cut, in the pre-committed order:** rules R3/R5/R6 · before/after demo pair · rules R8/R9 · `instrument_items` table and Node 15 · CCI Part A scoring · deterministic instrument observations (Node 5b). All remain in `workflow_spec.md` marked "designed, not built in v1 — see D-14/D-20".
**Rationale:** the cut order was fixed on 31 July precisely so that this decision would not have to be made under pressure. Tier 1 alone carries the whole thesis: AI proposes, deterministic rules dispose, and the system fails safe when the AI fails. Nothing cut touches the safety path.
**Consequences:** the demo is a single audit rather than a before/after pair. `instrument_items` stays in the schema (already applied) but is not written to in v1 — the table exists and is documented as designed-not-populated. The honesty requirement tightens accordingly: the report and presentation must not describe CCI Part A scoring or R3/R5/R6/R8/R9 as implemented.

## D-21 — n8n does not trigger error workflows for manual executions
**Context:** WF-Error was built and executed successfully on Day 2 (Error Trigger → Strip Payload → Insert error_log, one row confirmed). Verified against the n8n documentation before planning further tests: **error workflows fire only for production executions** — a manually executed workflow that fails reports the error in the editor and never calls the error workflow.
**Impact:** this is a testing constraint, not a design fault, but it changes how several planned tests must be run. Edge cases E1 (no content), E11 (AI unreachable) and E12 (Postgres down) expect `error_log` rows; executed manually they would produce editor errors and an empty `error_log`, which could easily be misread as WF-Error being broken.
**Decision:** distinguish two claims and evidence them separately. (1) *The WF-Error chain works* — proven by executing WF-Error's own Error Trigger, which writes a real row using n8n's sample error payload. Done, 3 August. (2) *A failing workflow actually reaches WF-Error* — requires a production execution, so it is proven once WF1 exists and can be activated and run through its Form Trigger production URL (Day 4–5).
**Consequences:** the runbook's §5 edge-case rows that expect `error_log` entries must be executed in production mode, via the Form Trigger production URL, not by clicking Execute. Recorded here so the distinction is stated rather than discovered on Day 6 — and so no claim is made that error logging was demonstrated end to end before it actually was.

## D-22 — Model choice forced by a tooling constraint: extended thinking cannot be disabled in n8n's Anthropic node
**Context:** SUB-A node A3 was built on 3 August with n8n's Anthropic node (`Message a Model`). The spec requires `temperature = 0` so that repeat runs on identical content are comparable. The first model selected, `claude-sonnet-5`, returned HTTP 400 "Bad request" on every call.
**Diagnosis:** the model ran with extended thinking active — the response contained a `"type": "thinking"` block. The Anthropic API permits only `temperature = 1` when extended thinking is enabled, so `temperature = 0` was rejected. Removing the temperature parameter made the call succeed, but revealed a second problem: thinking tokens are drawn from the same `max_tokens` budget, and the JSON response was **truncated mid-object** at 6000 tokens. A4 would have correctly rejected it as invalid, so the visible symptom would have been a permanent, unexplained repair-then-fallback loop.
**Alternatives:** (a) keep `claude-sonnet-5`, drop `temperature = 0`, raise `max_tokens` to ~16000; (b) switch to a model that does not think by default, restoring `temperature = 0`; (c) replace the node with an HTTP Request node calling the Anthropic API directly, giving full parameter control (~30 minutes).
**Decision:** (b) — switched to `claude-sonnet-4-6`, re-added `temperature = 0`, kept `max_tokens = 6000`. Verified: complete, schema-valid JSON, no thinking block, `valid: true`, `dropped_unverified: 0`, `missing_items_count: 0`, all 30 instrument items returned.
**Rationale:** (a) was rejected because determinism is not a nice-to-have here — it is the basis of the only reproducibility the system can claim, and temperature 1 with a hidden reasoning process makes run-to-run variance both larger and unobservable. (c) was rejected on schedule grounds given D-20; it remains the fallback if the node proves limiting later. Option (b) also costs less per run, which matters across the remaining build days.
**Consequences:** the node's option list has no thinking toggle, so this constraint is a property of the tool, not of the model — documented here so the choice is not mistaken for a quality judgement about Sonnet 5. The n8n Anthropic node exposes temperature as **"Output Randomness (Temperature)"**; also confirmed that **Web Search must stay disabled**, since the prompt requires the model to judge strictly from the supplied material and web access would both violate that instruction and destroy reproducibility.

## D-23 — Day 2 build notes: carried defect closed, and a router that failed loudly
**Carried defect D-H closed.** D-18 left one item for Day 2: `attempt` was always reported as 1, because A4 reads it from the Build Prompt node, which is only executed once. Resolved on the canvas rather than in code: an **Edit Fields node `Mark Attempt 2`** sits between `AI Analysis (repair)` and `Validate Output 2` and sets `attempt = 2` on the item, with "Include Other Input Fields" enabled so the model response survives. A4 already prefers the input item's `attempt` over the Build Prompt value (`j.attempt || ctx.attempt || 1`), so no code change was needed. Routing was never affected; this only makes the repair pass distinguishable in logs.

**n8n IF nodes apply strict type validation — and this is worth keeping.** During the S3 fallback test the run halted at `API Error?` with: *Wrong type: 'true,' is a string but was expecting a boolean*. A stray comma after the closing `}}` in the condition expression turned a boolean into a string. The significant part is the failure mode: the deterministic router **stopped and named the problem** instead of silently evaluating the condition as falsy and sending an API failure down the repair branch. A silent misroute here would have been exactly the class of defect D-18 was written about — a broken pipeline producing output that looks fine. Recorded as evidence that strict typing on the routing nodes is a feature, not friction; all three IF nodes (`Valid?`, `API Error?`, `Valid 2?`) were checked for the same fault.

**Tests executed (SUB-A, 3 August):**
- **S1 happy path** — pinned two-sentence anticoagulant text: `valid: true`, `dropped_unverified: 0`, `instrument_evidence_removed: 0`, `missing_items_count: 0`; all 14 PEMAT and 16 CCI items returned, 10 findings, every evidence quote substring-verified against the source. Full-workflow run routed trigger → Build Prompt → AI Analysis → Validate Output → `Valid?` true → `Return`.
- **S3 API failure** — induced by setting `Maximum Number of Tokens` to an out-of-range value (99999999), producing HTTP 400. **Note on method:** the spec's S3 specifies an invalid API credential; an invalid parameter was used instead because it is reversible in one click and produces the identical downstream condition (node errors → `Continue` passes an error item → A4 sets `api_error: true`). Auth-specific failure is therefore *not* separately demonstrated. Result: routed `Valid?` false → `API Error?` true → `Fallback` → `Return`, returning `analysis_status: "fallback"`, `fallback_reason: "api_error"`, empty `findings` and `instrument_items`.
- **Not yet executed:** S2 (malformed AI output → repair → fallback), S4 (fabricated evidence), S5 (very short material). The repair branch is therefore built and wired but **not yet exercised** — no claim may be made that the repair pass has been demonstrated until S2 runs.

## D-24 — Node 4 `Fetch Page`: stop on error instead of `Continue On Fail`
**Context:** `workflow_spec.md` §1 Node 4 specifies `Continue On Fail = true`, with a non-200 or timeout producing `fetch_error` and the audit aborting via `Stop and Error`. Building the node on 4 August exposed that the spec assumes an intermediate node that inspects the failed HTTP response and raises that named error. No such node exists in the 19-node list.
**Alternatives:** (a) follow the spec — `Continue On Fail = true`, no inspecting node: the error item flows into Node 5, which throws `Automated Checks: no HTML string found on the input item`; (b) add a dedicated fetch-error check node between 4 and 5; (c) leave `On Error = Stop Workflow` (n8n default) so the HTTP node itself raises the real cause.
**Decision:** (c). `On Error = Stop Workflow`, all Settings toggles off.
**Rationale:** (a) aborts correctly but reports the wrong cause — a 404 would be logged as missing HTML, which is precisely the class of misleading-diagnostic defect D-18 and D-23 were written about. (b) is the spec-faithful fix but costs canvas time on a compressed schedule (D-20) for no behavioural gain over (c). (c) produces the identical outcome — audit aborts, WF-Error writes an `error_log` row — while preserving the actual HTTP status in the message.
**Consequences:** `error_log.error_code` for fetch failures will carry n8n's HTTP error text rather than the literal token `fetch_error`; `workflow_spec.md` §1 Node 4 is now out of date and is corrected at the Day-7 docs sync. Edge cases E4 and E5 (unreachable host, 404) are outside the reduced Day-6 edge set, so **this path is designed and wired but not demonstrated** — no claim may be made that fetch-failure handling has been tested.

## D-25 — Defect found by the Day-3 fixture run: wrong evidence quoted for the missing-`lang` finding
**Context:** the first fixture run of `05_automated_checks.js` inside n8n (4 Aug) reproduced all eight expected markup findings, but the evidence string on `auto-3.1.1-html-lang` was the fixture's leading HTML comment block, not the `<html>` tag. Cause: the evidence was taken as `html.slice(0, html.indexOf('>') + 1)`, and the first `>` in the document falls inside `<!-- … -->`.
**Alternatives:** (a) leave it and note it as cosmetic — routing, scoring and the finding itself were all correct; (b) fix the extraction.
**Decision:** (b). Comments are stripped, then the opening tag is matched with `/<html[^>]*>/i`, falling back to the literal `<html>` when no tag exists (fragment input).
**Rationale:** the string is printed in the report beside the finding, and evidence that does not show the thing being complained about undermines the one claim the deterministic checks can make — that every finding is verifiable against the source. Verified against three inputs after the change: the fixture yields `<html>`, a page with attributes yields the full opening tag, a fragment falls back cleanly.
**Consequences:** `code/05_automated_checks.js` changed and re-pasted into WF1 Node 5; the fixture re-run must reproduce all eight findings unchanged. **`code/05_automated_checks_regex.js` still contains the original defect** — it is the unused fallback engine (cheerio passed on Day 1), so it was deliberately not touched; if it is ever brought into use, this fix must be ported. Found only because the fixture provides verified expected values — the NHS run, which produced zero findings, could not have surfaced it.

## D-26 — DB writes as parameterised queries with a JSON payload, not n8n's column-mapping UI
**Context:** spec Nodes 13 and 14 say "Postgres upsert". n8n offers this as "Insert or update rows in a table" with a field-by-field mapping UI. `audits` has 29 written columns, two of them `text[]` (`triggered_rules`, `safety_terms_found`), and `findings` is an array inside a single item rather than one item per row.
**Alternatives:** (a) the mapping UI, mapping 29 fields by hand and hoping n8n coerces JS arrays to Postgres arrays; (b) a Code node that splits findings into one item per row, then the mapping UI; (c) build SQL strings in a Code node; (d) `Execute Query` with one JSON parameter per node, unpacked in Postgres by `json_populate_record` / `json_populate_recordset`.
**Decision:** (d). Two new Code nodes were added that are not in the v2.1 spec — `Build Audit Payload` (13a) and `Build Findings Payload` (14a) — each emitting one JSON string, consumed by `13_upsert_audit.sql` and `14_insert_findings.sql`.
**Rationale:** (a) risks silent type failures on the two array columns and is 29 hand-mapped fields of transcription error. (c) would require hand-escaping audit content that contains quotes and angle brackets — an injection and quoting hazard for no gain. (d) moves the type coercion into Postgres, which already knows the column types, and makes both writes reviewable as SQL files in the repo rather than as UI state invisible outside n8n. `JSON.stringify` handles all escaping.
**Consequences:** WF1 carries two nodes more than the spec's node numbering implies (16 nodes built as of 4 Aug, covering spec nodes 1–14 plus 13a and 14a); `workflow_spec.md` §1 is corrected at the Day-7 docs sync. Two deliberate properties of the SQL, both verified on 4 Aug: the audit upsert matches on `content_hash` and increments `run_count` (three runs of the same fixture produced one row, `run_count: 3`); the findings upsert refreshes analysis fields but does **not** touch `status`, `reviewer_note` or `reviewed_at`, so re-auditing a page cannot erase a reviewer's decisions. `ai_model` is written from configuration (D-22), not observed from the response — SUB-A does not return the model name, so that column records what was configured, not what answered.

## D-27 — `max_tokens = 6000` truncated the analysis; the failure was caught, not passed on
**Context:** the first full WF1 run returned `analysis_status: "fallback"`, `fallback_reason: "validation_failed"`. Inspecting SUB-A's `AI Analysis` output showed the response cut off mid-string inside instrument item 11 of 30. A4 had rejected it with "Response is not parseable as a JSON object"; the repair pass hit the same ceiling and fell through to fallback.
**Context on why Day 2 did not catch this:** S1 was run on a two-sentence pinned text. The fixture produces ~23 findings and 30 instrument items, each with a rationale and an evidence quote — roughly double the 6000-token budget. The failure was a function of realistic input size, which only the first end-to-end run supplied.
**Alternatives:** (a) raise `max_tokens`; (b) shorten the required output (fewer instrument items or no per-item rationale); (c) split the analysis into two calls.
**Decision:** (a) — `Maximum Number of Tokens` raised from 6000 to 16000 on both the main and the repair AI node. (b) was rejected because the instrument item set is the deliverable, not padding; (c) doubles cost and adds a failure mode for no benefit at this scale.
**Consequences:** runs are slower and cost more per audit. Two by-products worth recording: **S2 (malformed AI output → repair → fallback) was demonstrated by accident** and behaved exactly as specified — invalid output was never passed downstream, R2 fired, and the audit came back `needs_review` with the deterministic scores intact. And the fallback run is retained as evidence for the central design claim: with the AI contributing nothing, the system still produced a conservative, correct, hand-verifiable outcome.

**Related defect, same run:** the model emitted the *string* `"null"` rather than JSON `null` for `instrument` on three findings, which would have violated `findings_instrument_check` / `chk_instrument_pair` on insert. `14a_build_findings_payload.js` now normalises `""`/`"null"`/`"NULL"` to real null for `instrument`, `wcag_criterion` and `wcag_level`. This is a schema-boundary guard, not AI trust: the constraint would have caught it either way, but as an opaque Postgres error rather than a named one.

## D-28 — Day 3/4 results: what was demonstrated, and three limitations the results expose
**Both gates met on 4 August.** Day 3 gate: extraction and prescreen correct on a known page. Day 4 gate: all four scores reproduced by hand calculation, and re-runs write no duplicates.

**Test evidence.**
- **Negative control (NHS ibuprofen page, live URL):** clean extraction, `safety_context: true` with 8 terms, and **zero** automated findings. On its own this is ambiguous — it cannot distinguish a clean page from a broken check engine. Recorded as evidence of no false positives only. Note `PEMAT_17`/`PEMAT_19` returned `not_applicable`: the fetched HTML contained no `<img>` and no `<table>`, so four of the nine checks had nothing to inspect.
- **Positive control (`bp-meds-poor.html`):** all eight expected markup findings fired, all eight deterministic instrument verdicts matched, safety terms matched exactly (including `bd` via the Tier B proximity rule), 301 words / 5 paragraphs — identical to the values verified outside n8n on 31 July. The pairing is what makes the check engine credible; neither run alone would.
- **Full AI path:** 23 findings, `screening_score` 0, PEMAT understandability 28.6, actionability 0, CCI 15.8, `triggered_rules {R1,R4,R7,R8,R9}`, `legally_relevant: true`. Every figure recomputed by hand from the findings list and matched. R3, R5, R6 correctly did **not** fire, which is as much a result as the five that did.
- **Text branch (4 Aug, same day):** the fixture's visible text submitted via `pasted_content` with `page_url` empty routed correctly down `Prepare Text`; `Fetch Page` and `Automated Checks` did not execute. 16 findings written — AI only, with the eight markup findings correctly absent and the deterministic instrument items `not_assessed`. Both intake branches are therefore demonstrated, not just designed.
- **`dropped_unverified: 4`** — four AI-proposed findings were discarded because their evidence quotes could not be located verbatim in the source. The anti-hallucination control is doing measurable work on real output.

**Limitations exposed by these results — all belong in the readme and the presentation.**
1. **The screening score saturates.** Total penalty was 179 against a 100-point scale, so the score floors at 0. It is correct but cannot discriminate between "severe" and "far worse". A density-based or capped-per-criterion measure would be the fix; not attempted in v1.
2. **R9 over-escalates by design.** It upgraded two findings to critical, including "'excipients' undefined" (low → critical). Every finding attached to PEMAT 4 or CCI 7 is upgraded when safety context is present, without regard to the individual term's risk. This errs toward more human review, never less, which is the intended direction — but it should be stated rather than discovered by a reviewer.
3. **Accuracy remains unmeasured.** The AI findings were not compared against an expert-audited ground truth. Evidence quotes are verified verbatim; the *judgements* are not validated. Nothing in these runs supports a claim about precision or recall.

## D-29 — Project-wide review, 4 August: `not_assessed_count` understated coverage limits
**Context:** a full pass over code, schema, exports and documents after the Day 3/4 build. Everything else checked out (see below); one defect was found, in the number the report uses to declare its own limits.
**The defect:** `not_assessed_count` counted only instrument items the AI returned with an explicit `not_assessed` verdict. But PEMAT 15, 16, 18, 23, 26 and CCI 4 are **"Not assessed" by design** (`knowledge_base.md` §2.1/§2.2/§3) — they require judging visual aids this text-and-markup pipeline cannot see, so they are never requested, never returned, and were therefore never counted. The 4 August run reported `not_assessed_count: 0`; the true figure is **6**. `18_generate_report.js` prints that number verbatim: *"0 instrument item(s) were not assessed and are excluded from all score denominators."*
**Why it matters more than its size suggests:** the subscores were always correct — those items were already outside every denominator. What was wrong was the report's statement *about its own completeness*. A reviewer would have been told the assessment covered everything while six items were never examined. This is the exact failure mode the project's honesty commitments exist to prevent, and it was in the sentence meant to enforce them.
**Alternatives:** (a) hard-code 6; (b) count against the designed item universe.
**Decision:** (b). `12_decision_engine.js` now derives the count from the full scored universe (PEMAT 1–12, 15–26; CCI 1–20) minus every item that came back with a real verdict (`pass`/`fail`/`not_applicable`). This catches all three causes at once: never requested by design, requested but absent from the response, and explicitly `not_assessed`. A `not_assessed_items` array is emitted alongside so the report can name them. Verified against the 4 August data: **6 — PEMAT 15, 16, 18, 23, 26 and CCI 4.**
**Consequences:** no score changes; only the reported count and the audits column. Existing rows carry `not_assessed_count: 0` until re-run — the Day-5 demo audit refreshes them via the upsert. `readme.md` also claimed the pipeline writes an `instrument_items` table; it does not (Tier 2, cut in D-20), and the line was corrected to `audits · findings`.

**Also verified in the same pass, no action needed:** all 16 Code files parse; WF1 and SUB-A both point at `WF-Error` and `WF-Error` does not point at itself; the four exported workflow JSONs contain credential ids and names only, no secrets; `13_upsert_audit.sql` / `14_insert_findings.sql` write only columns that exist in `postgres_schema.sql` plus the addendum; file naming is consistent.

**Known and accepted, carried forward:** `05_automated_checks_regex.js` still contains the evidence defect fixed in D-25 — it is the unused fallback engine and must be patched if ever brought into use. CCI Parts B–D are being scored although `build_runbook.md` §0 lists them as Tier 3 "cut freely"; more was built than planned, which is not a defect but leaves the runbook's tier list stale for the Day-7 sync. `status` never reaches `completed` until Node 19 exists (Day 5).

## D-30 — Two identical runs are not identical: measured AI variance at temperature 0
**Context:** the same fixture was audited twice on 4 August, 11:01 and 11:50, with identical input, identical prompt and `temperature = 0`. The runs were compared field by field.

| | Run A (11:01) | Run B (11:50) |
|---|---|---|
| findings | 23 | 22 |
| AI finding keys | `ai-crit-*` scheme | `ai-001-*` scheme — a different set |
| CCI-informed score | 15.8 | 16.7 |
| CCI item 12 | fail | pass |
| CCI item 17 | pass | not_applicable |
| `dropped_unverified` | 4 | 3 |
| screening score | 0 | 0 (both at the floor) |
| PEMAT understandability / actionability | 28.6 / 0 | 28.6 / 0 |
| automated findings, deterministic verdicts, safety terms, `content_hash` | — | **byte-identical** |

**What this corrects:** D-22 justified `claude-sonnet-4-6` partly on the grounds that `temperature = 0` makes the analysis reproducible. That was too strong. Temperature 0 is not a determinism guarantee; it reduces but does not eliminate run-to-run variation, and this project now has its own measurement of the residual. **No claim of reproducible AI analysis may be made.** What *is* reproducible, and was verified byte-identical across runs, is the deterministic layer: the nine automated checks, the eight deterministic instrument verdicts, the safety prescreen, the content hash, and every rule that depends only on them.
**Why it matters that the headline number did not move:** both runs scored 0 — but only because the score was already at its floor (D-28 limitation 1). The stability of `screening_score` here is an artefact of saturation, not evidence of stability, and must not be presented as the latter.
**Consequences:** the readme, the report and the presentation must distinguish the reproducible deterministic layer from the advisory, non-reproducible AI layer. This strengthens rather than weakens the central design argument — everything that routes, escalates or scores structurally held still, and only the advisory content drifted — but the claim has to be stated in that form, with these numbers, rather than as "reproducible analysis". Practical consequence for the demo: the report shown in the presentation is one run's output, not *the* output for that page; say so.

**Related, verified in the same comparison — R9's upgrade scope is broader than the rule name suggests.** R9 upgrades any finding tagged PEMAT 4, CCI 7, **or WCAG 3.1.3 / 3.1.4** to critical when safety context is present (`12_decision_engine.js`, review fix of 31 Jul, added because the AI often reports an undefined abbreviation under the WCAG criterion without tagging the instrument item). This is why "'excipients' is unexplained jargon" — tagged PEMAT 3 / WCAG 3.1.3, originally `low` — became critical. Correct per the implemented rule, and conservative in the intended direction, but it means *every* jargon finding on safety-relevant content becomes critical. State this when presenting R9; do not let a reviewer discover that "excipients" and "BD undefined" carry the same severity without an explanation ready.

## D-31 — `completed_at` is set only when the audit is actually complete
**Context:** the first Day-5 run wrote `status: needs_review` together with `completed_at: 2026-08-04T11:50:03Z`. Node 18 set the timestamp unconditionally.
**Alternatives:** (a) keep it and define the column in the readme as "when the automated pass finished"; (b) set it null unless `status = 'completed'`.
**Decision:** (b).
**Rationale:** a row reading `needs_review` *and* carrying a completion timestamp invites exactly the wrong reading — that the audit is finished when a human has not yet looked at it. Since this system's entire argument is that the machine hands safety-relevant work to a person, the column that says when work finished must not say "finished" while that handoff is outstanding. Renaming the concept in prose (option a) would have left the misleading value in the database, where queries and the `v_review_queue` view read it, not the readme.
**Consequences:** one line in `18_generate_report.js`. `completed_at` is now null for every audit awaiting review, and a re-run that clears review flags will populate it. The report header still prints its own generation date, so nothing is lost. Existing rows keep their old timestamp until re-audited.

## D-32 — The headline WCAG score was mostly AI opinion; the deterministic score is now reported separately
**Context:** the Day-5 before/after demo. The corrected fixture returned PEMAT-informed understandability **92.9**, actionability **75**, CCI-informed **78.9** — and `screening_score: 34`, labelled *"severe issues found"*, identical in label to the deliberately terrible page. The database showed why: the corrected page has **zero** automated findings, so all 66 penalty points came from AI-proposed findings, three of which R9 had upgraded to critical.

```
 finding_key                    | severity | original_severity | review_reason
 ai-dose-unit-mg-unexplained    | critical | medium            | R9
 ai-drug-name-missing           | critical |                   |
 ai-emergency-number-112        | critical | high              | R9
 ai-nsaid-abbrev                | critical | high              | R9
 ai-breastfeeding-no-action     | low      |                   |
 ai-reply-timeframe-ambiguous   | low      |                   |
 ai-table-no-action-instruction | medium   |                   |
```

**The problem, stated plainly:** the number presented most prominently, labelled "WCAG screening score", was neither AI-independent nor reproducible (D-30) — while sitting in a system whose central claim is that the AI proposes and deterministic rules dispose. It also meant edge case **E14 ("prove it can also pass") failed on the headline number**: both fixtures read "severe issues found" despite one scoring 92.9 for understandability and the other 28.6.
**Alternatives:** (a) document the blend and rely on the instrument subscores for the before/after story; (b) exclude AI findings from the screening score entirely; (c) report both numbers.
**Decision:** (c). `screening_score_deterministic` and `screening_label_deterministic` are computed from automated findings only and printed beside the combined score in the report and the statement. R9 upgrades are excluded from the deterministic figure — the upgrade is AI-triggered, so counting it would leak AI influence into the number that exists to be free of it; the original severity is used instead.
**Rationale:** (a) leaves the strongest-looking number as the least defensible one. (b) discards real information — AI-proposed comprehension barriers are the point of the tool, and a reviewer should see their weight. (c) makes the architecture visible in the output itself: one number a reviewer can re-run and reproduce, one advisory number that will move. Verified against the fixture README's pre-computed values: **poor 52, corrected 100** — exactly as predicted on 31 July, from a code path written today.
**Consequences:** the before/after demo now has a clean, reproducible headline (52 → 100) alongside the AI-inclusive figure (0 → 34). `postgres_schema.sql` has no column for the new score, so it currently lives in the report only — adding one is optional and was not done under D-20 time constraints. `workflow_spec.md` §1 Node 12 and `readme.md` need the two-score description at the Day-7 sync. **The combined score remains non-reproducible and must never be quoted as a stable property of a page.**

## D-33 — Day 5 results: the before/after demo, and what it does and does not show
**Both fixtures audited end to end on 4 August with the two-score reporting of D-32.**

| | poor | corrected | predicted 31 Jul |
|---|---|---|---|
| automated findings | 8 | **0** | 8 → 0 ✓ |
| deterministic screening score | **52** — severe issues found | **100** — no issues in screened subset | 52 → 100 ✓ |
| deterministic instrument items | 5 of 8 fail | **8 of 8 pass** | 5 fails → 0 ✓ |
| PEMAT-informed understandability | 28.6 | **92.9** | not pinned (AI-dependent) |
| PEMAT-informed actionability | 33.3 | **100** | not pinned |
| CCI-informed | 22.2 | **88.2** | not pinned |
| safety_context / R7 | true → review | **true → review** | true → review ✓ |
| combined screening score | 0 | 38 — severe issues found | — |
| `status` | needs_review | needs_review | — |

**What this demonstrates.** Every deterministic figure reproduced the value predicted on 31 July from code paths that did not exist then. The tool discriminates: the same content, rewritten, moves from 52 to 100 on the reproducible score and from 28.6 to 92.9 on understandability. And it does not waive safety for quality — the corrected page is well written, scores 100 deterministically, **and still routes to a human**, because it is still medication content (R7). That combination is the system's whole argument in two rows of a table.

**What it does not demonstrate — E14 is only half met.** The combined screening score reads *"severe issues found"* for both pages (0 and 38). Two causes, both worth stating rather than hiding:
1. **Label thresholds are calibrated for markup findings, not content findings.** The ≥90 / 70–89 / <70 bands were designed when only nine deterministic checks fed the score. AI-proposed comprehension findings are numerous by nature — seven on a *good* page — so any page with content barriers lands under 70 regardless of quality. The bands need recalibration against a corpus before the combined score can carry a verbal label at all. Not attempted under D-20 time constraints.
2. **R9 manufactured all three criticals on the corrected page** (`ai-drug-name-missing` high→critical, `ai-nsaid-unexplained` high→critical, `ai-blood-pressure-term-undefined` **low→critical at confidence 0.70**). Without those upgrades the combined score would be 66 — still below 70, so R9 is not the sole cause, but it accounts for 28 of the 62 penalty points.
**Position taken:** report both numbers, quote the deterministic one as the reproducible result, and describe the combined one as an advisory signal whose verbal label is not yet calibrated. Do not present "severe issues found" on the corrected page as a finding about that page.

**Also observed:** `dropped_unverified: 0` on the corrected page and 1 on the poor page this run (3 and 4 in earlier runs) — the anti-fabrication check continues to fire at a low but non-zero rate, consistent with D-30's variance measurement.

## D-34 — Documentation review on Day 6: the documents described a feature that was never built
**Context:** before starting the Day-6 tests I ran a full consistency review of the project folder against the built system, rather than trusting `PROJECT_STATUS.md`. Nine inconsistencies surfaced. Eight were cosmetic — stale version numbers, a "next action" line four days out of date, a proposal deadline of 13 August while every other document said 7 August, a missing `D-12` that made the decision log look as though an entry had been retracted. **One was material.**

**The material one: spec Node 15 (`Insert Instrument Items`) does not exist on the canvas, and no document said so.** WF1 has 20 nodes; `Insert Instrument Items` is not among them, and no SQL file in `code/` references the `instrument_items` table. The table is created by `postgres_schema.sql` and never written to.

This was a **correct cut**, made on 3 August: `instrument_items` + Node 15 is Tier 2 scope under D-14, and D-20 cut all Tier 2. Nothing was done wrong during the build. What went wrong is that **D-14's own rule was not applied** — cut items are supposed to be marked "designed, not built in v1" in the spec, and this one never was. So four documents went on describing a working feature:

- `workflow_spec.md` Node 15: *"**This table is the audit trail of the assessment itself**, and is what a reviewer inspects to check the tool's reasoning."*
- `workflow_spec.md` §4, human-in-the-loop point 3: the reviewer *"overrides verdicts where wrong"* in a table that has no rows.
- `workflow_spec.md` §0 architecture diagram: `Postgres (audits / findings / instrument_items)`.
- `build_runbook.md` SCREENSHOT 12: `SELECT * FROM instrument_items WHERE audit_id = …` — a screenshot of an empty result.
- `readme.md`: *"a complete record of how each judgment was reached, stored in a Postgres database."*

**Why this is the worst class of error in this project specifically.** Every other overclaim I have caught was about *strength* — calling a screening score a conformance score, calling an adaptation a validated instrument. This one is about *existence*. It would have been discovered live, by a reviewer running the query in the runbook I handed them, in a presentation whose entire argument is that the system's claims are checkable. The reasoning trail is the feature that makes "AI proposes, deterministic rules dispose" auditable after the fact, and the document set claimed it was queryable when it is only readable.

**Alternatives:** (a) build Node 15 now — it is one Postgres node and the payload builder pattern from D-26 already exists, perhaps 45 minutes; (b) correct every document to state that it was cut, and record the consequences; (c) both.
**Decision:** **(b).** Not (a), and not (c).
**Rationale:** Node 15 is Tier 2 scope that was deliberately cut for time on 3 August. The conditions that justified the cut have not changed just because the omission was noticed — and "we found a gap in the documentation, so we built a feature" inverts the cut order the project pre-committed to precisely to stop that reflex. The evaluation criteria do not require it. Building it now would also mean re-running both fixtures to populate the table, which costs AI calls and produces a *third* set of AI findings that disagrees with the two already recorded in D-30. The honest correction costs half an hour and is worth more in review than the feature: a project that says "this was cut, here is what that costs you" demonstrates the judgment the assignment is actually assessing.
**Consequences:**
- `workflow_spec.md` → v2.2. Node 15 marked *designed, not built in v1*; architecture diagram corrected; human-in-the-loop table corrected to point at the report's per-item table; the `v_audit_summary` claim narrowed to what `audits` and `findings` can actually answer.
- `build_runbook.md` → v2.2. SCREENSHOT 12 withdrawn, replaced by the per-item verdict table in `demo_output/02_report_poor.md`. §0 gains a table of what was really cut. §7 gains actual dates and the revised Day-6 gate.
- `readme.md` rewritten; the "complete record… stored in a database" phrasing removed.
- `PROJECT_STATUS.md` internal contradictions resolved; `capstone_proposal.md` → v2.1.
- `decision_log.md` → v2.5, and D-12 recorded as an unused number.
- **New standing limitation:** per-item instrument verdicts are reported but not persisted, so no cross-audit analysis of instrument items — and no empirical false-positive rate per item — is possible in v1. Persisting them is the first item of future work, ahead of the `screening_score_deterministic` column.

**Process note, recorded because it generalises:** the review that found this compared the documents against the *exported workflow JSON*, not against the status file. `PROJECT_STATUS.md` had been accurate on the day it was written and drifted afterwards; the export cannot drift, because it is the system. Any future check of this kind should read the artefact, not the summary of the artefact.

## D-35 — E1 executed: the guard held, the label was wrong, and n8n was the reason
**Test:** E1 — submit the intake form with both content fields empty, in **production** mode (D-21: manual executions do not trigger error workflows).

**First run, 17:16 local (15:16 UTC).** Execution failed in **46 ms** at `Normalize Input`. No audit row, no findings row, no AI call — the guard fired before any network or model work. `WF-Error` caught it and wrote one `error_log` row. That is the behaviour E1 exists to prove, and it held.

**But the row read `error_class: unknown_error`, where the spec and runbook both say `no_content`.** Stored message:

```
neither a URL nor pasted content was supplied. [line 70]
```

Node 2 throws `no_content: neither a URL nor pasted content was supplied.` **The class token was missing from what arrived.** n8n rewrites a Code-node error message on its way to the Error Trigger: it appends `[line N]` and drops everything before the first colon. `WFE_strip_payload.js` classifies by pattern-matching the message, found no recognisable token, and returned `unknown_error` — which is the *documented, correct* behaviour of that function ("anything unrecognised becomes `unknown_error` rather than being guessed at"). The classifier was right; it was fed a mutilated message.

**Alternatives:** (a) document as a known defect and move on — zero cost; (b) add the literal message text to the classifier's pattern list in `WF-Error`; (c) separate the class token with a character n8n does not treat as a delimiter, so the token survives.
**Decision:** **(c).** (a) leaves `error_class` useless on the only real error the system has ever logged, which defeats the column's purpose — it exists so that failures can be queried by kind. (b) would work but couples the error handler to the exact wording of a message in a different workflow; reword the sentence and the classification silently breaks, with no test to catch it. (c) fixes the cause, costs one character in two places, and fixes `bad_url` at the same time for free.

**Change:** in `code/02_normalize_input.js` and in the live node, `'no_content: …'` → `'no_content - …'` and `` `bad_url: …` `` → `` `bad_url - …` ``. WF1 republished.

**Second run, 17:26 local (15:26 UTC).** Failed in **21 ms** at `Normalize Input`; `error_log` row reads `error_class: no_content`, message `no_content - neither a URL nor pasted content was supplied. [line 61]`. **E1 met in full.** Both rows are retained in `error_log` as the before/after evidence.

**Two further observations, both worth carrying:**

1. **The form says "Form Submitted" even when the audit fails.** n8n's Form Trigger acknowledges receipt before the workflow runs, so the browser confirmation is a receipt, not a result. A real user submitting a page for audit would see a success message for a run that died at the first node. Not a defect in this build — the intake is an internal auditor's form, not a public one — but it is a genuine usability and safety gap that would have to be closed before this went in front of anyone else, and it is honest to say so rather than let it look like the tool reports success correctly. Recorded as a limitation, not fixed (out of scope, D-20).
2. **The Day-2 `error_log` test was weaker than it appeared.** It used an artificial message ("Example Error Message") and therefore never exercised classification at all — it proved only that a row could be written. The first real error the system ever produced immediately exposed a defect the earlier test was structurally incapable of finding. A test that supplies its own convenient input tests the plumbing, not the behaviour.

**Consequences:** `workflow_spec.md` §1 Node 2 and §3 gain a note that class tokens must be dash-separated. `code/02_normalize_input.js` carries the reason as an inline comment so the hyphen is not "tidied" back into a colon later. The "Form Submitted" behaviour is added to the readme's limitations.

## D-36 — E11 executed: the fallback held, and the score said 100 for a page nobody assessed
**Test:** E11 — make the AI genuinely unreachable and check that the system still produces a correct, conservative outcome. Method: a second Anthropic credential (`Anthropic BROKEN (E11 test)`) holding an invalid key, applied to both AI nodes in SUB-A, rather than overwriting the working credential — n8n masks a saved key, so overwriting it would have made restoration depend on retyping the original correctly. Run in **production** mode with previously unseen content (a preventer-inhaler patient text), deliberately not one of the fixtures, so that the content hash would create a new audit row instead of overwriting the Day-5 demo evidence.

**Result — passed on every condition.** WF1 execution **Succeeded in 732 ms**, all 20 nodes green.

| | |
|---|---|
| `ai_fallback_used` | `true` |
| `triggered_rules` | `{R2, R7}` |
| `human_review_required` / `status` | `true` / `needs_review` |
| `completed_at` | null (D-31 holding) |
| `safety_terms_found` | `{112, emergency, puffs}` |
| `automated_checks_skipped` / `checks_engine` | `true` / `none` |
| instrument subscores | all **NULL**, `not_assessed_count` 44 |

**What this demonstrates that S3 did not.** S3 proved SUB-A returns a safe object when the API fails. E11 proves the *whole system* behaves correctly when it does: the audit completes rather than crashing, records that the AI was absent, and escalates. And the escalation did not depend on the AI at all — the safety prescreen is deterministic regex that runs **before** the AI call, and it identified dosing and emergency language on its own. With the model completely dead, the system still refused to let medication content through unreviewed. That is the central design claim, executed under the exact conditions it exists for.

**The defect this exposed: `screening_score = 100`, labelled "no issues in screened subset", on content where nothing was examined.** The text branch runs no HTML checks (`checks_engine: none`) and the AI produced nothing, so zero checks found zero problems and the score defaulted to its maximum. The statement is literally true — the screened subset was empty and contained no issues — but it reads as a clean bill of health for a page no one assessed.

**This is the third appearance of the same failure shape in this project**, and it is worth naming as a class: *absence of findings rendered as absence of problems*. First in the Day-0 review, where a validator returned "valid, 0 findings" when its context was unreachable (D-18). Second in D-32, where a page with zero automated findings still produced a confident-looking blended score. Now a third time. Each instance was caught by inspection rather than by a test, because a system that fails this way produces output that looks correct.

**What the report actually does, which is better than the raw row.** The generated report (`demo_output/05_report_e11_fallback.md`) prints all three instrument subscores as **"not computable"**, states R2 in plain language ("a full human audit is required"), lists every instrument item as `not_assessed` with a reason, and carries four explicit limitation lines including "all deterministic HTML checks were skipped" and "AI analysis unavailable/invalid". The document a human reads is honest. Only the score row is inconsistent with the rest of its own report.

**Alternatives:** (a) document the inconsistency and state it when presenting; (b) change `18_generate_report.js` so both WCAG rows print "not computable — no criteria screened" when checks were skipped and no AI findings exist; (c) set `screening_score` to NULL in Node 12 at source, so the database is honest too.
**Decision:** **(a).**
**Rationale:** (c) touches the decision engine — the component every score depends on and whose output was hand-verified on Day 4 — three days before submission, and would require redoing that verification for a display problem. (b) is contained to the report layer and is the correct fix, but it is a fourth long paste into an n8n Code node on a day when two such pastes silently truncated and one of them (D-35) shipped a broken node that a passing test failed to catch. The expected cost of the change is no longer just the thirty minutes; it is thirty minutes plus a non-trivial probability of introducing a defect into the report generator with no time left to find it. (a) costs nothing, hides nothing — the report already discloses the situation three lines below — and the inconsistency is a more useful thing to be able to explain than to have quietly removed. **Recorded as a known defect, not as acceptable behaviour:** option (b) is the correct fix and is now second on the future-work list.
**Consequences:** added to the readme limitations. When presenting the fallback demo, the 100 is to be pointed at *first*, by me, with the explanation — not left for a reviewer to find.

**Build note carried from this test:** switching the credential blanked the **Model** field in both AI nodes, because n8n populates that dropdown by calling the API. Both nodes were therefore changed from "From list" to **By ID** with the literal string `claude-sonnet-4-6`. This is kept permanently: it removes a live-API dependency from a field that never changes, and makes the exported workflow self-describing rather than reliant on a cached display name.

**Restoration required:** both SUB-A AI nodes must be returned to the credential named **`Anthropic account`** and SUB-A republished before any further AI test. The broken credential is retained, unused, as evidence.

## D-37 — S5 executed: the short-material rule works, and reading the report found a gap the test could not
**Test:** S5 — very short material. New fixture `fixtures/bp-meds-short.html`: a deliberately *well-formed but short* patient leaflet about furosemide, two paragraphs, 128 words, valid `lang`, title and heading. Written short so that the only reason any instrument item drops out is length.

**Deviation from the runbook's grouping, recorded deliberately.** S5 is listed among the SUB-A tests (S1–S6), but it cannot honestly be tested inside SUB-A. `is_very_short` is computed **upstream**, by WF1's `Automated Checks`, and SUB-A only receives the flag already decided. Testing SUB-A alone would prove the model obeys a flag, not that the flag is ever set correctly. S5 was therefore run through the full pipeline from the production form. The test is stronger than the one specified, not weaker: it exercises both the deterministic detection and the AI's response to it.

**Result — passed.**

| Item | Verdict | Decided by |
|---|---|---|
| PEMAT 8 (chunking) | `not_applicable` | deterministic — "material is very short (≤2 paragraphs)" |
| PEMAT 9 (headers) | `not_applicable` | deterministic — "material is very short" |
| PEMAT 11 (summary) | `not_applicable` | **ai** — "explicitly flagged as very short; a summary is not expected" |

`is_very_short: true`, 128 words, `checks_engine: cheerio`, `dropped_unverified: 0`. The split is the point: the two structural items were settled by code, the judgment item by the AI — and the AI was *told* the material was short by a deterministic flag rather than deciding it for itself.

**This run is also the clearest demonstration of the two-score design (D-32).** Same page, same run: **deterministic screening 100** ("no issues in screened subset") against **combined screening 42** ("severe issues found"). The markup is faultless; every criticism is about language, and three of them exist only because R9 upgraded them on safety-relevant content. This is the example to use when explaining why the score was split.

### Finding 1 — an apparent self-contradiction in the report that is actually correct
The report states PEMAT 9 `not_applicable` — *"headers not applicable, material is very short"* — and nine lines above, CCI 9 `fail` — *"Fewer than 2 headings; material is not chunked with headings."* Same page, same property, opposite verdicts.

Checked against `knowledge_base.md` §2, which was itself verified against the primary sources: **PEMAT items 8, 9 and 11 carry AHRQ's "N/A if very short" qualifier. CCI items 8 and 9 carry no such qualifier** — the CDC Index has no short-material exemption. The tool is correctly applying each instrument's own rule, and the instruments genuinely disagree.

Defensible, but it must be raised rather than discovered: a health-domain reviewer will see it immediately. It is also the first *concrete* instance of the adaptation caveat that has so far been stated abstractly — the CDC Index was designed for complete materials, so applying it to a 128-word leaflet penalises the leaflet for structure it does not need. No change made; the caveat now has a worked example attached to it.

### Finding 2 — a real coverage gap in the safety prescreen, found by reading the output, not by the test
The fixture reads *"Call 111 for advice, or 999 if you feel very unwell."* `safety_terms_found` returned `{tablet}` — **neither emergency number was detected.** The context-gated list was `['112', '911']`: the EU/German and US numbers only, while English-language patient material is squarely in scope.

R7 still fired, via the word "tablet", so the routing outcome was correct. But the safety signal itself was missed, and a leaflet saying "call 999 immediately" with no dosing vocabulary would not have produced it.

**Alternatives:** (a) document as a known gap; (b) add `999` and `111`; (c) add those plus other national numbers (000, 119, 115).
**Decision:** **(b).** (a) leaves a known gap in the one component that must never miss, and the fix is a single array element. (c) is scope creep: every addition needs checking against a primary source and raises false-positive risk on numbers that occur in ordinary text. `999` and `111` were added; both remain context-gated by `EMERGENCY_CONTEXT_RE`, so "111 mg" or a quantity of 999 still does not fire. Confirmed live: `safety_terms_found` now `{111, 999, tablet}`.

**Worth stating plainly: this gap was not found by a test.** S5 passed its stated criteria on the first run. The gap surfaced only from reading the generated report line by line and noticing an absence. Tests confirm the behaviour you thought to specify; they are silent about the case you never imagined. That is the third time in two days that inspection has caught what a passing test did not (see D-35, D-36).

### Finding 3 — an unplanned, stronger measurement of AI variance
The fixture was run three times with byte-identical content. `screening_score`: **42 → 72 → 65**. `triggered_rules`: `{R1,R4,R7,R9}` → `{R1,R7,R9}` → `{R1,R4,R7,R9}`.

This is a sharper result than D-30, which compared two runs of a page already at the score floor and so could not show movement. Here the drift is large enough that **R4 (screening score < 70) fired, did not fire, and fired again on the same material.** The AI layer does not merely perturb a number; it moves it across a deterministic rule's threshold.

**What did not move:** R7 fired on all three runs, the page routed to human review on all three, and the deterministic screening score stayed at 100 throughout. The safety path is anchored to the prescreen and the automated checks, neither of which involves the AI. That is the design claim holding under measurement.

**Consequences:** the readme and presentation quote 42/72/65 as the variance figure rather than D-30's pair. **The combined screening score must never be quoted as a property of a page**, and rule R4 must be described as advisory-dependent, since its input is not reproducible. R1, R2 and R7 are not affected — they derive from severity, AI availability and the deterministic prescreen respectively.

**Artefact:** `demo_output/04_report_s5_short.md` (first run, deterministic 100 / combined 42).

## D-38 — S4 executed: the anti-fabrication check, tested by injection rather than by asking the model to lie
**Test:** S4 — a finding whose evidence quote cannot be found in the source must be discarded before it reaches the database. This is the strongest claim the project makes about the AI layer, and until now it rested on Day-0 unit tests plus incidental observation (`dropped_unverified` between 0 and 4 across the demo runs). Neither showed the mechanism working on demand.

**Deviation 1 — method.** The runbook says "prompt the model to invent a quote". Rejected: a model may refuse, may comply partially, and the result is not repeatable, so a pass would be weak and a fail ambiguous. Instead a known-fabricated finding was **injected** directly, making the test deterministic and repeatable.

**Deviation 2 — where it ran, and this one is a limitation, not an improvement.** The intended method was to pin `AI Analysis`'s output inside SUB-A and execute manually. n8n's pinning could not be made to work: pinned trigger data did not reach `Build Prompt`, and n8n's "Edit Output" control is only available on a node that has already produced output — which `Build Prompt` could not, because it correctly refuses to run without `content_text`. After the editor problems already encountered that day (D-35), further time on n8n's pinning UI was not justified.

**What was done instead:** the `Validate Output` code was extracted **verbatim from `workflows_export/SUB-A_AI_Analysis.json`** — the artefact being submitted — and executed in an isolated Node process against a hand-built AI response, with `$input` and `$('Build Prompt')` supplied by a harness. Harness kept at `code/_S4_evidence_check_harness.js`; full transcript at `demo_output/06_s4_fabricated_evidence_test.md`.

**Stated plainly: this proves the validator's behaviour, not n8n's wiring around it.** The wiring is evidenced separately — by S1 on Day 2 and by every demo run since, where the same counter has moved on real model output. The two together are sufficient; neither alone would be.

**Injected response:** two findings, both otherwise schema-valid.

| finding_key | severity | evidence | in source? |
|---|---|---|---|
| `s4-real-quote` | medium | "Take one tablet each morning with a glass of water." | yes |
| `s4-fabricated-quote` | **critical**, confidence 0.95 | "Always double your dose if you miss a day." | **no — invented** |

The fabricated finding was deliberately made the most alarming in the set. Had it survived it would have fired R1 and forced `critical` onto a page that never made the claim — and the claim itself ("double your dose") is the kind that causes harm.

**Result — passed.** `dropped_unverified: 1` · one finding surviving · surviving key `s4-real-quote` · `valid: true` · `errors: []`.

**The `valid: true` is the part worth explaining.** A fabricated quote does not invalidate the analysis and does not trigger a repair attempt. The finding is removed silently and counted. This is deliberate: sending the model back to justify a quote it invented invites it to invent a better one. Deletion is not negotiable and not negotiated.

**Second run, added unprompted:** the same legitimate quote resubmitted with doubled spaces and an injected line break **still verified**. A validator that dropped correctly-quoted findings over reformatting would be its own failure mode — it would quietly delete true findings while appearing to work. The check normalises whitespace before comparing, so it discriminates rather than merely being strict. Both properties matter and only one of them was specified.

**Also observed:** the injected response carried no instrument items, and all **30** were returned as `not_assessed` rather than dropped from the denominators — the review fix from D-13 (#5) working as intended, verified here for the first time under a deliberately empty response.

**Consequences:** the readme's claim about evidence verification now cites a controlled test with a stated method and a stated limitation, rather than resting on unit tests. `demo_output/06_s4_fabricated_evidence_test.md` goes into the submission package. **Restore action required:** any pins left on SUB-A's `When Executed by Another Workflow` and `AI Analysis` nodes must be removed — pinned data applies only to manual executions and cannot affect production, but a pin left in place would mislead anyone opening the workflow.

## D-39 — Second review pass, 5 August: what a full sweep of the folder found after Day 6
A rigorous re-review after the Day-6 tests, checking the documents against the code and the code against itself. **The decision log is complete and internally consistent** — D-01 to D-38, no gaps once D-12 is accounted for, no duplicates. Six defects found, all in documentation or report wording rather than in logic.

**1. Every generated report says "These four numbers" and then prints five.** D-32 added the second WCAG screening score without updating the sentence above the table. This appears in the graded artefact — `02_report_poor.md`, `03_report_corrected.md`, `04_report_s5_short.md`, `05_report_e11_fallback.md`. Corrected in `code/18_generate_report.js`; the sentence now also states which number is reproducible and which is not, which the old wording did not.
**The existing reports in `demo_output/` are deliberately NOT edited.** They are the output of runs that actually happened; changing their text after the fact would make them worse evidence, not better. They keep the old sentence and this entry explains why.

**2. `capstone_proposal.md` still described WF1 as 19 nodes with "three Postgres upserts".** It is 20 nodes with four Postgres writes. Corrected.

**3. `build_runbook.md` §1 still said "Anthropic/OpenAI API credential".** The model has been fixed to `claude-sonnet-4-6` since D-22 and the OpenAI path was never built. Corrected.

**4. `workflow_spec.md` Node 18 still described "four scores side by side".** Corrected to five, naming the two-score split.

**5. `fixtures/README.md` did not mention `bp-meds-short.html`**, added the same day for S5. Documented, with its expected verdicts and the note that CCI 8/9 legitimately still fail on it.

**6. Two scaffolding files (`_DAY1_COMMANDS.md`, `_PASTE_day0_docs_update.md`) sat in the project root** and would have shipped as though they were deliverables. Moved to `meta/`.

**Checked and found sound:** the Tier C emergency-number matcher uses digit boundaries (`(?<!\d)111(?!\d)`), so adding `999` and `111` cannot match inside longer numbers and carries the same false-positive profile `112` already had. The apparent contradiction in the S5 report between CCI 3 (`pass` — "starts with a heading **or** contains emphasis markup") and PEMAT 12 (`fail` — "no lists or emphasis markup") is **not** a defect: CCI 3 passed on the heading, PEMAT 12 failed on the absence of lists and emphasis, and both are correct. It reads as a contradiction only because CCI 3's rationale names two possible causes without saying which one fired. Left as is; noted here so it can be answered rather than discovered.

**Known and accepted, not defects:** `workflows_export/` is stale after the Day-6 node changes and must be re-exported on Day 7 — this is the single most important remaining item, because the exports are what a reviewer runs. The reference file `code/02_normalize_input.js` retains its commented test block, which the live node does not; the code above the block is identical.

### Package cleanup, same session

**Removed as superseded:** `code/_e2e_report_poor.md` and `code/_sample_report_preview.md` (dry-run reports produced before n8n existed, so the presentation had something to show early — four real reports now exist), `demo_output/error_log_before_after.txt` (captured the wrong two rows and was superseded by the full log), `meta/HANDOVER_DAY6.md` (Day 6 complete; `PROJECT_STATUS.md` supersedes it), and `.DS_Store`.

**Kept deliberately, against the instinct to tidy:**
- `code/05_automated_checks_regex.js` — deleting it would erase D-17, a real design decision (both engines pre-written so the Day-1 cheerio choice cost no build time). But it had **no warning in its header** despite carrying the D-25 defect, which made it a live hazard: a reviewer could adopt it as the fallback and get wrong evidence quotes. A prominent header now states that it is not the production engine, that it carries a known defect, and that the fix was **deliberately not back-ported** — back-porting to unused code invites the belief that the code was re-verified, and it was not.
- `meta/_DAY1_COMMANDS.md` and `_PASTE_day0_docs_update.md` — obsolete as instructions, retained because D-39 records that they were found in the project root and moved; deleting them would erase that trail.

**`demo_output/` renamed to a numbered presentation order** (`01_before_after_comparison.md` … `10_e11_fallback_row.txt`) with a `README.md` explaining each file. Every reference across all documents was updated and then link-checked; no dangling paths remain apart from `demo_audit_report.md` and `presentation.md`, which are Day-7 outputs that do not exist yet.

**The generated reports were not renamed in content or edited.** They still read "These four numbers" above a five-row table, because they were produced before that fix. Stated in `demo_output/README.md` rather than corrected — see the reasoning in item 1 above.

**Observation about the review itself.** Every one of these six was found by comparing documents against the exported workflow and against each other — the same method that found the missing Node 15 in D-34. None would have been caught by running the system, because the system does not read its own documentation. That is worth stating as a general finding: in a project where the documentation *is* the deliverable, the documentation needs its own tests, and the only available test is a systematic re-read against the artefact.

## D-40 — Packaging for a public GitHub repository
**Context:** the submission is a public GitHub repository. Three questions needed answering before pushing: what licence, whether the AI-session scaffolding should be public, and what to do about the evidence screenshots.

**Licence — MIT, with a scope note appended.** MIT is the conventional choice and lets the work be reused. But a permissive licence on a *health* tool that makes no conformance claim needed a boundary stated in the licence file itself, not only in the readme: the note records that the tool produces a screening result over a listed WCAG subset and must not be the basis for a conformance claim, that the instrument output is an unvalidated adaptation not endorsed by AHRQ or CDC, that accuracy is unmeasured, and that the human-review routing must not be removed. A reader who takes the code and never opens the readme still sees it.

**`meta/` is published, including the system prompt given to the AI assistant.** Alternatives: remove the folder, or keep it. Kept. The assignment is explicitly about applying AI tools, so how that collaboration was configured is part of what is being assessed — hiding it would make the AI contribution less legible, not more credible. It is labelled as scaffolding rather than deliverables so nobody mistakes it for part of the system.

**Screenshots: 16 captured, three numbers absent, each for a stated reason.**
- **SS 6 and 7** (SUB-A's valid JSON output; the fallback object in the node panel) were **not taken.** Stronger evidence exists as text: `demo_output/06_s4_fabricated_evidence_test.md` is the validator's actual output against a controlled input, and `05_report_e11_fallback.md` is a complete audit produced with the AI dead. A screenshot of a JSON panel proves less than the object it would show.
- **SS 12** is **withdrawn**, not skipped — it queried `instrument_items`, which Node 15 was cut and never writes to (D-34). Photographing an empty table would evidence nothing.
- A duplicate `ss01b` was removed: the later capture of the same screen also contains the `docker compose ps` output, so it strictly supersedes the earlier one.

**Upload copy staged separately** at `<staging-folder>/a11yaudit/`, verified to differ from the working folder in exactly one file: `.env`. Staging rather than pushing from the working directory means the folder that contains the secret is never the folder that gets published — the ordering matters, because the project already lost an `N8N_ENCRYPTION_KEY` to a screenshot once and had to regenerate it.

**Checks run before staging, and worth naming because "I checked" is not a check:** no key-shaped strings in any text file; all four workflow exports carry credential `id` and `name` only, verified field by field rather than by grep; `.env.example` holds `changeme`; every JSON parses; every headline number identical across the readme, status file, decision log and handover; decision log complete at D-01…D-40 with no gaps. The screenshots were reviewed by eye, which is the only method available — text searches cannot read images.

## D-41 — Day 7: the presentation, and a claim that was one word too strong
**Context:** the last deliverable is the STL presentation script. Three questions had to be settled before writing it, and writing it surfaced a fourth.

**Length and format — 10 minutes, live system, word-for-word script.** Alternatives: 5 minutes (cuts the failure-path material, which is the strongest evidence for criterion 2); 15–20 minutes (room for the full Day-6 story, at the cost of a day spent rehearsing against a three-criterion bar). Ten minutes fits problem, architecture, the demo pair, one failure path, the defects and the limits, with slack for one interruption. A word-for-word script was chosen over bullet notes because the risk in a live review is not forgetting the content but improvising a claim that is one degree too strong — the sentences that state limits are the ones that must be pre-written. **Consequence:** the script is `presentation.md` in the project root, which also closes the last dangling path recorded in D-39.

**A slide deck was rejected.** It is not required by any of the three criteria, it duplicates artefacts that already exist, and building one on the final day would be exactly the over-building the cut order exists to prevent. The live system plus the generated reports is stronger evidence than a rendering of them.

**A no-Docker fallback is written into the script rather than left to improvisation**, with a five-minute limit before switching: present from `screenshots/` and the same `demo_output/` files. Every claim in the script is evidenced by a committed file, so nothing depends on a live execution. The demo pair is deliberately *not* re-run live — the AI layer varies between runs (D-30, D-37), and demonstrating that variance by accident in front of a reviewer would undercut the point rather than make it.

**The claim that was too strong.** The readme, `PROJECT_STATUS.md` and `demo_output/01_before_after_comparison.md` all said the deterministic 52 → 100 was "predicted in writing on 31 July, **before the code paths that produce them existed**." `fixtures/README.md` says something narrower and true: the values were "verified by running the actual node code (both the cheerio and the regex engine — identical results) on 31 Jul 2026". The check engines *did* exist on 31 July — that was Day 0, whose whole purpose was pre-writing them. What did not exist was the assembled n8n pipeline.

So the honest claim is a component-level expectation that the full pipeline later reproduced, not a blind prediction. That is still worth stating — it evidences that the pipeline assembles its parts without silently altering their output — but it is a smaller claim than the one three documents were making, and a reviewer who opened `fixtures/README.md` would have found the discrepancy unaided. **Corrected in `readme.md`, `demo_output/01_before_after_comparison.md` and the presentation script.** `01_before_after_comparison.md` is a hand-assembled comparison, not a generated report, so editing it is legitimate — unlike the reports in 02–05, which stay as produced (D-39).

**Also corrected:** `PROJECT_STATUS.md` said "17 captures" where the folder holds 16 and both `screenshots/README.md` and D-40 say 16. The count was right before the duplicate `ss01b` was removed during packaging and was never updated.

**Consequences and the general point.** This is the third time the same failure mode has appeared — D-34 (documents describing a cut feature as working), D-39 (six defects found by sweeping the folder), and now a headline claim inflated by one clause. Every instance was caught by comparing documents against each other or against the artefact, and none would have been caught by running the system. In a project where the documentation is the deliverable, the strongest available test is a systematic re-read against the primary artefact — and the claim most worth re-reading is the one that flatters the work.

## D-42 — A slide deck was built after all, reversing D-41
**Context:** D-41 recorded the decision *not* to build slides: not required by any of the three criteria, duplicative of existing artefacts, and a poor use of the final day. That decision is reversed here, and the reversal is recorded rather than quietly overwriting the earlier entry.

**What changed:** the reasoning in D-41 assumed the deck would cost a day. With `presentation.md` already written, every number already verified and the screenshots already captured, the deck is a *rendering* of settled material rather than new work — no new claims, no new evidence, nothing that needed re-checking. Its actual cost was under an hour. The premise was wrong, not the principle: the cut order exists to stop new *scope*, and this is not new scope.

**What it is.** `A11yAudit_presentation.pptx` — 12 slides, generated from a script (`meta/build_deck.js`) rather than assembled by hand, so it can be rebuilt if a number changes. Delivered as `.pptx` rather than a Keynote file: Keynote opens `.pptx` natively and keeps it editable, whereas a generated `.key` would not have been. Speaker notes on every slide, cross-referenced to the `TRIM 1`–`TRIM 5` markers in `presentation.md`.

**Design and typeface.** Puristic/architectural: monochrome, near-black `111111` on white with a single vermilion accent `C6381A`, generous margins, no rules or decorative bars, and one repeated motif — a sheet-number index in the top-left, borrowed from architectural drawings. **Montserrat was requested and replaced with Avenir Next**, on the grounds that Montserrat does not ship with macOS and a missing font silently re-flows a deck on the machine it is presented from; Avenir Next is the same geometric-sans family of forms and is installed by default. Recorded because it is a deviation from an explicit instruction.

**Two constraints this imposed, worth naming.** First, the screenshots are terminal and n8n captures with their own white and dark backgrounds, so they cannot sit on the dark slides without breaking the palette — the three dark slides (title, design principle, close) are therefore typographic only, and every screenshot lives on a white slide. Second, the deck states the same limits as the readme, in the same words, including the D-36 defect: a slide deck is the artefact most likely to be skimmed without the readme beside it, so the caveats travel with the numbers rather than being left behind in a document nobody opens.

**Consequences:** one more artefact to keep synchronised. If a headline number changes, `readme.md`, `presentation.md`, `demo_output/01_before_after_comparison.md` *and* the deck must all move together — which is exactly the drift that D-34, D-39 and D-41 each caught after the fact. The generator script is published so the deck is rebuilt rather than hand-edited.

## D-43 — The opening line of the presentation was wrong, and inverted
**Context:** the presentation opened, and `readme.md` and `knowledge_base.md` both asserted, that *"Take 1 tablet BD"* is a dosing instruction **patients routinely misread as "bedtime"**. Challenged on Day 7 with a one-word question — *proof?* — and checked against the primary sources rather than defended.

**What the sources actually say.**
- The current [ISMP List of Error-Prone Abbreviations (2024)](https://online.ecri.org/hubfs/ISMP/Resources/ISMP_ErrorProneAbbreviation_List.pdf) was read in full. **`BD` does not appear on it.**
- The 2015 edition did list `BD` — **in the opposite direction**: `BD` written to mean *bedtime*, mistaken as `BID` (twice daily). The claim was inverted.
- Bedtime confusion on the ISMP list attaches to `HS` (half-strength vs bedtime), `qhs` (mistaken as qhr) and `Qn` (mistaken as qh). That is almost certainly the source of the conflation.
- Separately, ISMP's list governs **clinician-facing** communication — prescriptions, order entry, medication administration records. This tool audits **patient-facing** material. Even the corrected version of the ISMP fact would have been the wrong evidence base for the sentence.

**The tool never made the claim.** `demo_output/02_report_poor.md` reads: *"Abbreviation 'BD' undefined — dosing frequency unclear… A patient who does not know this could take the tablet only once a day or at the wrong times."* That is accurate and is what the system output. The "bedtime" gloss was added on top of it by me, in prose, and would have been the first sentence a health-domain reviewer heard.

**Replacement, verified against the abstract rather than a search summary.** [Wolf MS, Davis TC, Shrank W, et al., *To err is human: patient misinterpretations of prescription drug label instructions*, Patient Educ Couns 2007;67(3):293–300](https://pubmed.ncbi.nlm.nih.gov/17587533/): 395 patients across three primary-care clinics, asked to read and demonstrate understanding of five common dosage instructions. Misunderstanding **63% (low literacy) / 51% (marginal) / 38% (adequate)**, p<0.001; per-instruction rates 8–33%. Six causes derived, including **label language**, **complexity of instructions** and **implicit versus explicit dosage intervals**. Conclusion: *"the instructions themselves are awkwardly phrased, vague, and unnecessarily difficult."*

That last cause is the project's thesis stated by the primary literature, and it is a stronger opening than the invented one was.

**Corrected in:** `presentation.md` (opening and cue card, plus a new Q&A answer that concedes the error), `readme.md` §"The problem it solves", `knowledge_base.md` §4 rationale (v2.3, with the two evidence bases now kept explicitly separate), slide 2 of `A11yAudit_presentation.pptx` and its speaker note. **`knowledge_base.md` gains two sources.** No instrument item, prescreen term, rule or code path changed — this was a claim about the world, not about the system.

**Partial, not total.** The same sentence also said `OD` is misread as *right eye*. **That half is correct** and is retained: ISMP lists *"o.d. or OD (once daily) mistaken as right eye (OD, oculus dexter), leading to oral liquid medications administered in the eye."* A blanket retraction would have discarded a true claim along with the false one.

**Why this entry matters more than the others.** D-18 caught defects in my code. D-34 and D-39 caught documents drifting from the system. This is a different failure: a claim that was never true, that no test could have caught, that sat in the graded deliverable for two weeks, and that survived every review pass because it was *plausible* and *rhetorically useful*. It was caught by a reader asking for proof. The lesson for the health domain specifically: the sentence most worth checking is the one that opens the talk, because it is the one chosen for effect. Same class of error as the invented PEMAT items caught before the build — and it recurred anyway.

## D-44 — Packaging went by web upload into a provided repository, not the git push D-40 described
**Context:** D-40 specified `git init` / `git add` / `git commit` / `git push` from a staged copy at `<staging-folder>/a11yaudit/`. That is not what happened. Turing College provided a ready-made repository, and the project was uploaded file by file through the GitHub web interface. Recorded because the runbook and D-40 both describe a procedure that was not followed, and a reader reproducing this project should know which one is real.

**Consequences of the actual route, all discovered rather than anticipated:**

**1. The staging folder went stale and nearly published a retracted claim.** The web upload draws from whichever folder the file is dragged from. The Day-7 corrections were made in the working folder `<repo-root>`, so the staged copy still held the pre-correction `readme.md`, `decision_log.md`, `knowledge_base.md`, `PROJECT_STATUS.md` and `demo_output/01_before_after_comparison.md`. Uploading from it would have re-published the BD/bedtime claim retracted in D-43. Caught only because the question "are they in the GitHub Upload folder already?" was asked before dragging. **With `git push` this class of error cannot occur — there is one tree, and `git status` names every difference.** Manual staging trades that guarantee for the ability to keep secrets in a separate folder.

**2. Dotfiles are invisible to the web uploader.** `.env.example` and `.gitignore` were silently skipped, because the browser file picker hides files beginning with a dot. `.env.example` is referenced by `readme.md` §Setup step 1, so the published setup instructions pointed at a file the repository did not contain. Found by reading the repository's own file listing, not by any check that had been written. The upside of the same behaviour: **`.env` cannot be uploaded by accident**, which is the risk the staging folder existed to manage in the first place.

**3. Subfolder files need the folder opened first.** Uploading from the repository root places files at the root regardless of where they belong, creating a duplicate while leaving the stale original in place. This is invisible until someone looks.

**4. Filenames are case-sensitive.** `readme.md` and `README.md` are different files on GitHub, and provided starter repositories commonly ship the uppercase form. Checked before uploading: this repository uses lowercase, so the graded deliverable replaced cleanly. Had it not, the repository would have rendered someone else's README as its front page.

**Decision: the runbook and D-40 are left as written, not rewritten to match.** They record a considered plan; this entry records what actually happened and why the difference mattered. Rewriting the plan to match the outcome would erase the fact that the deviation had consequences, which is the only part worth reading.

**The general point, and it is the fourth instance in this project.** D-34 found documents describing a feature that was never built. D-39 found six defects by sweeping the folder. D-41 found a headline claim inflated by one clause. This entry found a *staging folder* that had drifted from the source it was copied from. Same failure mode every time: a copy that is trusted because it was once correct. The only defence that has worked in this project is comparing the copy against the original before relying on it, and the only reason it worked this time is that the question was asked out loud.

## D-45 — A fourth false claim, and the first process built to catch the next one
**Context:** asked to rate the project on real value rather than against the marking criteria, a check of the remaining unverified assertions turned up **two more false claims**, bringing the total to four across D-41, D-43 and this entry.

**Claim 1 — "Every accessibility checker on the market passes this page. The markup is fine."** False about this project's own fixture. `bp-meds-poor.html` carries **eight automated findings**: missing `alt`, no `lang`, a link with no accessible name, an unlabelled form field, no `h1`, a skipped heading level, no `<title>`, a table with no `<th>`. Every one of those is precisely what axe, WAVE and Lighthouse detect. A reviewer could have disproved the sentence in thirty seconds by running Lighthouse on the fixture in this repository. **Corrected to the true and stronger version:** a checker *does* find real problems here — eight of them — and not one is the sentence that could get someone hurt. That reframes the two layers as complementary rather than rival, which is what the architecture actually claims.

**Claim 2 — health-literacy instruments "are manual scoring rubrics applied by trained human raters".** True of PEMAT-P and the CDC Index themselves. Not true of the field: the [SHeLL Health Literacy Editor](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9975914/) (Sydney Health Literacy Lab) is automated, browser-based, runs six language assessments, and is published and end-user tested. **Cited as related work in `readme.md` and `knowledge_base.md`, with a Q&A answer prepared.** The gap claim survives but is now hedged to what can honestly be supported: *"I could find nothing connecting the two"*, not *"nothing connects the two"* — a search, not a systematic review.

**The pattern, stated properly.** All four claims share a signature:

1. **plausible** — consistent with what the author already believed;
2. **rhetorically useful** — each made the project look better or the problem look sharper;
3. **about the world outside the repository** — other tools, other people, the market;
4. **load-bearing** — each sat in an opening line or a problem statement, the sentences a reader weighs most.

None was caught by a test, because every test in this project checks the *system*. Nothing checked claims about the *world*. Three of the four were caught by someone asking a question out loud; the fourth by a grep written afterwards.

**The fix, and it is the project's own design principle turned on its own prose.** This system exists because judgment is unreliable on the safety path, so deterministic checks run there instead. The documentation had no such layer — every claim rested on the author's judgement at the moment of writing. **`meta/claims_check.sh` is that missing layer:** a grep for absolute and universal constructions (`nothing`, `no other`, `the only`, `every … checker`, `always`, `never`, `routinely`, `are manual`) across the published documents. It cannot tell truth from falsehood. It only finds sentences that *make a claim strong enough to need a source*, and requires each to carry a citation, a hedge, or deletion.

It is deliberately crude and over-inclusive: statements about this system are false positives, and reading past them is the cost of catching the real ones. It found the cue-card copy of Claim 1 that the manual correction had missed, thirty seconds after being written.

**Consequences.** Run `bash meta/claims_check.sh` before any document is published. **It is a triage, not a guarantee** — a false claim phrased without an absolute would pass it untouched, which is exactly the residual risk. The honest answer to "how would you stop this happening again" is now two-part: this check catches the loud ones, and nothing yet catches the quiet ones except a second reader. `readme.md` → 1.3 · `knowledge_base.md` → 2.4.

## D-46 — D-20's cut list was over-broad: five of six cut items were built after all, and the log never recorded the reversal

**Context:** A rigorous pre-commit review (10 August) cross-checked D-20 against the actual code, not just against `workflow_spec.md`/`knowledge_base.md`/`readme.md`. D-20 (evening of 3 August) declared six items cut in the pre-committed order: rules R3/R5/R6, the before/after demo pair, rules R8/R9, `instrument_items` table and Node 15, CCI Part A scoring, and deterministic instrument observations (Node 5b) — with the instruction that all six "remain in `workflow_spec.md` marked 'designed, not built in v1'."

**Verification performed, against code directly:**
- `code/12_decision_engine.js:148-163` — all nine rules R1–R9, including R3, R5, R6, R8, R9, are implemented and unconditionally evaluated every run.
- `code/05_automated_checks.js:247-261` — CCI items 3, 8, 9 computed deterministically; `code/A2_build_prompt.js:97-106` requests AI judgment on CCI items 1, 2, 5, 6, 7, 10, 11 — together the full Part A (1–11) set `knowledge_base.md` §3 documents, item 4 correctly `not_assessed` by design.
- `code/05_automated_checks.js` — the `deterministic_items` object (Node 5b) is built and passed into SUB-A's prompt.
- `fixtures/bp-meds-poor.html`, `fixtures/bp-meds-good.html`, and `demo_output/01_before_after_comparison.md` / `02_report_poor.md` / `03_report_corrected.md` exist as real generated artefacts.
- `decision_log.md:213` (D-28, dated 4 August — the day after D-20) already contradicts D-20 on its own: "R3, R5, R6 correctly did **not** fire, which is as much a result as the five that did" — only possible if those rules were live at the time.

**Only one of D-20's six cut items is actually cut:** `instrument_items`/Node 15. No `INSERT INTO instrument_items` exists anywhere in `code/`, no such node exists in `workflows_export/WF1_Audit_Intake.json`; consistently documented as designed-not-built in `workflow_spec.md`, `readme.md`, and D-34.

**Decision:** Record the correction here rather than edit D-20, D-28, or any other entry. D-20 was accurate for the moment it was written — the schedule slip was real, the cut order was invoked as designed. What's missing is a record of the cut being *reversed*: Days 3–5 ran faster than the compressed schedule assumed (independently confirmed by D-39's own retrospective note, "most of Tier 2 survived because Days 3–5 ran faster than planned"), so five of the six items were built after all — but no entry ever logged that reversal, so the log and the built system silently diverged a second time (the first being D-34's discovery about Node 15).

**Rationale:** `decision_log.md`'s own purpose is to let a reader compare the log against the artefact, not trust either alone. An entry true when written but never updated when overtaken by events becomes actively misleading, not merely stale — the exact failure class D-34 named as the worst kind of error in this project ("about *existence*, not strength"). The fix is not to rewrite D-20 (which would erase the true fact that a cut was made and invoked under real schedule pressure) but to append that it was reversed, with the evidence.

**Consequences:** completeness note at the top of this file now reads "D-01 to D-46". No other existing entry is altered. Closes finding H1 from the 10 August pre-commit review.

## D-47 — `v_review_queue` could hide escalated audits with no qualifying finding row

**Context:** the same 10 August pre-commit review (Teil 1, finding #1) found that `v_review_queue` — the only documented human-review worklist (`workflow_spec.md:187,376`) — used an `INNER JOIN` between `audits` and `findings`, gated in `WHERE` on `f.human_review_required`. That column is set per finding only by R1 (`severity = 'critical'`) and R9 (`severity_upgraded_by`) — see `code/14a_build_findings_payload.js:64-65`. Rules R2 through R8 can set `audits.human_review_required = true` and `audits.status = 'needs_review'` without any individual finding qualifying, so an `INNER JOIN` on the finding-level flag returned zero rows for such an audit. It never appeared in the view a reviewer is told to work from, despite being correctly flagged internally.

**Not hypothetical — confirmed against the live database before the fix.** `audit_id df0de07b-eaea-4dcd-ab74-4b45e87d47a9` ("E11 AI unreachable test — preventer inhaler", the D-36 fallback test) sat in `audits` with `status = 'needs_review'`, `triggered_rules {R2,R7}`, and zero qualifying finding rows (SUB-A's fallback object returns `findings: []` — there is nothing to individually flag). It was absent from `v_review_queue` at query time, alongside the five audits that did appear correctly. Fixing the view did not need to be argued for in the abstract; the failure was sitting in the database.

**Decision:** change the `JOIN` to `LEFT JOIN`, with two specific placements, both deliberate:
1. **`f.human_review_required` and `f.status = 'open'` moved from `WHERE` into the `ON` clause.** A `WHERE` condition referencing the right-hand table of a `LEFT JOIN` silently discards the unmatched (NULL) rows the join exists to keep — it would have produced the exact same `INNER JOIN` result under a different name. Only the `ON` clause can decide *which finding* to attach without deciding *whether the audit row exists at all*.
2. **`a.human_review_required` added alongside `a.status = 'needs_review'` in `WHERE`**, though redundant: `code/13a_build_audit_payload.js:67` sets `status: j.human_review_required ? 'needs_review' : 'in_progress'` on every insert and update, so the two columns are already synchronised at every write. Added anyway as a second, independent gate, on the same "belt-and-braces" principle already used at Node 17 (`code/17_flag_for_review.sql:7`) — cheap insurance against a future write path that sets one without the other.

**Alternatives considered:** dropping `f.human_review_required` from the `ON` clause entirely, so every open finding on an escalated audit shows (not just the individually-flagged ones). Rejected for this fix — it would change established behaviour for the five audits that already worked correctly (more rows per audit, up to 25), which is a legitimate but separate product decision about how much context a reviewer sees, not a bug fix. Left as a possible future enhancement, not bundled in here.

**Verified after the fix, against the same live database:** the five previously-visible audits keep identical finding rows (the `ON` conditions are unchanged, only relocated). The E11 audit gains exactly one new row, all finding columns `NULL`, audit-level columns (scores, `triggered_rules`, `safety_terms_found`) populated, sorted into the lowest severity tier by the existing `CASE ... ELSE 4` (already NULL-safe, no change needed there).

**Rationale:** this is the same failure shape decision_log.md has named repeatedly — absence of a specific signal (here, a flagged finding row) read as absence of a problem, rather than as a gap in how the signal is surfaced (D-18, D-32, D-36). R7's entire purpose is that safety-relevant content is never reviewed by AI alone; a worklist that can silently omit the audit R7 escalated defeats that purpose at the tool level even though the rule itself fired correctly.

**Consequences:** `postgres_schema.sql`'s `v_review_queue` definition updated in place (`CREATE OR REPLACE VIEW`, no migration needed for existing data — the view is derived, not stored). Applying the updated definition to a running database requires re-running that `CREATE OR REPLACE VIEW` statement against it; the schema file is the source of truth, not the live container until refreshed. No code outside the view definition itself depends on the previous row shape — checked repo-wide, `v_review_queue` is read only by manual reviewer queries, never by an n8n node.

---

## D-48 — `docker-compose.yml` had no pinned project name; today's repo reorganisation would have silently renamed the containers

**Context:** after the first commit, the working folder was renamed and moved for clarity (`a11yaudit` → `a11yaudit-agent`, relocated from `~/projekte/a11yaudit-agent` to `~/Desktop/a11yaudit-agent/repo`) — see the working log for 10 August. A final setup review before pausing for the day checked `docker-compose.yml` and found no top-level `name:` key and no `COMPOSE_PROJECT_NAME` set anywhere in the repo. Docker Compose falls back to the current directory's basename for the project name when neither is set, and derives container names from it.

**Not hypothetical — the basename actually changed.** The folder Compose would have been run from was `a11yaudit` when `meta/_DAY1_COMMANDS.md` was written and documents "two lines, `a11yaudit-postgres-1` and `a11yaudit-n8n-1`" as the expected `docker compose ps` output. After today's move, the working directory's basename is `repo`, not `a11yaudit` — an unqualified `docker compose up -d` run from here would have produced differently-named containers (something derived from `repo`), silently breaking that documented expectation and any command that assumes the old container names.

**Decision:** add `name: a11yaudit` as an explicit top-level key in `docker-compose.yml`, pinning the Compose project name regardless of which directory the command is run from.

**Alternatives considered:** passing `-p a11yaudit` on every `docker compose` invocation, or setting `COMPOSE_PROJECT_NAME=a11yaudit` in `.env`. Both work but must be remembered and repeated correctly every time; a wrong or omitted flag reintroduces the exact same silent drift. The `name:` key is checked into the repo once and applies unconditionally — it can't be forgotten on a future rename.

**Rationale:** this is the same shape of problem as D-46/D-47 — a value that used to be implicitly correct (because it depended on an assumption, here "the folder is called `a11yaudit`") stops being correct the moment that assumption changes, with nothing forcing a check. Pinning the name removes the assumption entirely rather than documenting around it.

**Consequences:** `docker compose ps` will show `a11yaudit-postgres-1` / `a11yaudit-n8n-1` regardless of the containing folder's name, matching `meta/_DAY1_COMMANDS.md` and `PROJECT_STATUS.md` as originally documented. No other file references `COMPOSE_PROJECT_NAME` or depends on the old implicit behaviour — checked repo-wide. Not yet run against a live container (none is currently up); takes effect on the next `docker compose up`.

---

## Sources consulted
- [PEMAT-P — AHRQ](https://www.ahrq.gov/health-literacy/patient-education/pemat-p.html)
- [PEMAT and User's Guide — AHRQ](https://www.ahrq.gov/health-literacy/patient-education/pemat.html)
- [CDC Clear Communication Index Score Sheet](https://www.cdc.gov/ccindex/pdf/full-index-score-sheet.pdf)
- [CDC Clear Communication Index User Guide](https://www.cdc.gov/ccindex/tool/index.html)
- [CCI applied to a patient portal](https://pmc.ncbi.nlm.nih.gov/articles/PMC5114169/)
- [W3C COGA guidance](https://accessibility.education.gov.uk/guidelines/coga)
- [Health literacy evaluation measures — RHIhub](https://www.ruralhealthinfo.org/toolkits/health-literacy/5/evaluation-measures)
- [n8n — Error Trigger node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger) and [Manual, partial and production executions](https://docs.n8n.io/workflows/executions/manual-partial-and-production-executions/) — basis for D-21
