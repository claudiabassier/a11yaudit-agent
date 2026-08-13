# Screenshots — proof of execution

16 captures, taken 4–5 August 2026 against the live system. Numbering follows `build_runbook.md` §5.

## Environment and build

| File | What it shows |
|---|---|
| `ss01_containers_and_n8n.png` | `docker compose ps` — both containers `Up 42 hours`, postgres `(healthy)`, port 5678 mapped — beside the n8n Overview showing all four workflows with WF1 / SUB-A / WF-Error all **Published**, and the execution statistics |
| `ss02_schema.png` | `\dt` and `\dv` — 4 tables, 2 views |
| `ss03_credentials_list.png` | the three credentials, including **`Anthropic BROKEN (E11 test)`** retained as evidence of how E11 was performed. Four Postgres nodes share one credential; both AI nodes share one |
| `ss04_wf1_canvas.png` | WF1 canvas, all 20 nodes, names legible — the architecture in one image |
| `ss05_suba_canvas.png` | SUB-A canvas (same image as `ss19`) |
| `ss08_intake_form.png` | the intake form — seven fields, two required, audience default visible |

## Execution and results

| File | What it shows |
|---|---|
| `ss09_execution_green.png` | a green production run, all 20 nodes ticked with item counts — **and the execution list beside it**, showing five green production runs, four red ones from Day 6, and the flask-marked manual runs below. Header names the workflow version |
| `ss10_audit_row.png` | the corrected fixture's database row: understandability 92.9, actionability 100, CCI 88.2 — and `status: needs_review` anyway |
| `ss11_review_queue.png` | `v_review_queue` — the **`BD` finding**: critical, confidence 0.99, PEMAT 4, evidence verified. The exact example the readme opens with, caught and queued |
| `ss13_generated_report.png` | a full generated report: both screening scores, triggered rules, the AI summary, and the findings table with R9 upgrades labelled in place |
| `ss14_scores_all_audits.png` | all audits with scores and triggered rules |
| `ss15_error_log_full.png` | the whole `error_log` chronologically: Day-2 test · E1 as `unknown_error` · E1 as `no_content` after the fix · two genuine runtime failures caught in production |
| `ss16_idempotency.png` | one row per page, `run_count` at 6/3/4 where content was resubmitted; both branches; `ai_fallback_used` true on exactly one row |
| `ss17_e11_fallback.png` | R2 and R7 firing with the AI unreachable, subscores null, `completed_at` empty |
| `ss18_production_vs_manual.png` | production executions (curved-arrow icon) beside flask-marked manual runs — D-21 visible in the interface |
| `ss19_suba_canvas.png` | SUB-A: main path, repair chain, and the `Fallback` branch |

## Not captured, and why

**SS 6 and SS 7** (SUB-A's valid JSON output, and the fallback object in the node panel) were not taken. The same evidence exists in stronger form: `demo_output/06_s4_fabricated_evidence_test.md` shows the validator's actual output against a controlled input, and `ss17` plus `demo_output/05_report_e11_fallback.md` show the fallback producing a complete audit with the AI dead.

**SS 12** is **withdrawn**. It called for `SELECT * FROM instrument_items`, but spec Node 15 was cut (`decision_log.md` D-14, D-20, D-34) and that table is never written to. The per-item reasoning trail lives in the reports instead — see `demo_output/04_report_s5_short.md`.

## Things to say rather than let a reviewer find

- **`ss01` shows "Failure rate 30.8%"** — 13 production executions, 4 failed. All four were deliberate or caught: two were the E1 empty-submission tests, where failing *is* the pass condition, and two were a truncated Code node that the error handler caught in production, classified, and logged with the payload stripped (D-35). On a day spent deliberately breaking things, that number is evidence the error path works.
- **`ss02` shows `instrument_items` as a table** — it exists in the schema and is never written to. Node 15 was cut for time; the documents described it as working until 4 August, when the gap was found (D-34).
- **`ss10` and `ss14` show low combined screening scores** on pages with high instrument subscores. The verbal label is not calibrated for content findings (D-33). Quote the deterministic score.
- **`ss13` line 17 reads "These four numbers"** above a five-row table. The sentence predates the two-score split and was corrected in the code *after* these reports were generated; the reports were deliberately not edited (D-39).
- **`ss17` shows `screening_score: 100`** on a page where nothing was examined — no HTML checks, AI failed. Known defect (D-36), fixed 13 August (D-59) — this screenshot is kept as historical evidence of the bug, unregenerated; a new run today would show "not computable". Safety did not depend on it: the page still routed to a human.

## Capture notes

Every frame was checked for the API key and database password before being added. Nothing in these queries returns either, and the one credential screenshot shows names only.

**Redacted post-capture (10 August):** `ss01`, `ss10`, `ss11`, `ss13`, `ss14`, `ss15`, `ss16`, `ss17` had the local machine's username/hostname visible in the terminal prompt (or, for `ss13`, a VS Code path breadcrumb) — not a secret, but not meant to be public either. Blacked out at the pixel level, not cropped, so the query results and other content each image exists to show are untouched. Full method in `decision_log.md` D-49.
