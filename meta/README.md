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
| `check_decision_log_completeness.sh` | verifies every D-number `decision_log.md`'s own Completeness line claims has exactly one substantive body entry — hard CI failure and a local pre-commit hook, not advisory (`decision_log.md` D-94) |
| `check_doc_schema_numbers.sh` | verifies `readme.md`/`CLAUDE.md`'s table/view count claims match `postgres_schema.sql` — hard CI failure and a local pre-commit hook, not advisory (`decision_log.md` D-95) |
| `hooks/pre-commit` | local pre-commit hook running the two checks above; install with `git config core.hooksPath meta/hooks` (`build_runbook.md` §1.5, `decision_log.md` D-94) |
| `check_meta_registry.sh` | verifies every file in this table's own list actually exists and is wired into `checks.yml` — the check for this table's own drift, after three real recurrences (`decision_log.md` D-96) |

**Moved to `archive/meta-sprint-scaffolding/` 19 August 2026** (rigorous review, `decision_log.md` D-84, external review Finding 9): `FIRST_MESSAGE.md` (Day-0 kickoff message and build rhythm), `_DAY1_COMMANDS.md` (Day-1 environment commands), `_PASTE_day0_docs_update.md` (Day-0 documentation-update scaffold), `HANDOVER_DAY7.md` (Day-7 kickoff). All four are day-specific sprint scaffolding whose instructions are finished business — none describes anything to do today — as opposed to the four files that stayed here, which are either still-relevant reference (`SYSTEM_PROMPT.md`) or still-active tooling (the other three). Kept, not deleted, for the same reason `decision_log.md` D-39 already gave for the two that were moved here earliest: this project's stated policy is to retain the build-process record rather than erase it.

`HANDOVER_DAY6.md` was removed on 5 August once Day 6 completed. `PROJECT_STATUS.md` (now `archive/PROJECT_STATUS.md`, moved 19 August, D-84) superseded it in turn and was itself a frozen Phase-1 snapshot, not a living doc, from the day it was written — `CLAUDE.md` is what any new session should read first for current status.

Nothing in this folder, or in `archive/`, is needed to build or run the system. Setup is `build_runbook.md` §1.

**Table found missing real files a third time** (19 August, in direct response to "Was fehlt noch?" — the same drift class D-82 then D-93 already fixed once each, this time against `check_decision_log_completeness.sh`/`check_doc_schema_numbers.sh`/`hooks/pre-commit`, all added the same session as D-93's own fix and missed by it. Caught by hand this time, not even by a subagent. Three recurrences of the identical drift finally got the deterministic guard the first two arguably should have: `check_meta_registry.sh` (below), run in CI and (for the two `check_*` scripts that matter most) not needed locally — a table this check itself verifies is complete cannot silently drift the way it did three times before (`decision_log.md` D-96).
