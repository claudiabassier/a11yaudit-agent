# Paste this into the new chat (Day 7 — presentation script)

---

Day 7 of the A11yAudit build. The build is finished. Today's only substantive task is the **presentation script**, then packaging and submission.

**Read `PROJECT_STATUS.md` in `<repo-root>` first.** Request access to `<repo-root>` if you don't have it. Any project-knowledge copies of my documents are stale — **`<repo-root>` is the single source of truth.** Don't regenerate documents; edit in place and keep version headers current.

## Where things stand

Days 0–6 complete, every gate met. Decision log at **D-39** (v2.6), verified complete with no gaps. All documentation synchronised with the as-built system. Workflow exports re-exported and verified by content on 5 August. Package is secret-clean.

**What exists:** self-hosted n8n + Postgres 16 in Docker. `WF1 - Audit Intake` (20 nodes), `SUB-A_AI_Analysis` (12), `WF-Error` (3), all published, exports in `workflows_export/`. Model `claude-sonnet-4-6`, temperature 0, max_tokens 16000, pinned by ID.

## The assignment

Turing College AI Capstone, **Case 3** (create automation / build something useful for your work environment). Presented live to a Senior Team Lead.

**Only three evaluation criteria:**

1. The learner presented their final outcome (documentation or showcase).
2. The learner understood and explained what they learned or achieved.
3. The learner used AI tools or applied AI in their chosen case.

**The bar is well below what was built.** The risk today is over-preparing, not under-delivering. `readme.md` is the required deliverable and is finished.

**Deadline: submit 7 August.** Platform access ends 13 August.

## What I need from you today

A presentation script. I have not decided the length or format yet — ask me before drafting. Then help me package and submit.

## Verified numbers — use these, do not invent or round differently

**The demo pair (`demo_output/01_before_after_comparison.md`):**

| | poor page | corrected twin |
|---|---|---|
| automated findings | 8 | 0 |
| **deterministic screening score** | **52** | **100** |
| deterministic instrument items | 5 of 8 fail | 8 of 8 pass |
| PEMAT-informed understandability | 28.6 | 92.9 |
| PEMAT-informed actionability | 33.3 | 100 |
| CCI-informed | 22.2 | 88.2 |
| combined screening score | 0 | 38 |
| routed to human review | yes | **yes** |

The 52 → 100 was **predicted in writing on 31 July**, before the code paths that produce it existed.

**Day-6 failure-path tests:**

- **E1** (empty submission): refused at the first node in **46 ms**, nothing written, error logged.
- **E11** (AI unreachable, invalid key): audit **completed in 732 ms**, `ai_fallback_used`, rules `{R2,R7}`, `needs_review`, `completed_at` null.
- **S5** (very short material): PEMAT 8/9/11 correctly `not_applicable`; deterministic 100 against combined 42.
- **S4** (fabricated evidence): injected fabricated `critical` finding dropped, legitimate one kept, whitespace-tolerant.

**Measured AI variance:** the same page run three times at temperature 0 scored **42 / 72 / 65**, and rule R4 fired, didn't fire, then fired again. The deterministic score stayed at 100 all three times and the page routed to a human every time.

## Claims I must not make

- **No conformance claim.** A screening score over a listed WCAG 2.2 subset only.
- **"PEMAT-informed" / "CCI-informed"**, never "PEMAT score" or "CCI score". It is an unvalidated adaptation of instruments designed for trained human raters assessing complete materials. Neither AHRQ nor CDC endorses this tool.
- **The deterministic layer is reproducible** (verified byte-identical across runs). **The AI layer is not** (D-30, D-37 measured it). Never claim reproducible AI analysis.
- **The combined score's verbal label is not calibrated** for content findings (D-33). Quote the deterministic score as the result.
- **Accuracy of AI findings is unmeasured.** No comparison against expert human auditors was run.
- **Fetch-failure handling is wired but untested.**
- The tool produces **a report, not accessible content**. It measures the material's **literacy demand**, not anyone's health literacy.
- Coverage is a **listed subset**: colour contrast, keyboard operation, focus order, media and JavaScript-rendered content are out of scope.

## Known defects to raise proactively, not hide

These are strengths in review if I raise them first, and damaging if a reviewer finds them.

1. **`screening_score` reads 100 when nothing was examined** (D-36). On the E11 report: pasted text means no HTML checks, AI failure means no AI findings, so zero checks found zero problems. The same report says "not computable" for all three instrument subscores and states all checks were skipped. Documented, deliberately not fixed.
2. **Spec Node 15 was never built** (D-34). The `instrument_items` table exists in the schema and is never written to. Per-item verdicts appear in the reports but are not queryable, so no cross-audit analysis is possible in v1. Correctly cut under D-20; the documents had described it as working until 4 August.
3. **PEMAT and CCI disagree about the same page** (D-37). On short material PEMAT items 8/9 are `not_applicable` per AHRQ while CCI 8/9 still `fail`, because the CDC Index has no short-material exemption. Correct behaviour, but it reads as a contradiction.
4. **R9 makes every jargon finding critical on safety-relevant content** (D-30). "Excipients is unexplained" and "BD is undefined" carry the same severity. Conservative in the intended direction, but state it.
5. **E14 is only half met** (D-33). The corrected page passes every deterministic measure but the combined score still reads "severe issues found".
6. **The generated reports say "These four numbers" above a five-row table** (D-39). Fixed in the code on 5 August, *after* those reports were generated. The reports were deliberately not edited — they are records of runs that happened.

## The strongest material

**The single best moment:** the corrected page scores 100 deterministically, is well written, **and still routes to a human**, because it is still medication content and R7 fires from a deterministic prescreen that runs before the AI. The tool does not trade safety for quality.

**The second:** E11. With the AI completely dead, the system still identified the page as safety-critical and escalated — because the prescreen is regex, not AI.

**The third, and the one that best serves criterion 2:** every Day-6 test passed its stated criteria, and **three defects were found anyway — by reading the output, not by a test failing.** The misclassified error, the score of 100 on an unexamined page, the missing UK emergency numbers. Tests confirm what you thought to specify; they are silent about what you didn't.

## Artefacts to draw on

- `demo_output/README.md` — 10 files numbered in presentation order, with notes on what to say about each
- `screenshots/README.md` — SS 14–19 with a "things to say rather than let a reviewer find" section
- `decision_log.md` — 39 entries; **D-34 to D-39 are the Day-6 record** and the strongest evidence for criterion 2
- `readme.md` — the graded deliverable, finished
- `fixtures/README.md` — the three test pages and their expected results

## How to work with me

I'm a beginner with n8n, Docker and the terminal. One step at a time, tell me what output to expect, wait for me to paste my result. Never send me into open-ended troubleshooting — give a time limit and a fallback. Be concise and direct; cut words that don't change the meaning.

Explain things in plain language — I want to understand, not just copy and paste.

Log any deviation in `decision_log.md` as it happens (next entry is **D-40**). Keep me honest about what has and hasn't actually been demonstrated. Guard the scope: three criteria, and the real risk is over-building before the deadline.
