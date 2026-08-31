# tools/

Operational scripts for running the system day to day — distinct from
`meta/` (how the project was built) and from `code/` (what runs inside
n8n). Nothing here is needed to build or run the pipeline itself; each
script is a convenience layer over data the pipeline already writes.

| File | What it does |
|---|---|
| `review_dashboard.py` | Renders `v_review_queue` plus the full report text for every audit in it into one static, self-contained HTML file — closes external review Finding 3 ("wer prüfen soll, muss SQL schreiben"), `decision_log.md` D-92. Python 3 standard library only; shells out to `docker exec` against the running Postgres container. Deliberately a one-shot script, not a webhook — the intake form already has no auth (`readme.md` "What it is not"), and a second unauthenticated HTTP surface over audit content would compound that risk, not fix an unrelated one. Usage: `python3 tools/review_dashboard.py [--db a11yaudit_dev] [--out FILE]`, then open the file in a browser. |

Not automated, not scheduled — run on demand, same trust boundary as
before (whoever runs it needs the same DB access hand-written SQL would
have needed; this replaces the SQL, not the access control).
