# Where the results are after you submit the form

**The form is not where you see results.** It replies *"Form Submitted"* the moment it receives your input, before the workflow has run at all. That is a known limitation, written up in `readme.md` under *What it is not*. A submission that fails at the very first node still shows you a success message.

So after pressing submit, you have to go and look. Three places, in the order you would use them live.

---

## 1. Did it run? n8n Executions

**Browser: `http://localhost:5678` → left sidebar → Executions**

The newest run is at the top. Green tick means it completed, red means it failed.

Click the run to open the canvas with the actual data. Click any node to see what went in and what came out. Useful ones:

| Node | What you see in it |
|---|---|
| `Safety Prescreen` | `safety_terms_found` and `safety_context`, proof the terms were caught before the AI |
| `SUB-A` | the AI's validated output, and how many findings were dropped |
| `Decision Engine` | all four scores and the list of rules that fired |

**This is the best thing to show live**, because it proves the ordering: you can click the prescreen node and see it produced its answer before the AI node ran at all.

---

## 2. The report: in the database, not a file

Node 18 writes the whole report into the `audits` table, in a column called **`report_md`**. It is markdown text. There is no file on disk.

To read it, in Terminal:

```
docker compose exec -T postgres psql -U n8n -d a11yaudit -c "SELECT report_md FROM audits ORDER BY created_at DESC LIMIT 1;"
```

That prints the most recent report. It is long. To get it into a file you can open properly:

```
docker compose exec -T postgres psql -U n8n -d a11yaudit -t -A -c "SELECT report_md FROM audits ORDER BY created_at DESC LIMIT 1;" > ~/latest_report.md
```

Then open `latest_report.md` from your home folder.

The draft accessibility statement is in the same row, in **`statement_draft`**.

---

## 3. The headline numbers: one query

This is the one to have ready. It gives you the whole result in a single line:

```
docker compose exec -T postgres psql -U n8n -d a11yaudit -c "SELECT page_title, screening_score, pemat_understandability, pemat_actionability, cci_score, safety_terms_found, triggered_rules, human_review_required, status FROM audits ORDER BY created_at DESC LIMIT 1;"
```

**Read it left to right:** the combined score, the three instrument scores, which safety terms were caught, which rules fired, and whether a human has to look.

For the review queue instead:

```
docker compose exec -T postgres psql -U n8n -d a11yaudit -c "SELECT * FROM v_review_queue LIMIT 10;"
```

That is the view in the screenshot on slide 2, showing the `BD` finding.

---

> **If psql says the database does not exist**, check the name. `docker-compose.yml` creates a database called `n8n`; the project database `a11yaudit` was created separately on Day 1 and is the one the workflow writes to. `-U n8n -d a11yaudit` is correct.

---

## Two things that will catch you out

**The deterministic screening score is not on the `audits` row you just queried.** It is calculated, printed into `report_md`, and not stored on `audits` itself. So the `screening_score` you see in the query above is the **combined** one, which includes AI findings and moves between runs. The deterministic number *is* stored, but on a different table — `audit_runs` (one row per execution, added `decision_log.md` D-63) — specifically so repeat runs of the same content can be compared; query that table, or read the report text, for the deterministic figure.

**Re-submitting the same content will not create a new row.** It increments `run_count` on the existing one, because the system is idempotent. If you demo the same text twice and wonder why nothing new appeared, that is why, and it is working correctly.

---

## Have this ready before the presentation

Open a Terminal window, run it once, and leave the window open:

```
cd <repo-root>
```

Then the headline query above is one paste away. Do not go hunting for commands in front of a reviewer.
