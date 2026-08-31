# meta/

Working scaffolding for the AI-assisted build sessions, **not project artefacts**. Kept for transparency about how the project was produced — the capstone is explicitly about applying AI tools, so how that collaboration was set up is part of the record rather than something to hide.

| File | What it is |
|---|---|
| `SYSTEM_PROMPT.md` | the project instructions given to the assistant |
| `FIRST_MESSAGE.md` | the Day-0 kickoff message and the daily build rhythm |
| `_DAY1_COMMANDS.md` | the Day-1 environment commands, kept as a record of the setup sequence |
| `_PASTE_day0_docs_update.md` | the Day-0 documentation-update scaffold |
| `HANDOVER_DAY7.md` | **paste-ready kickoff for the Day-7 session** (presentation script, packaging, submission) — includes the verified numbers, the claims that must not be made, and the known defects to raise proactively |
| `GITHUB_SUBMISSION.md` | the GitHub submission manifest and procedure |
| `build_deck.js` | builds `A11yAudit_presentation.pptx` from OOXML rather than hand-editing it; not re-run since D-74's manual edit (it still narrates the pre-D-76 R4-flicker bug as current and points at a screenshots path from a different sandbox session — re-running it today would overwrite D-74's corrections with stale content) |
| `claims_check.sh` | greps the reader-facing docs for unhedged absolute claims about the world outside this repo |

The last two of the original five are obsolete as instructions — the work they describe is finished. They are retained because `decision_log.md` D-39 records that they were found sitting in the project root and moved here; deleting them would erase that trail.

`HANDOVER_DAY6.md` was removed on 5 August once Day 6 completed. `PROJECT_STATUS.md` supersedes it and is the file any new session should read first.

Nothing in this folder is needed to build or run the system. Setup is `build_runbook.md` §1.
