# A11yAudit — Project Status / Handover

> **Relocated to `archive/` 19 August 2026** (rigorous review, `decision_log.md` D-84, external review Finding 9 — this file was already the exception that finding named by name). Nothing below is edited; it was already frozen before the move. For current status read `CLAUDE.md`, exactly as the "Phase 2 status lives elsewhere" note two paragraphs down already said before this move too.

**This file is a frozen Phase-1 submission snapshot (Turing College Case 3, 7-day sprint, 31 Jul–7 Aug 2026), preserved as evidence — not a living status doc.** Everything below the "Phase 2" note directly under this line is Day-0-through-7 history and is intentionally left as it was written; see "Documentation status — done, do not regenerate" further down, which applies to this file too. **Phase 1 is complete** (confirmed in `A11yAudit_Fahrplan.md`'s own top line: "Phase 1 abgeschlossen"). Do not add Phase-2 work here — see the pointer below instead. The original per-build-day update instruction that used to sit on this line applied only during the 7-day sprint and has been superseded by the note immediately below.

> **Phase 2 status lives elsewhere.** Started 15 August, now spanning branches `iteration-1-subworkflow-refactor` (renamed from `subworkflow-refactor`, 19 August) and `iteration-2-claude-code`; latest entry **D-81** (19 August, `decision_log.md` v6.9). For current status, read `CLAUDE.md`'s Phase-2 section and `A11yAudit_Fahrplan.md`, not this file. The documentation-status table below (§"Documentation status") lists file versions **as they were at the 7 Aug submission** — every one of them has since moved on; check each file's own version header for the current number, e.g. `decision_log.md` is now v6.9 (D-01 to D-81), not the v3.0 listed below. **This example number will itself go stale again — it already has once** (corrected from D-68/v5.6 to D-74/v6.2 by D-77, then found stale again at D-81, six entries further on); the instruction to check each file's own header is the durable part, not the example.

> **Day 7 (5 Aug).** `presentation.md` written (v2.0, ten minutes, 1,485 spoken words, measured section by section) and `A11yAudit_presentation.pptx` built from `meta/build_deck.js` so it can be rebuilt rather than hand-edited. Four decision-log entries added.
>
> | Entry | What it records |
> |---|---|
> | **D-41** | Presentation format decided. **A headline claim corrected:** three documents said the deterministic 52 → 100 was predicted "before the code paths that produce them existed". The check engines *did* exist on 31 July — Day 0 built them. Only the assembled pipeline did not. Narrowed to the accurate version. |
> | **D-42** | A slide deck was built after all, reversing D-41's decision not to. The premise was wrong, not the principle: rendering settled material cost under an hour, not a day. |
> | **D-43** | **The opening line of the presentation was false and inverted.** It claimed patients "routinely misread BD as bedtime". ISMP records the opposite error and does not list BD at all; bedtime confusion belongs to `HS`. Replaced with Wolf et al. 2007 (395 patients; 63% / 51% / 38% by literacy level). Caught by being asked for proof, not by any check. |
> | **D-44** | Packaging went by web upload into a Turing-provided repository, not the `git push` D-40 described. The staging folder had gone stale and would have re-published the retracted claim; dotfiles were silently skipped. |
>
> **The recurring theme, now on its fourth instance:** D-34, D-39, D-41 and D-44 are all the same failure — a copy trusted because it was correct yesterday. Documents describing a cut feature, a folder sweep finding six defects, a claim inflated by one clause, a staging folder drifted from its source. None would have been caught by running the system.

> **Day 6 summary (4–5 Aug).** Four tests run, all passed, and **every one of them found something a passing test would have hidden.**
>
> | Test | Result | What it exposed |
> |---|---|---|
> | **E1** empty submission | refused in 46 ms, no row written, logged | error was misclassified `unknown_error` — n8n discards everything before the first colon in a Code-node error message. Fixed (hyphen separator), re-run, verified `no_content` (**D-35**) |
> | **E11** AI unreachable | audit **completed** in 732 ms, R2+R7, `needs_review`, `completed_at` null | `screening_score` reads 100 when nothing was screened. Documented, not fixed (**D-36**) |
> | **S5** very short material | PEMAT 8/9/11 `not_applicable`, deterministic 100 vs combined 42 | safety prescreen had no UK emergency numbers — `999`/`111` were invisible. Fixed and verified. Three runs of identical content scored 42/72/65 (**D-37**) |
> | **S4** fabricated evidence | fabricated `critical` finding dropped, legitimate one survived, whitespace-tolerant | n8n's pinning could not be made to work; test run against the exported node code instead, limitation stated (**D-38**) |
>
> **Revised Day-6 gate met:** E1 and E11 executed in production mode; S4 and S5 executed; E10/E13/E14 cited to the Day-4/5 runs that produced them; E7 dropped. Reasoning in `build_runbook.md` §7.
>
> **New artefacts:** `demo_output/01_before_after_comparison.md` · `05_report_e11_fallback.md` · `04_report_s5_short.md` · `06_s4_fabricated_evidence_test.md` · `07_final_results_table.txt` · `09_error_log_full.txt` · `08_audits_overview.txt` · `10_e11_fallback_row.txt` · `fixtures/bp-meds-short.html` · `code/_S4_evidence_check_harness.js` · `screenshots/` with SS 14–19 and a capture README.
>
> **Changes to the live system on Day 6:** `Normalize Input` error tokens hyphen-separated (D-35) · `Safety Prescreen` TIER_C gains `999`, `111` (D-37) · both SUB-A AI nodes switched from model-by-list to **model-by-ID** `claude-sonnet-4-6`, kept permanently (D-36). A deliberately invalid credential `Anthropic BROKEN (E11 test)` is retained, unused, as evidence; both AI nodes are back on `Anthropic account`.
>
> **The recurring theme, worth stating in the presentation:** three of the four defects found on Day 6 were caught by *reading output*, not by a test passing or failing. Every test met its stated criteria on the first or second run. What the tests could not do was notice the thing nobody thought to specify.

> **Documentation sync, 4 August.** A rigorous review of the folder found nine inconsistencies between the documents and the built system. All were corrected the same day rather than being carried to Day 7. The material one: **spec Node 15 was never built**, so the `instrument_items` table is empty — correctly cut under D-20, but the spec, the runbook and the readme all still described it as working. See D-34. Documents now at: `decision_log.md` 2.5 · `workflow_spec.md` 2.2 · `build_runbook.md` 2.2 · `capstone_proposal.md` 2.1 · `knowledge_base.md` 2.1 (unchanged, no defects found) · `readme.md` — see below.

> **Day 3/4 summary (4 Aug):** WF1 built end to end, spec nodes 1–14 = 16 nodes on canvas (two extra payload-builder Code nodes — see D-26). Exported to `workflows_export/WF1_Audit_Intake.json`; credential blocks carry ids only, no secrets (Day-7 packaging check cleared early). Form Trigger → Normalize → IF → Fetch/Prepare → Merge → Hash+Guard → Safety Prescreen → SUB-A → Merge Findings → Decision Engine → Upsert Audit → Insert Findings. Error Workflow set to `WF-Error`. Full AI path green: 23 findings written, `{R1,R4,R7,R8,R9}` fired, all four scores reproduced by hand. Idempotency proven (`run_count: 3`, one row). New entries: **D-24** (fetch error handling), **D-25** (evidence defect found and fixed), **D-26** (DB writes via JSON payload + Execute Query), **D-27** (`max_tokens` 6000 → 16000; S2 demonstrated by accident), **D-28** (results, and three limitations the results expose).
>
> **Day 5 also completed on 4 Aug.** Nodes 16–19 built (WF1 now 20 nodes); both fixtures audited end to end. **Deterministic before/after: 52 → 100**, exactly as predicted on 31 July; PEMAT-informed understandability 28.6 → 92.9, actionability 33.3 → 100, CCI-informed 22.2 → 88.2; R7 fires on both, so the corrected page still routes to human review. New entries **D-29** (coverage undercount fixed), **D-30** (measured AI variance at temperature 0 — no reproducibility claim for the AI layer), **D-31** (`completed_at` only when complete), **D-32** (two screening scores), **D-33** (Day-5 results; E14 half met; label thresholds uncalibrated for content findings).
>
> **Folder state (4 Aug, 14:35):** `workflows_export/WF1_Audit_Intake.json` re-exported with all **20 nodes** and verified (Error Workflow set, four Postgres nodes on one credential, no secrets in any export). New folder **`demo_output/`** holds the before/after pair as markdown — `02_report_poor.md` (deterministic 52) and `03_report_corrected.md` (deterministic 100) — pulled from Postgres, ready for the presentation without needing a live database.
>
> **Next: Thu 6 Aug — edge cases E1, E11, E13 (already evidenced), E14 (done), plus SUB-A tests S2/S4/S5 and screenshots.** Then Fri 7 Aug: docs sync (`workflow_spec.md` node numbering and Node 4/12 changes, `build_runbook.md` tier list, `readme.md` two-score description), readme finalised, package, submit.
>
> **Superseded plan below (written 3 Aug):**
>
> **Next: Wed 5 Aug — nodes 16–19** (review branch, report, statement) and the demo audit end to end. `code/18_generate_report.js` is pre-written. Note `status` is currently set to `needs_review`/`in_progress` by Node 13; Node 19 must set `completed` when a report exists.

> **Schedule reality check (3 Aug):** the runbook places Day 3 on 3 August. Days 0–2 are now complete, so the gap is one day, not two. See D-20: **all Tier 2 scope is cut.**
>
> **Compressed schedule to submission:**
>
> | When | Work |
> |---|---|
> | Tue 4 Aug | WF1 nodes 1–9, then 10–14 (merge, decision engine, DB writes) |
> | Wed 5 Aug | Nodes 16–19 (review branch, report, statement); demo audit end to end |
> | Thu 6 Aug | Edge cases E1, E11, E13, E14 **in production mode** (see D-21); SUB-A tests S2/S4/S5; screenshots |
> | Fri 7 Aug | Docs sync, readme finalised, presentation, package, **submit** |

Purpose: let a new chat pick up seamlessly. Read this first, then `build_runbook.md` §7 for the schedule.

---

## Where things stand in one line

**Days 0–5 are complete and every gate was met.** The system runs end to end on both fixtures; the before/after demo, the AI fallback path and idempotent re-runs are all demonstrated. Documentation was fully synchronised with the as-built system on 4 August (decision log v2.5, spec v2.2, runbook v2.2).

**Next action: Day 7 only.** Everything else is done. Remaining work, in order:

1. ~~Apply the report-wording fix to the live node~~ — **done 5 Aug**, verified present in the export.
2. ~~Re-export the workflows~~ — **done 5 Aug and verified.** See the export-verification record below.
3. ~~Screenshots~~ — **done 5 Aug. 16 captures** in `screenshots/`, with a README listing each one and what to say about it. (Corrected from 17 on 5 Aug: the duplicate `ss01b` was removed during packaging — see D-40.) SS 6/7 deliberately not taken (stronger evidence exists as text); SS 12 withdrawn (Node 15 cut).
4. ~~GitHub preparation~~ — **done 5 Aug.** `LICENSE` (MIT, with a scope note stating the tool makes no conformance claim), hardened `.gitignore`, and `meta/GITHUB_SUBMISSION.md` with the file manifest, pre-commit checks and the git commands.
5. ~~Presentation script~~ — **done 5 Aug.** `presentation.md` v2.0: 10-minute script, **1,485 spoken words counted section by section**, 15 prepared Q&A answers, one-page cue card, deck-first with a live-system alternative. Decisions in **D-41**.
6. ~~Slide deck~~ — **done 5 Aug.** `A11yAudit_presentation.pptx`, 12 slides, generated from `meta/build_deck.js`. Four screenshots embedded in the file, so no screen-switching and no dependency on Docker. Reasoning in **D-42**.
7. ~~Documentation corrections published~~ — **done 5 Aug.** `readme.md` (1.2), `decision_log.md` (through D-43), `knowledge_base.md` (2.3), `PROJECT_STATUS.md`, `demo_output/01_before_after_comparison.md` and `.env.example` are live in the repository.
8. **Rehearse once with a timer.** 1,485 words is 9.9 minutes at 150 wpm, 11.4 at 130. Your measured pace decides whether anything needs cutting.
9. **Upload the presentation bundle** — the one outstanding item. See below.
10. **Submit.** Deadline 7 August.

### Outstanding: the presentation bundle

> **Resolved — Phase 1 submitted.** This section describes the state as of 5 August, before upload. `A11yAudit_Fahrplan.md` confirms Phase 1 is complete, so this step was carried out; the section is left unedited below as the historical record of what was staged and why, not because the item is still open. If the exact upload timestamp/detail matters, it isn't recorded in this file — check `decision_log.md` D-44 (packaging) or ask the author directly rather than assuming from this note.

Staged and ready at `<staging-folder>/_TO_UPLOAD/`.

| File | Destination |
|---|---|
| `A11yAudit_presentation.pptx` | repository root |
| `decision_log.md` | repository root — refreshed to **v3.1** with D-44 |
| `PROJECT_STATUS.md` | repository root — this file |
| `presentation.md` | repository root |
| `build_deck.js` · `slide_notes_plain.md` · `GITHUB_SUBMISSION.md` | click into **`meta`** on GitHub first |

Until the deck is uploaded, this file and `decision_log.md` reference a presentation that is not in the repository.

**Repo state:** 79 files, 7.4 MB, verified secret-clean. `readme.md` renders as the repository home page.

### Export verification — 5 August, 11:54

`workflows_export/` re-exported and checked against the Day-6 changes rather than trusted by filename.

| File | Nodes | Error workflow | State |
|---|---|---|---|
| `WF1_Audit_Intake.json` | 20 | set | **current** — hyphen error tokens (D-35), full `Normalize Input` return block, `'999', '111'` in prescreen (D-37), two-score report sentence (D-39) |
| `SUB-A_AI_Analysis.json` | 12 | set | **current** — model **by ID** `claude-sonnet-4-6` (D-36), `maxTokens` 16000 (D-27), `temperature` 0, credential `Anthropic account` |
| `WF-Error.json` | 3 | none — **correct**, it must not catch its own failures | unchanged since 4 Aug; `WF-Error` was not modified on Day 6, so the export still matches |
| `_cheerio_test.json` | 2 | none | Day-1 artefact, never modified |

**Secret scan: clean.** No API keys, passwords or encryption keys in any shipping file. The workflow JSONs carry credential *references* only — an id and a display name — so anyone importing them must supply their own. The one grep hit, `docker-compose.yml` line 29, is `N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}`, a variable reference resolved from the git-ignored `.env`.

> **Caught during this step, worth recording:** the first attempt at re-exporting SUB-A moved a file from `~/Downloads` that had the right *name* but was an export from 09:32 on 4 August — carrying `maxTokens: 6000` (pre-D-27) and model-by-list (pre-D-36). It silently replaced a newer file and would have shipped a regression. Verifying the contents rather than the filename took ten seconds and caught it. Same lesson as D-34 and D-39: check the artefact, not the label on it.

The readme is finished: every `[fill after build]` marker is gone and all results sections are populated.

---

## Deadline

**Submit 7 August 2026.** Platform access ends 13 August; submitting on the 7th leaves room for the STL review. Seven build days, day-by-day schedule with daily gates in `build_runbook.md` §7.

---

## Documentation status — done, do not regenerate

| File | Contents | Version |
|---|---|---|
| `workflow_spec.md` | node-by-node spec for WF1 (**20 nodes on canvas**), SUB-A, WF-Error; AI prompt; JSON schema; rules R1–R9. **Synchronised with the as-built system 4 Aug** | 2.2 |
| `knowledge_base.md` | verified PEMAT-P and CDC CCI item lists, WCAG scope in/out, safety term list, sources. **§4 rationale corrected 5 Aug — the BD/bedtime claim was unsupported and inverted (D-43); two sources added** | 2.3 |
| `decision_log.md` | **D-01…D-43**: decisions, alternatives, corrections, open limitations. Verified complete — no missing numbers, no duplicates; D-12 is an unused number, recorded as such | 3.0 |
| `build_runbook.md` | scope tiers §0 (**with what was actually cut**), setup, build order, test matrix, schedule §7 (**planned vs actual**) | 2.2 |
| `postgres_schema.sql` | 4 tables, 2 views, triggers, reference queries — syntax-validated. **`instrument_items` is never written to (Node 15 cut); no column for `screening_score_deterministic`** | 2.0 |
| `capstone_proposal.md` | one-page proposal; timeline now shows planned vs actual | 2.1 |
| `readme.md` | **required Turing deliverable** — rewritten 4 Aug with the Day-5 results, completed with the Day-6 failure-path runs; 31-July claim corrected on Day 7 (D-41), BD/bedtime claim retracted and replaced with Wolf et al. 2007 (D-43) | 1.2 |
| `presentation.md` | **STL presentation script** — 10 minutes, live system, word-for-word with cues, Q&A and a one-page cue card. Written Day 7 | 1.0 |
| `A11yAudit_presentation.pptx` | **12-slide deck**, generated by `meta/build_deck.js` so it can be rebuilt rather than hand-edited. Opens in Keynote. Speaker notes cross-referenced to the script's TRIM markers (D-42) | 1.0 |

All seven pre-build review fixes are applied (`decision_log.md` D-13). Scope is tiered for the 7-day window (D-14); what was actually cut is recorded in `build_runbook.md` §0.

---

## Environment — exact state

**Project folder:** `<repo-root>` — everything now lives here: docs, `docker-compose.yml`, `.env`, `code/`, `fixtures/`, `meta/`.

**Folder as it stands at the end of Day 6 (5 August):**

```
a11yaudit/
├── readme.md                 ← the graded Turing deliverable
├── PROJECT_STATUS.md · decision_log.md · workflow_spec.md
├── knowledge_base.md · build_runbook.md · capstone_proposal.md
├── postgres_schema.sql · postgres_schema_addendum.sql
├── docker-compose.yml · .env (git-ignored) · .env.example · .gitignore
├── workflows_export/         ← WF1 (20 nodes), SUB-A (12), WF-Error (3), _cheerio_test
├── code/                     ← one file per Code/Postgres node, plus
│                               _DAY0_REVIEW.md and _S4_evidence_check_harness.js
├── fixtures/                 ← bp-meds-poor.html, bp-meds-good.html,
│                               bp-meds-short.html, README.md
├── demo_output/              ← 10 files, numbered in presentation order
├── screenshots/              ← SS 14–19 + capture README
└── meta/                     ← build-session scaffolding, not deliverables
```

**Done:**
- `docker-compose.yml` complete — `postgres:16` + `n8n:latest`, named volumes, port 5678, `N8N_RUNNERS_ENABLED=true`, and **`NODE_FUNCTION_ALLOW_EXTERNAL=cheerio` + `NODE_FUNCTION_ALLOW_BUILTIN=crypto` (added Day 0, YAML re-validated)**.
- `.env` created with `POSTGRES_PASSWORD` and `N8N_ENCRYPTION_KEY` (regenerated after being exposed in a screenshot). **Values must be stored in a password manager and a second location** — a lost `N8N_ENCRYPTION_KEY` makes all saved n8n credentials permanently unreadable. `.gitignore` and `.env.example` added so the real `.env` never travels with the submission package.
- All Code-node JavaScript and the demo fixtures — written, tested outside n8n, reviewed (see Day 0 below).

**Resolved same night:** SUB-A's Settings → Error Workflow initially showed `WF-Error` greyed out. **Cause: a workflow must be published before another workflow can select it as its error handler.** Both `WF-Error` and `SUB-A_AI_Analysis` are now published, and SUB-A's Error Workflow is set to `WF-Error`. **The same setting must be applied to WF1 once it exists** (`workflow_spec.md` §3). Note: `WF-Error` must **not** point at itself — a self-referential error handler would re-enter on its own failure.

**Day 1 (done, evening of 3 Aug):**
1. Containers up: `a11yaudit-postgres-1` `Up (healthy)`, `a11yaudit-n8n-1` `Up`, port 5678. `NODE_FUNCTION_ALLOW_EXTERNAL=cheerio` and `NODE_FUNCTION_ALLOW_BUILTIN=crypto` confirmed inside the running container.
2. n8n owner account created (password in password manager). Cheerio test workflow `_cheerio_test` saved: **full PASS** (`cheerio_available: true`, `crypto_available: true`, `sha256_correct: true`) → **use `code/05_automated_checks.js`**; the regex fallback stays unused.
3. Database `a11yaudit` created; `postgres_schema.sql` applied cleanly (4 tables, 2 views verified via `\dt`/`\dv`); optional `postgres_schema_addendum.sql` also applied (3 ALTER TABLE).
4. Credentials created and tested in n8n: Postgres (host `postgres`, db `a11yaudit`, user `n8n`) and Anthropic (API key created at console.anthropic.com, stored in password manager).

**Day 1 gate: MET** (schema queryable, cheerio decided — no decision-log entry needed, expected path taken).

---

## Day 0 — COMPLETE (31 July)

**Why it was done:** the build's real bottleneck is not writing JavaScript but debugging it inside n8n while simultaneously learning n8n's item-array data model (`$input.all()`, `item.json`, returning arrays of objects). Pre-writing converts Days 2–5 from "write, misunderstand, debug, retry" into "paste, execute, compare against a documented expected output". (Decision: `decision_log.md` D-16.)

All eleven items delivered, plus a regex twin of the checks node and a review record. Every file carries a header comment (node, expected input shape, output shape) and a commented test-input block that can be pinned in n8n to execute the node standalone. Every file was executed outside n8n against a simulated `$input`/`$()` environment before handover.

| File | Node | Needed | Verified against |
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
| `code/12_decision_engine.js` | Node 12 | Day 4 | four scores · contamination guard · rules R1–R9 · null subscores · **its test block doubles as the Day-4 hand calculation** |
| `code/18_generate_report.js` | Node 18 | Day 5 | all sections · limitations assembled from actual flags · text-branch and fallback variants |
| `fixtures/` + `README.md` | demo pair | Day 5 | run through the real pipeline: poor = 8 findings, score 52; corrected = 0 findings, score 100 |

**Reviewed before Day 1 (`decision_log.md` D-18).** Eight defects found in the Day-0 code; seven fixed and re-tested, one carried to Day 2. Three failed in the *unsafe* direction, including a validator that returned "valid, 0 findings" when its context was unreachable — a broken pipeline that looked like a clean page. Full record with the end-to-end run output: `code/_DAY0_REVIEW.md`.

**Carried into Day 2:** set `attempt: 2` on the repair branch in SUB-A (A4 reads `attempt` from Build Prompt, so it currently always reports 1). Routing is unaffected; this is for log legibility.

**Superseded (deleted 5 Aug):** `code/_e2e_report_poor.md` and `code/_sample_report_preview.md` were dry-run reports produced before n8n existed, so that the presentation had something to show early. Four real reports generated by the live system now sit in `demo_output/`, so the mock-ups were removed rather than left to be mistaken for output.

**Second environment dependency removed:** `require('crypto')` in Node 8 carried the same task-runner risk as cheerio; the node now falls back to a self-contained SHA-256. Neither module can cost build time (`decision_log.md` D-17).

---

## The one live risk — RETIRED (Day 1)

The risk: with `N8N_RUNNERS_ENABLED=true`, Code nodes run in a separate task-runner process where `NODE_FUNCTION_ALLOW_EXTERNAL` might not make `cheerio` reachable. **Resolved Day 1 by direct test (`_cheerio_test` workflow): cheerio and crypto both reachable.** The cheerio engine `05_automated_checks.js` is the production version; `05_automated_checks_regex.js` remains in `code/` as an unused verified fallback. No open environment risks remain.

---

## Build order and gates

From `build_runbook.md` §7. Each day ends with a gate; a failed gate means cutting the next Tier 2 item, not borrowing tomorrow's time.

| Day | Date | Work | Gate |
|---|---|---|---|
| 1 | 1 Aug | environment, cheerio decision, schema, credentials | schema queryable, cheerio decided |
| 2 | 2 Aug | WF-Error; SUB-A happy path + fallback | SUB-A returns valid JSON **and** safe fallback |
| 3 | 3 Aug | WF1 nodes 1–9 (intake, branching, markdown extraction, checks, prescreen) | correct extraction + prescreen on a known page |
| 4 | 4 Aug | nodes 10–14 (SUB-A call, merge, decision engine, DB writes) | scores match hand calculation; re-run duplicates nothing |
| 5 | 5 Aug | nodes 16–19 (review branch, report, statement); Tier 2 if time; demo audit | end-to-end green on the demo page |
| 6 | 4 Aug (early) | **revised:** E1 and E11 executed; E10/E13/E14 already evidenced by the Day-4/5 runs; E7 dropped. SUB-A S4 and S5; S2/S3 already evidenced. Screenshots | E1 and E11 executed and documented; S4 and S5 executed; already-evidenced cases cited to the run that produced them (`build_runbook.md` §7) |
| 7 | 7 Aug | readme finalised, presentation, package, **submit** | package exported, no credentials in the JSONs |

**Contingencies:** Day 4 gate fails → Day 5 drops all Tier 2. Day 5 gate fails → demo runs on pasted text, URL branch documented as designed-not-demonstrated.

---

## Scope tiers (cut order, `build_runbook.md` §0)

- **Tier 1, must ship:** WF1 core path, SUB-A with fallback, rules R1/R2/R4/R7, `audits` + `findings`, report, one demo audit, WF-Error.
- **Tier 2, cut first:** deterministic instrument observations, CCI Part A scoring, `instrument_items` table, R8/R9, before/after demo pair, R3/R5/R6.
- **Tier 3, cut freely:** CCI Parts B–D, `v_audit_summary` demos, statement polish, edge cases E2/E6.

**What was actually cut (4 Aug — full table in `build_runbook.md` §0):** only **Node 15 / `instrument_items` writes**, the `v_audit_summary` demonstrations, and edge cases E2/E6. Everything else in Tier 2 was built because Days 3–5 ran ahead of schedule — including R8/R9 and the before/after pair, which became the strongest evidence in the project. **The tiering itself contained one error:** CCI Parts B–D sat in Tier 3 "cut freely" while being scored by the live system; corrected in the runbook.

Cut items stay in the spec marked "designed, not built in v1 — see D-14". A designed-and-descoped feature reads better in review than a half-built one.

---

## Assignment requirements (Turing College, Case 3)

Evaluation criteria are only three: presented the outcome; explained what was learned or achieved; used AI tools. **The bar is well below what is designed** — the real risk is over-building, not falling short. `readme.md` is a hard requirement.

---

## Non-negotiables to carry into any new chat

1. **AI proposes, deterministic rules dispose.** Nothing on the safety path may depend on the AI being correct.
2. **No overclaiming.** Screening score, not conformance score. "PEMAT-informed", never "PEMAT score". Listed WCAG subset, never "WCAG coverage". The tool produces a report, not accessible content; it measures the material's literacy demand, not anyone's health literacy.
3. **Log every deviation** in `decision_log.md` as it happens — that log is the primary evidence for evaluation criterion 2.
4. **Verify instrument and legal claims against primary sources** before they enter a document.

---

## Update log

- **18 Aug 2026** — this file's top banner had two contradicting instructions to itself — "update at the end of each build day" versus the documentation table's own "done, do not regenerate" — while genuinely nine days stale (still headed "Day 7 SUBSTANTIALLY COMPLETE — 5 August", with the presentation bundle still described as outstanding). Resolved by declaring the file's actual role explicitly (frozen Phase-1 submission snapshot) rather than picking one of the two contradicting instructions arbitrarily; Phase-1-complete and the bundle-upload status confirmed against `A11yAudit_Fahrplan.md` rather than assumed; a pointer to `CLAUDE.md`/`A11yAudit_Fahrplan.md` added for current Phase-2 status instead of duplicating it here (duplicating it would just create a second copy to keep in sync). The Day-0–7 body below this point is untouched — it is evidence of what was submitted, not a status field. Found and fixed during a rigorous review pass on `decision_log.md` D-68 (content-scoping fix), prompted by a direct question about this file's staleness.
- **31 Jul 2026** — docs finalised at v2.1 after full design review (7 fixes); rescoped to 7 days; environment setup begun (`.env` created, compose file located); build not yet started. Decided to front-load all Code-node JavaScript before Day 1 (see Day 0 section).
- **31 Jul 2026 (Day 0, evening)** — all Code-node JavaScript and demo fixtures written, executed outside n8n, and reviewed: 8 defects found in my own code, 7 fixed and re-tested, 1 carried to Day 2. Both check engines pre-written and verified byte-identical, so the Day-1 cheerio decision costs no build time; the `crypto` dependency was removed the same way. Decisions D-16…D-19 added (decision log → v2.2). Project folder tidied: `code/`, `fixtures/`, `meta/`, `.gitignore`, `.env.example`; readme updated. Build not yet started; Day 1 is next.
- **3 Aug 2026 (Days 1 and 2, one sitting)** — **Day 1:** containers up and healthy, env vars verified in-container, n8n owner account created. Cheerio test **PASSED** (cheerio + crypto reachable in the task runner) — the one live risk retired, cheerio engine confirmed as production version. `a11yaudit` database created; schema + addendum applied; 4 tables and 2 views verified. Postgres and Anthropic credentials created and tested. Gate met.
  **Day 2:** `WF-Error` built (Error Trigger → Strip Payload → Insert error_log), one row confirmed in `error_log`; new file `code/WFE_strip_payload.js` written and tested against seven inputs. `SUB-A_AI_Analysis` built — 11 nodes including the linear repair chain and fallback; new file `code/A5_fallback.js` written and tested. **S1 happy path passed** (valid, 0 dropped, 0 missing, all 30 instrument items). **S3 fallback passed** (`analysis_status: "fallback"`, `fallback_reason: "api_error"`, empty findings). Carried defect **D-H closed** via a `Mark Attempt 2` node. Gate met.
  Four entries logged: **D-20** (schedule slip — all Tier 2 cut), **D-21** (n8n does not trigger error workflows for manual executions), **D-22** (model switched to `claude-sonnet-4-6` because extended thinking cannot be disabled in n8n's Anthropic node, which blocked `temperature: 0` and truncated output), **D-23** (Day 2 build notes; S2/S4/S5 not yet run, so the repair branch is built but **not yet demonstrated**).
