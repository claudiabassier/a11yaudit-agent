# meta/

Working scaffolding for the AI-assisted build sessions, **not project artefacts**. Kept for transparency about how the project was produced — the capstone is explicitly about applying AI tools, so how that collaboration was set up is part of the record rather than something to hide.

| File | What it is |
|---|---|
| `SYSTEM_PROMPT.md` | the project instructions given to the assistant |
| `GITHUB_SUBMISSION.md` | the GitHub submission manifest and procedure |
| `build_deck.js` | builds `A11yAudit_presentation.pptx` from OOXML rather than hand-editing it; not re-run since D-74's manual edit (it still narrates the pre-D-76 R4-flicker bug as current and points at a screenshots path from a different sandbox session — re-running it today would overwrite D-74's corrections with stale content) |
| `claims_check.sh` | greps the reader-facing docs for unhedged absolute claims about the world outside this repo — advisory, not blocking (`checks.yml`) |
| `check_broken_links.sh` | checks repo-relative paths cited in backticks across the "living" docs actually resolve to a real file — advisory, not blocking (`decision_log.md` D-85) |
| `check_export_sync.py` | compares every mapped node's `jsCode`/`query` in `workflows_export_dev/*.json` against `code/*.js`/`*.sql`, byte-for-byte — hard CI failure, not advisory (`decision_log.md` D-92) |
| `check_sql_comments.sh` | guards against a `{{ }}` n8n expression sitting inside a Postgres node's `--` SQL comment (the D-71 bug class) — hard CI failure, not advisory (`decision_log.md` D-85) |

**Moved to `archive/meta-sprint-scaffolding/` 19 August 2026** (rigorous review, `decision_log.md` D-84, external review Finding 9): `FIRST_MESSAGE.md` (Day-0 kickoff message and build rhythm), `_DAY1_COMMANDS.md` (Day-1 environment commands), `_PASTE_day0_docs_update.md` (Day-0 documentation-update scaffold), `HANDOVER_DAY7.md` (Day-7 kickoff). All four are day-specific sprint scaffolding whose instructions are finished business — none describes anything to do today — as opposed to the four files that stayed here, which are either still-relevant reference (`SYSTEM_PROMPT.md`) or still-active tooling (the other three). Kept, not deleted, for the same reason `decision_log.md` D-39 already gave for the two that were moved here earliest: this project's stated policy is to retain the build-process record rather than erase it.

`HANDOVER_DAY6.md` was removed on 5 August once Day 6 completed. `PROJECT_STATUS.md` (now `archive/PROJECT_STATUS.md`, moved 19 August, D-84) superseded it in turn and was itself a frozen Phase-1 snapshot, not a living doc, from the day it was written — `CLAUDE.md` is what any new session should read first for current status.

Nothing in this folder, or in `archive/`, is needed to build or run the system. Setup is `build_runbook.md` §1.

**Table found missing 3 of 7 real files a second time** (19 August, `decision_log.md` D-93 — the same drift class D-82 fixed once already, this time against `check_broken_links.sh`/`check_export_sync.py`/`check_sql_comments.sh`, all added after D-82's own fix). Caught by a background subagent during a rigorous review, not by any check — this table has no automated freshness guard of its own.
