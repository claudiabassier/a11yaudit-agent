# A11yAudit — Decision Log Highlights

`decision_log.md` is 93 entries, ~1,550 lines, and the project's actual
source of truth — every claim in `readme.md`/`CLAUDE.md` traces back to
an entry there, with the evidence that backs it. It is also too long
for anyone to read end to end, which means its real value — that this
project's engineering judgment is checkable, not just claimed — never
reaches a reader who has five minutes, not fifty.

**This file does not replace it, summarize it away, or edit it.** It is
a curated index into ten themes worth reading first, each a few
sentences, each pointing at the exact `decision_log.md` entry (search
for `## D-XX`) that has the real evidence — timestamps, execution IDs,
exact error strings, what was checked and how. Nothing below is a
substitute for reading the entry it points to before repeating its
claim anywhere serious.

## If you only read five entries: D-62, D-80, D-89, D-92, D-93

---

**1. The core safety mechanism actually discards AI output, measurably — it doesn't just claim to (D-62, and an unprompted independent confirmation woven through D-79).**
Evidence-verification rejects any AI-proposed finding whose quoted evidence doesn't appear verbatim in the source text. Not a design intention — a real behavior an external reviewer, running the project fresh on their own machine with their own Anthropic key, independently reproduced without being told to look for it: 37 findings proposed, 8 discarded, 29 written. Prompt-injection mitigation (`<material>` tags plus an explicit system-prompt instruction) was built the same way — adversarially tested with a harness that simulates a perfect, unflagged AI response and confirms `human_review_required` still fires anyway.

**2. A least-privilege credential regression was found and fixed twice, in two unrelated sessions, both times by checking live grants directly instead of trusting a prior "fixed" status (D-51, D-89).**
Both times the failure mode was identical: a credential switch made in n8n's editor that never actually took effect on the running canvas, while every document said it had. The lesson that stuck: "changed in the editor" and "verified under the actual restricted grants with a real write" are different claims, and only the second one is evidence.

**3. One architecture discovery explains most of the "published code drifted from repo code" bugs that recur across this log (D-80).**
`workflow_entity.nodes` in n8n's own database is only ever the editor's current draft. What actually executes is whatever `workflow_history` row `workflow_entity.activeVersionId` points to — a separate, append-only table. Direct-Postgres fixes made before this was understood (several, across multiple entries) silently changed only what the editor displayed, never what ran. Once found, every later live fix used the corrected two-part write (new history row + repointed `activeVersionId`) — and this project also names the further mystery it ran into on top of that: `n8n export:workflow`, the *official* CLI, returns unexplained stale content even after this fix, root cause never found, worked around rather than hidden (D-89).

**4. Nine findings from an independent external review, each closed against the reviewer's own original wording, re-checked from scratch every time a "fixed" claim was challenged (D-79 through D-92).**
Worth reading for the pattern, not just the findings: several early "fixed" statuses were found to be partial or wrong on the next direct re-check — a `v_pipeline_health` view that answered a different question than the one asked (D-83, actually closed at D-92); a CI job that imported a stale, architecturally outdated workflow export, repeating the exact blind spot it was built to catch (D-89). Each time, the fix was to re-verify against the reviewer's exact text, not to trust the earlier "done."

**5. CI went from zero to six real jobs, including an end-to-end test that runs an actual n8n instance, not just isolated code (D-83/D-85/D-87).**
The `n8n-e2e` job imports the real exported workflows into a real headless n8n container, submits a real multipart form, and asserts the resulting database row — deliberately with an invalid AI credential, forcing the documented fallback path rather than spending API budget on every push. Two genuine race conditions were found on GitHub's actual Linux runner, not reasoned about in the abstract: `/healthz` answering before workflow triggers finish registering (D-90), and `/healthz` answering before the server's own database migrations finish (D-91) — both fixed by reading the real server log line that actually signals readiness, both confirmed by watching the fixed run complete on GitHub's own infrastructure.

**6. The one accuracy number this project has, and the honest boundary around it (D-67).**
74.5% combined agreement (79.5% adjusted) between the AI's verdicts and a blind hand-scoring of two fixtures. This is real, and it is not a validated multi-rater study against independent human auditors — the project has never claimed it is one (see D-79's own framing: that study "was never in scope for any single finding to close"), and that gap remains the single biggest unresolved limitation as of this writing.

**7. A platform wall, named rather than worked around (D-86).**
Branch protection — making the CI checks a hard merge gate — was attempted directly via GitHub's REST API and rejected with a flat `403: upgrade or make the repo public`, not the softer "won't be enforced" the UI implies. No workaround exists on a private free-tier repo; deferred to whenever the repo goes public, recorded as a real, current gap rather than quietly dropped.

**8. Personal content was purged from git history, not just from the current file tree (D-78).**
Content sitting in plain history since the very first commit, missed by an earlier content sweep that only checked current files. Removed with `git filter-repo --replace-text` across all three branches, verified by a full-history grep afterward, not assumed clean because the current tree looked clean.

**9. This log's own discipline broke for eleven entries in a row, and the fix is itself documented rather than quietly patched (D-93, D-94).**
Every commit from D-82 through D-92 updated this file's changelog line but never appended the full entry its own stated format requires — caught only by a fifth rigorous review explicitly asked for, not by anything automatic. Reconstructed transparently from the commit history rather than hidden. The follow-up (D-94) applies this project's own stated principle — "don't rely on judgment where a deterministic check will do" — to the log itself: a CI check plus a local pre-commit hook now fail the moment a `D-XX:` commit lands without a matching `## D-XX` section, so the next lapse gets caught at commit time, not three reviews later.

**10. The recurring pattern worth naming honestly, not just the individual fixes (D-70, D-79, D-89, and structurally why `n8n-e2e` exists at all).**
"Code drifts apart across `code/`, the live n8n canvas, and the exported JSON" recurs three separate times in this log, each time independently discovered, each time fixed. That is not fully resolved — it is a structural property of n8n's own multi-source-of-truth design (editor draft vs. active version vs. CLI export, three different values for the same node observed simultaneously in D-89), mitigated by better detection (`meta/check_export_sync.py`) rather than eliminated by architecture. Worth having this answer ready rather than discovering it live if asked "why does this keep happening."

---

*Curated 19 August 2026, `decision_log.md` D-94. Ten themes, chosen for what a reviewer with five minutes should see first — not the ten most recent entries, not a representative sample of all 93. Read `decision_log.md` itself for anything you intend to rely on or repeat.*
