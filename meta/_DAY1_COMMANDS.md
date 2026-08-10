# Day 1 — copy-paste sheet

Run these in **Terminal**, from `<repo-root>`. Nothing here is typed
from memory: every value that must match exactly is given below to copy.

Start Docker Desktop first (the app — the whale icon must say "running").

## What today actually is, in plain language

Docker runs two programs in sealed boxes ("containers") on your Mac: the
**database** (Postgres, where audits are stored) and **n8n** (the workflow
tool, which you use in a browser at `localhost:5678`). `docker-compose.yml`
is the recipe describing both boxes; `docker compose up -d` builds and starts
them from that recipe, in the background (`-d` = detached, i.e. it does not
take over your Terminal window).

The two boxes can talk to each other over a private network where each is
reachable by its service name — which is why the database's address, seen
from inside n8n, is `postgres` and not `localhost`.

Today has four jobs: start the boxes · find out whether the HTML parser is
reachable inside n8n · create the database and its tables · teach n8n the two
passwords it needs. Nothing is built today; today makes tomorrow possible.

**If everything works, this is about an hour.** The gate is: schema
queryable, cheerio question decided. Nothing else has to happen today.

---

## 1. Bring the containers up

```bash
cd <repo-root>
docker compose up -d
docker compose ps
```

**Expect:** two lines, `a11yaudit-postgres-1` and `a11yaudit-n8n-1`, both
`Up`. Postgres should also say `(healthy)` after ~15 seconds.

If a container is missing or restarting:
```bash
docker compose logs --tail=40 n8n
docker compose logs --tail=40 postgres
```

Confirm the Code-node settings actually reached the container:
```bash
docker compose exec n8n env | grep NODE_FUNCTION
```
**Expect exactly:**
```
NODE_FUNCTION_ALLOW_EXTERNAL=cheerio
NODE_FUNCTION_ALLOW_BUILTIN=crypto
```
If they are missing, the container is running from an older definition:
`docker compose up -d --force-recreate n8n`.

---

## 2. The cheerio test (2 minutes, before anything else)

Open <http://localhost:5678>, create the owner account (store the password),
then: **new workflow → Manual Trigger → Code node** → paste the whole of
`code/_day1_cheerio_test.js` → **Execute step**.

- `cheerio_available: true` → use `code/05_automated_checks.js`.
- error / `false` → **30 minutes maximum**, then switch permanently to
  `code/05_automated_checks_regex.js` and add one line to `decision_log.md`.
  The fallback is verified byte-identical. Do not let this eat the afternoon.

---

## 3. Create the audit database

```bash
docker compose exec postgres psql -U n8n -d n8n -c "CREATE DATABASE a11yaudit;"
```
**Expect:** `CREATE DATABASE`.
(Already exists → `ERROR: database "a11yaudit" already exists` is fine.)

## 4. Apply the schema

```bash
docker compose exec -T postgres psql -U n8n -d a11yaudit < postgres_schema.sql
```
**Expect:** a run of `CREATE TABLE`, `CREATE INDEX`, `CREATE VIEW`,
`CREATE FUNCTION`, `CREATE TRIGGER` lines and **no** `ERROR:` line.

Verified tonight against the real PostgreSQL grammar: 18 statements,
**4 tables** (`audits`, `findings`, `instrument_items`, `error_log`),
**2 views** (`v_review_queue`, `v_audit_summary`), 8 indexes, 1 function,
1 trigger. If psql reports a syntax error, it is an environment problem,
not the file.

## 5. Verify

```bash
docker compose exec postgres psql -U n8n -d a11yaudit -c "\dt"
docker compose exec postgres psql -U n8n -d a11yaudit -c "\dv"
```
**Expect:** the four tables and the two views listed above.

## 6. Optional (Tier 2) — audit-trail columns

Only if steps 1–5 went smoothly. Adds nullable columns for provenance the
node code produces but the v2.0 schema has no home for. Skip without regret
if you are behind; the same information still appears in `report_md`.

```bash
docker compose exec -T postgres psql -U n8n -d a11yaudit < postgres_schema_addendum.sql
```

---

## 7. Credentials in n8n — exact values

**Postgres credential** (n8n → Credentials → New → Postgres):

| Field | Value |
|---|---|
| Host | `postgres` |
| Database | `a11yaudit` |
| User | `n8n` |
| Password | the `POSTGRES_PASSWORD` value from your `.env` |
| Port | `5432` |
| SSL | disabled / allow |

> **Host is `postgres`, never `localhost`.** Inside the n8n container,
> `localhost` means the n8n container itself, so `localhost` produces
> `ECONNREFUSED ::1:5432` — an error that reads like a database fault but is
> a naming fault. If you see `ECONNREFUSED`, check this field first.

Click **Test** → expect "Connection successful".

**AI credential:** Anthropic (or OpenAI) → paste the API key → Test.

---

## Day 1 gate

Schema queryable (steps 5) **and** the cheerio question decided (step 2),
with the decision written into `decision_log.md` if it went to the fallback.
Then update `PROJECT_STATUS.md` and start Day 2.
