# A11yAudit - Build Runbook

**Version 2.2 · 4 August 2026** · Reproducible build, test and evidence-capture procedure.
Each step lists what to do, how to verify it worked, and **[SCREENSHOT n]** where to capture proof for the submission.

**Build window: 7 days - submit 7 August** (to receive STL review before platform access ends 13 August). Schedule in §7.

**Changelog** - v2.2 (4 Aug): §0 records what was actually cut, and corrects the tiering error that placed CCI Parts B–D in "cut without hesitation" while they were being scored · §5 SCREENSHOT 12 withdrawn (Node 15 cut, `instrument_items` empty) · §7 actual dates added against planned, and the Day-6 gate revised with its reason. v2.1: initial runbook for the 7-day window.

---

## 0. Scope tiers - the pre-committed cut order (decision D-14)

When behind schedule, cut scope in this order. **Never cut Tier 1, tests, or documentation.**

| Tier | Contains | Status |
|---|---|---|
| **1 - Core thesis (non-negotiable)** | WF1 core path (intake → checks → prescreen → SUB-A → decision engine → Postgres → report) · SUB-A with validation, one repair attempt, fallback · rules R1/R2/R4/R7 · `audits` + `findings` tables · one demo audit · WF-Error | must ship |
| **2 - Depth (cut first if behind)** | deterministic instrument observations (Node 5b) · CCI Part A scoring · `instrument_items` table + Node 15 · rules R8/R9 · before/after demo pair · rules R3/R5/R6 | cut individually, in this order from the right |
| **3 - Polish (cut without hesitation)** | ~~CCI Parts B–D~~ *(see below - built, not cut)* · `v_audit_summary` demonstrations · statement-draft refinements · E2/E6 edge cases | nice to have |

If a Tier 2 item is cut, the docs stay honest automatically: the spec marks the item "designed, not built in v1 - see D-14" instead of deleting it. A designed-but-descoped feature with a stated reason reads far better in review than a half-built one.

### What was actually cut, and what was not (updated 4 August)

| Item | Tier as planned | Actual outcome |
|---|---|---|
| `instrument_items` table + **Node 15** | 2 | **Cut, as planned (D-20).** The table exists in the schema and is never written to. Per-item verdicts appear in the report only. |
| Deterministic instrument observations (Node 5b) | 2 | **Built.** 8 deterministic instrument items are produced by `05_automated_checks.js`. |
| CCI Part A scoring | 2 | **Built.** |
| Rules R8 / R9 | 2 | **Built and firing** - both appear in `triggered_rules` on the demo runs. |
| Before/after demo pair | 2 | **Built.** This became the strongest single piece of evidence (D-33), so cutting it would have been a mistake. |
| Rules R3 / R5 / R6 | 2 | **Built.** |
| **CCI Parts B–D** | 3 | **Built, not cut - this tier assignment was wrong.** Parts B–D are scored by the live system. Listing them as "cut without hesitation" understated what the tool does and would have misled anyone reading the runbook to predict the output. |
| `v_audit_summary` demonstrations | 3 | **Cut.** The view exists; no cross-audit demonstration was run, and the per-item half of it depends on Node 15 anyway. |
| E2 / E6 edge cases | 3 | **Cut.** |

**What this says about the cut order, honestly:** most of Tier 2 survived because Days 3–5 ran faster than planned, not because the cut order was overridden under pressure. The one real error was in the tiering itself - CCI Parts B–D were classified as disposable polish when they are part of the instrument-informed scoring the project is built around. The pre-committed cut order did its job; the item that needed correcting was a misclassification made while writing it, which is exactly the kind of thing a written cut order makes visible.

---

## 1. Environment

### 1.1 Bring up the stack
```bash
docker compose up -d
docker compose ps          # expect n8n + postgres, both "running"
```
Required n8n container environment:
```
N8N_ENCRYPTION_KEY=<from .env>
NODE_FUNCTION_ALLOW_EXTERNAL=cheerio
GENERIC_TIMEZONE=Europe/Berlin
N8N_DIAGNOSTICS_ENABLED=false
```
> `NODE_FUNCTION_ALLOW_EXTERNAL=cheerio` is required by the Automated Checks node. Without it that node throws `Cannot find module 'cheerio'`. Restart the container after adding it.

**Verify:** `http://localhost:5678` loads; owner account created.
**[SCREENSHOT 1]** - `docker compose ps` output plus the n8n home screen.

### 1.2 Apply the database schema
```bash
docker compose exec -T postgres psql -U <user> -d <db> < postgres_schema.sql
docker compose exec -T postgres psql -U <user> -d <db> < postgres_schema_addendum.sql
docker compose exec postgres psql -U <user> -d <db> -c "\dt"
docker compose exec postgres psql -U <user> -d <db> -c "\dv"
```
**This runbook did not mention `postgres_schema_addendum.sql` at all until this line (found in the rigorous review, `decision_log.md` D-82) — apply it. It is not optional despite its own header saying so.** Written 31 July as a skippable Tier-2 nicety, it stopped being safe to skip on 4 August once `code/13_upsert_audit.sql` and `code/14_insert_findings.sql` started naming its columns directly in their fixed `INSERT` column lists. Skip it and the very first "Upsert Audit" write throws `column "dropped_unverified" of relation "audits" does not exist` — the pipeline fails outright, not degrades.
**Verify:** the frozen v1 submission's `postgres_schema.sql` produces 4 tables (`audits`, `findings`, `instrument_items`, `error_log`), 2 views (`v_review_queue`, `v_audit_summary`). The current `postgres_schema.sql` (Phase 2, `audit_runs` added by D-63, `v_pipeline_health` added by D-83) produces 5 tables - `audit_runs` alongside the four above - and 3 views.
**[SCREENSHOT 2]** - `\dt` and `\dv` output.

### 1.3 Credentials in n8n
Create: **Postgres** credential (host `postgres`, i.e. the compose service name - *not* `localhost`, which would resolve inside the n8n container to itself) and the **Anthropic API** credential (the model is fixed to `claude-sonnet-4-6` - see D-22).
**Verify:** Postgres credential → "Test connection" succeeds.
**[SCREENSHOT 3]** - successful connection test (redact any key).

**Not part of the frozen v1 submission — a Phase 2 addition this section never covered (found in the rigorous review, `decision_log.md` D-82):** `postgres_app_role.sql` creates `a11yaudit_app`, a least-privilege role scoped to exactly the statements each audit table needs, replacing the superuser `n8n` role the credential above uses by default. Apply it (after §1.2, since it grants against tables that must already exist), create a **second** Postgres credential in n8n using it, and re-point Nodes 13/13b/14/15/17/19 to that credential rather than the first one — see the file's own header for the full four-step sequence. Verified in production use since D-66 (17 August); a setup following only the steps above ends up on the broader, original role instead.

---

## 2. Build order

Build and test bottom-up so each layer is proven before the next depends on it.

| Order | Component | Done when |
|---|---|---|
| 1 | WF-Error | a deliberately failing test workflow writes one row to `error_log` |
| 2 | SUB-A | returns schema-valid JSON for good input **and** the fallback object for forced failures |
| 3 | WF1 Nodes 1–8 (intake, branching, checks) | `content_text` and `automated_findings` correct for a known page |
| 4 | WF1 Node 9 (safety prescreen) | correct `safety_terms_found` on a dosing page |
| 5 | WF1 Nodes 10–12 (SUB-A call, merge, decision engine) | scores and `triggered_rules` correct by hand-calculation |
| 6 | WF1 Nodes 13–15 (Postgres writes) | rows in all three tables; re-run does not duplicate |
| 7 | WF1 Nodes 16–19 (review branch, report, statement) | report renders; `needs_review` path works |

**[SCREENSHOT 4]** - WF1 canvas, full workflow.
**[SCREENSHOT 5]** - SUB-A canvas.

---

## 3. Testing SUB-A in isolation

Run SUB-A directly with pinned input data (n8n: "Edit Output" on the trigger node) before wiring it into WF1.

| Test | Input | Expected |
|---|---|---|
| S1 happy path | clean patient text, ~400 words | `analysis_status: "ok"`, valid schema, ≥1 instrument item |
| S2 malformed AI output | temporarily change the prompt to request prose | validation fails → retry → fallback |
| S3 API failure | invalid API credential | `Continue On Fail` → fallback with `api_error` |
| S4 fabricated evidence | prompt the model to invent a quote | finding dropped by the substring check |
| S5 very short material | 2 short paragraphs | PEMAT 8/9/11 → `not_applicable` |
| S6 no numbers | text without figures | PEMAT 6 and CCI 15–17 → `not_applicable` |

**[SCREENSHOT 6]** - S1 valid JSON output.
**[SCREENSHOT 7]** - S2 or S3 producing the fallback object (proof that the safe path works).

---

## 4. Demo audit (the submission centrepiece)

Use **anonymised or self-authored** health content only - never real patient data, never a real clinic's page without permission.

1. **Prepare a deliberately poor sample page** - the specification's worked example (anticoagulation discharge text) or an equivalent. It should contain: an undefined dosing abbreviation, unexplained jargon, a vague escalation instruction, a missing `alt`, and a heading-level skip.
2. Run WF1 against it.
3. **Hand-calculate** the expected score and the expected `triggered_rules` *before* looking at the output; compare. Record any mismatch and its cause.
4. Prepare a **corrected version** of the same page and run it again - the score should rise and R9 should no longer fire. A before/after pair is far more persuasive in a presentation than a single result.

**[SCREENSHOT 8]** - form submission.
**[SCREENSHOT 9]** - successful WF1 execution, all nodes green.
**[SCREENSHOT 10]** - `SELECT * FROM audits` row.
**[SCREENSHOT 11]** - `SELECT * FROM v_review_queue`.
**[SCREENSHOT 12]** - ~~`SELECT * FROM instrument_items WHERE audit_id = …`~~ **WITHDRAWN.** Node 15 was cut (D-20), so this table is empty and the query would show nothing. **Replacement:** the per-item verdict table inside the generated report (`demo_output/02_report_poor.md`), which carries the same reasoning trail in the report rather than in the database.
**[SCREENSHOT 13]** - generated report.
**[SCREENSHOT 14]** - before/after comparison of the two runs.

---

## 5. Edge-case test matrix

Run every row; record actual behaviour. **A test that fails is not a problem for the submission - an untested edge case is.**

| # | Case | Input | Expected |
|---|---|---|---|
| E1 | no content | both fields empty | `Stop and Error` → `error_log` row `no_content` |
| E2 | both inputs | URL + text | URL used, note recorded |
| E3 | malformed URL | `htp://x` | `bad_url` |
| E4 | unreachable host | `https://does-not-exist.invalid` | `fetch_error`, logged |
| E5 | 404 | any 404 URL | `fetch_error`, logged |
| E6 | non-HTML | a PDF URL | handled or clean error - document which |
| E7 | too short | 50 characters | `insufficient_content` |
| E8 | too long | >30 000 chars | truncated, `content_truncated = true`, stated in report |
| E9 | JS-rendered page | any SPA | low `word_count` - document the limitation visibly |
| E10 | duplicate submission | same content twice | one row, `run_count = 2`, no duplicate findings |
| E11 | AI unreachable | break credential | fallback, R2 fires, `status = needs_review` |
| E12 | Postgres down | stop the container | error logged. **Note (review fix #6):** n8n has no transaction spanning Nodes 13–15, so a partial write (audit row without findings) is possible and acceptable - it is detectable because `status` remains `'in_progress'`. Do not claim atomicity. |
| E13 | safety content | dosing text | R7 and R9 fire, finding forced to `critical` |
| E14 | clean page | well-written sample | high scores, no review required - **prove it can also pass** |

**[SCREENSHOT 15]** - `SELECT * FROM error_log` after the failure cases.
**[SCREENSHOT 16]** - E10 showing `run_count = 2` with unchanged finding count.

> E14 matters: a tool that flags everything is useless. Showing a page that passes demonstrates discrimination, not just detection.

---

## 6. Export and submission package

```bash
# in n8n: each workflow → ⋯ → Download
WF1_Audit_Intake.json
SUB-A_AI_Analysis.json
WF-Error.json
```

Package contents:

| File | Content |
|---|---|
| `WF1_Audit_Intake.json`, `SUB-A_AI_Analysis.json`, `WF-Error.json` | exported workflows |
| `postgres_schema.sql` | database schema |
| `workflow_spec.md` | node-by-node technical documentation |
| `knowledge_base.md` | verified instrument items, scope, safety terms, sources |
| `decision_log.md` | design decisions, corrections, open questions |
| `build_runbook.md` | this file - reproducible setup and test evidence |
| `capstone_proposal.md` | one-page proposal |
| `demo_audit_report.md` | generated report from the demo run |
| `screenshots/` | 01–16 as listed above |
| `presentation.md` | STL presentation script |

**Before exporting:** confirm no credential values or API keys appear in the workflow JSON (n8n stores credentials by reference, but check any hard-coded headers or Code nodes).

---

## 7. Schedule - 7 build days, submit 7 August

Each day ends with a **gate**: if the gate fails, cut the next Tier 2 item (per §0) rather than borrowing from the next day.

**Planned dates versus actual.** Days 0–5 ran ahead of this table: Day 0 on 31 July, Days 1–2 both on 3 August, and Days 3, 4 and 5 all on 4 August. The Day-6 work therefore began on **4 August**, two days early. The day numbering below is kept as written; only the dates moved.

| Day | Planned date | Actual | Work | Gate at end of day |
|---|---|---|---|---|
| 0 | - | 31 Jul | All Code-node JavaScript pre-written, tested outside n8n and reviewed (D-16…D-19) | 11 files delivered; 8 defects found and 7 fixed before Day 1 |
| 1 | Fri 1 Aug | 3 Aug | §1: stack up, schema applied, credentials tested. **Verify cheerio in a Code node immediately**; if it fails under the task-runner architecture, switch to the regex fallback now, not later (SS 1–3) | schema queryable, cheerio decision made - **MET**, cheerio passed |
| 2 | Sat 2 Aug | 3 Aug | WF-Error, then SUB-A happy path + fallback (S1, S3) (SS 6–7) | SUB-A returns valid JSON and safe fallback - **MET** |
| 3 | Sun 3 Aug | 4 Aug | WF1 Nodes 1–9: intake, branching, extraction-as-markdown, automated checks, safety prescreen | correct `content_text` + prescreen on a known page - **MET** |
| 4 | Mon 4 Aug | 4 Aug | Nodes 10–14: SUB-A call, merge, decision engine, `audits`/`findings` writes. Hand-calculate one score and compare | scores + `triggered_rules` match hand calculation; re-run duplicates nothing (E10) - **MET** |
| 5 | Tue 5 Aug | 4 Aug | Nodes 16–19: review branch, report, statement. Tier 2 as time allows (instrument items, R8/R9). Demo audit run (SS 8–13) | end-to-end green on the demo page - **MET**; Tier 2 not attempted, Node 15 stays cut |
| 6 | Wed 6 Aug | 4 Aug | **Revised set (see below):** edge cases E1 and E11 executed; E10, E13, E14 already evidenced by the Day-4/5 runs. SUB-A tests S4 and S5; S2 and S3 already evidenced. Screenshots (SS 14–16) | *revised gate:* **E1 and E11 executed and documented with actual behaviour; S4 and S5 executed; the three already-evidenced cases cited to the runs that produced them** |
| 7 | Thu 7 Aug | 7 Aug | Docs sync (spec updated to what was actually built, decision log entries for every deviation), presentation script, package, **submit** | package exported, no credentials in JSONs |

> **Why the Day-6 gate was revised (recorded here rather than quietly met).** The original gate read "all six edge cases documented with actual behaviour" over E1, E7, E10, E11, E13, E14. Three of those were produced as a by-product of earlier days: **E10** (idempotent re-run, `run_count` incremented with one row) on Day 4, and **E13** (safety content forces R7/R9) and **E14** (a clean page can also pass) by the Day-5 before/after pair. Re-running them would generate no new information and would consume AI calls. **E7 was dropped**, not deferred. The revised gate counts a case as evidenced only where a named execution produced it, and E14 remains **half met** - see D-33: the corrected page passes on every deterministic measure but the combined score's verbal label still reads "severe issues found", because those bands are not calibrated for content findings.

Contingency: if Day 4's gate fails, Day 5 sacrifices all Tier 2 work. If Day 5's gate fails, the demo uses pasted text instead of URL fetch (text branch is simpler) and the URL branch is documented as designed-not-demonstrated. The submission with an honest cut beats a submission with a broken demo. *Neither contingency was needed.*

Dropped relative to the 13-day plan: before/after demo pair (Tier 2), E2/E3/E4/E5/E6/E8/E9/E12 as *executed* tests - they remain in §5 as designed cases with expected behaviour, marked "not executed, reasoned expectation only".

> Keep `decision_log.md` open while building. Every time something does not work as designed and you change the design, add an entry. Those entries are the most convincing part of the submission, because they show engineering judgment under real constraints rather than a plan that was never tested.
