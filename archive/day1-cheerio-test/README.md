# Day-1 cheerio reachability test — archived

Moved here 19 August 2026 (rigorous review, `decision_log.md` D-84, external
review Finding 9). A one-time, standalone check from the very first hour of
the build — "is `require('cheerio')` reachable inside an n8n Code node under
this container's task-runner architecture" — never part of the audit
pipeline itself (`archive/meta-sprint-scaffolding/_DAY1_COMMANDS.md` §2
pasted `_day1_cheerio_test.js` into a throwaway Manual-Trigger workflow,
ran it once, and moved on; the answer was yes, and it has stayed yes ever
since).

It existed twice in the live repo before this move: `code/_day1_cheerio_test.js`
(the test script itself) and `workflows_export/_cheerio_test.json` (an
export of the same one-off throwaway workflow — never actually imported by
the setup instructions, which tell you to paste the script into a fresh
workflow instead). Both are here now, not deleted, as the historical record
of that check.
