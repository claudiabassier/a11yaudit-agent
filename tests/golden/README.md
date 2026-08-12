# Golden tests — regression basis for the Code-node chain

**Version 1.0 · 12 August 2026**

## Why this exists

D-30 measured that the AI is not reproducible at temperature 0 (23 vs. 22
findings, CCI item verdicts flipping, `dropped_unverified` 4 vs. 3 across two
identical runs). A regression test that calls the real Anthropic API would
therefore fail or pass for reasons unrelated to any code change — it could
never distinguish "the AI answered differently today" from "the Decision
Engine broke". The only way to get a fully deterministic regression signal is
to fix the AI's response itself, exactly as `code/_S4_evidence_check_harness.js`
already does for Node A4 alone. This directory generalizes that pattern to
the whole chain.

See `decision_log.md` (D-52) for the full decision record, including the
rejected alternatives.

## What is tested

The fixed chain, for three fixtures already documented in `fixtures/README.md`:

```
02 (Normalize Input) → 05 (Automated Checks, cheerio) → 08 (Hash + Guard)
  → 09 (Safety Prescreen) → A2 (Build Prompt) → [pinned AI response]
  → A4 (Validate Output) → (A5 Fallback, only if A4 rejects)
  → 11 (Merge Findings) → 12 (Decision Engine) → 18 (Generate Report)
```

| Fixture | Pinned response | What it exercises |
|---|---|---|
| `bp-meds-poor.html` | `responses/poor.json` | Happy path — realistic findings with real quotes, plus a deliberate AI/deterministic disagreement on PEMAT_8 (exercises `ai_disagreement`/R6, not just the R9 upgrade path) |
| `bp-meds-good.html` | `responses/good.json` | A fabricated evidence quote alongside a real one — Invariant 4 (evidence verification): the fabricated finding must be silently dropped, no retry, no repair offer |
| `bp-meds-short.html` | `responses/short.json` | A response truncated mid-JSON (reproduces the real D-27 incident) — must be rejected by A4 as `valid:false, api_error:false`, not `api_error:true` |

Every run is checked, per fixture, against a hand-verified `expected/<fixture>.trace.json`
containing the full output of all 9 (or 10, for the truncated fixture) node
stages — not just the final report. A deviation anywhere in the chain is
reported with its exact dotted path.

## Out of scope — deliberately, not by oversight

- **Node 06** (text-paste branch) — all three fixtures are HTML/URL-branch.
- **`Fetch Page`** — fixtures are read from local files, not live HTTP.
- **Postgres nodes** (13/13a/14/14a/17/19) — no database in this harness.
  Node 18's `audit_id` therefore always reads `(pending)`, its own documented
  fallback when `$('Upsert Audit')` is unreachable.
- **`WF-Error`** — none of the three fixtures exercise a thrown error.
- **The real repair-chain re-call** (`AI Analysis (repair)` → `Mark Attempt 2`
  → `Call SUB-A_Validate (2)`, formerly `Validate Output2` before D-55's
  extraction into a shared subworkflow) — there is no second pinned response.
  When A4 rejects
  the pinned response (the `short` fixture), the harness routes straight
  through `A5_fallback.js` instead of re-invoking a repair call. This models
  "repair was attempted and also failed" — which is what actually happened in
  the real D-27 incident this fixture reproduces (same token-ceiling cause on
  both attempts) — but it means the repair pass **itself** is not under test
  here. `A4`'s own repair-routing decision (`valid:false, api_error:false`,
  as opposed to `api_error:true`) *is* under test.

## Running it

No Node.js is required on the host — everything runs in a throwaway Docker
image (`Dockerfile`, not part of `docker-compose.yml`, not the pipeline
containers).

```sh
./tests/golden/run.sh              # run all fixtures, diff against expected/
./tests/golden/run.sh --update     # regenerate expected/*.json — see below
```

Exit code 0 = every fixture matched its expected trace exactly. Exit code 1 =
at least one deviation, printed with its exact dotted path (e.g.
`nodes.12_decision_engine.screening_score [value_mismatch] expected 22, got 48`).

`content_hash` (from Node 08) is printed first for each fixture: if it
matches, the fixture read, Node 02, and the entire cheerio extraction were
byte-identical, and any real deviation lies at Node 05 onward.

## Updating `expected/*.json`

`--update` **overwrites the committed golden files from whatever the code
currently produces.** Never run it and commit blindly. Required steps, same
spirit as the project's existing hand-verification discipline (D-28/D-29/D-33):

1. Run `./tests/golden/run.sh --update`.
2. Hand-check the deterministic numbers against `fixtures/README.md`:
   automated finding counts, deterministic instrument verdicts, safety terms,
   the deterministic screening score.
3. Hand-check the AI-touched numbers against `responses/*.json`: e.g.
   `good` must show `dropped_unverified: 1`; `short` must show
   `ai_fallback_used: true` and `fallback_reason: "validation_failed"`.
4. Only then commit `expected/*.json`.
5. Run `./tests/golden/run.sh` once more (without `--update`) — it must PASS.
   Two identical runs producing identical output is the actual proof of
   determinism; skipping this step just trusts the update instead of
   verifying it.

## Engine drift watchdog (`engine_drift.js`)

Separate from the golden chain above: `05_automated_checks.js` (cheerio,
production) and `05_automated_checks_regex.js` (regex, unused fallback —
see that file's own header) were built as twins (D-17) and are meant to be
interchangeable. `engine_drift.js` runs both engines on all three fixtures
and diffs their outputs **directly against each other** — no AI, no pinning,
nothing to hand-verify against a golden file, because there is nothing here
that should legitimately vary.

```sh
./tests/golden/engine_drift.sh
```

`checks_engine` is excluded from the comparison on purpose — it is supposed
to read `"cheerio"` vs `"regex"`. Everything else should be identical, and
usually is not: see `decision_log.md` D-53 for what this actually found on
12 August (two real, previously undocumented divergences — implicit
`<tbody>` in cheerio's serialized table evidence, and differently worded
PEMAT 17 rationale strings — plus an empirical correction to how far D-25's
carried-forward defect claim actually reaches on these fixtures).

Exit code 1 here means "the two engines currently disagree here", not
automatically "regression" — the regex engine is not in production use, so a
human judges each finding rather than the script silently deciding it does
or doesn't matter.

## Known, deliberate limitations of the harness itself

- **The `JSON.parse(JSON.stringify(...))` round-trip after every node**
  (`lib/shim.js`) means the harness cannot distinguish "a key is missing"
  from "a key is present but `undefined`" — e.g. Node 11 sets
  `analysis: undefined` on its own output, and that key simply disappears
  before anything downstream (including this harness) ever sees it. This is
  not a shortcut for convenience: n8n genuinely serializes items between
  nodes in a real execution, so the round-trip matches production behaviour
  rather than diverging from it.
- **Requires `require` to be passed explicitly into the executed node code**
  (`lib/shim.js`, third argument to `new Function`). `new Function(...)`
  never closes over its enclosing module's scope, and `require` is a local
  parameter of Node's CommonJS wrapper, not a global — a node file that calls
  `require('cheerio')` or `require('crypto')` would otherwise see a bare
  `ReferenceError`, misreported by those files' own try/catch as "not
  reachable". `node -e` scripts don't hit this (Node puts `require` on the
  global object as a REPL convenience), which is why this was found only
  once the chain was assembled into real module files — recorded in
  `decision_log.md` D-52 as a genuine dead end, not glossed over.
- **Array comparisons in `lib/diff.js` are index-exact, not set-based.** The
  chain applies stable sorts at several points; this is deliberate, so a
  sort-stability regression is caught rather than hidden by order-tolerant
  comparison.
