# Day 0 — code review record

**31 July 2026 · reviewed before Day 1 · 11 files, ~1,050 lines**

Method: (1) every node re-read against `workflow_spec.md` v2.1; (2) contract
check node-by-node through the whole chain; (3) adversarial tests aimed at
suspected defects; (4) full end-to-end run of the real pipeline
(02 → 05 → 08 → 09 → A2 → mock AI → A4 → 11 → 12 → 18) on the poor fixture.

**Result: 8 defects found, 7 fixed and re-tested, 1 carried as a build
instruction. No regressions — all earlier test suites re-run green.**

---

## End-to-end run (evidence that the chain fits together)

Poor fixture, realistic AI response including one fabricated quote:

| Stage | Result |
|---|---|
| 05 Automated Checks | 8 findings · 5 of 8 deterministic items fail · 301 words |
| 09 Safety Prescreen | `safety_context: true` (bd, overdose, contraindicat, …) |
| A2 → A4 | 3 AI findings in → **1 dropped as unverifiable**, 2 kept · 25 items marked not_assessed |
| 11 Merge | 10 findings, 38 instrument items, precedence applied |
| 12 Decision Engine | score **29 "severe issues found"** · rules **R1, R4, R7, R8, R9** · `legally_relevant: true` · BD finding upgraded high → critical by R9 |
| 18 Report | `needs_review` · 10.3k-char report + 2.0k statement |

The anti-fabrication check caught the planted quote; R9 fired on regex
evidence alone; the audit routed to human review. Chain behaves as designed.

---

## Defects found

### Fixed

**D-A · A4 returned "valid, 0 findings" when `content_text` was unreachable.**
Severity: **high**. If the Build Prompt node is renamed (likely — n8n node
names are editable text), `$('Build Prompt')` fails, `content_text` is empty,
every evidence check fails, and every finding is silently dropped. Output:
`valid: true`, zero findings — *a broken pipeline that looks like a clean
page*. This is the one failure direction the system must never have.
→ Fixed: empty context now returns `api_error` → fallback → **R2 → mandatory
human audit**.

**D-B · R9 did not upgrade findings the AI tagged only by WCAG criterion.**
Severity: medium (spec compliance). The AI usually reports an undefined
abbreviation as WCAG 3.1.4 without filling `instrument`/`instrument_item`, so
the "forces the finding to critical" half of R9 found nothing to upgrade.
Escalation still happened; the report understated severity.
→ Fixed: match on instrument reference **or** WCAG 3.1.3 / 3.1.4.

**D-C · R3 failed to fire when `confidence` was missing.**
Severity: medium. `NaN < 0.6` is `false` in JavaScript, so a finding with no
confidence value skipped the low-trust rule — failing *not* to escalate.
→ Fixed: missing/non-numeric confidence counts as 0.

**D-D · Long pasted text was classified "very short".**
Severity: medium. Pasted text often has single newlines only; the blank-line
split then yields one paragraph, so a 384-word article was marked very short,
turning PEMAT 8/9/11 into N/A and shrinking the score denominators.
→ Fixed: fall back to single-newline splitting, plus a word guard —
`very_short = paragraphs ≤ 2 AND words ≤ 300` (AHRQ: "two or fewer paragraphs
**and no more than one page**"; the word guard operationalizes the second half).

**D-E · "112" fired on blood-pressure readings.**
Severity: medium (discrimination, not safety). `112/70` is a BP reading, not
an emergency number — exactly the class of false positive that motivated the
v2.1 two-tier rule for German "im".
→ Fixed: emergency numbers moved to a context-gated Tier C (112, 911 count
only within 40 chars of *call / dial / rufen / Notruf / Notfall / emergency…*).
Verified: "112/70 last week" quiet · "call 112 immediately" fires · "112
Teilnehmer" quiet · "im Notfall die 112" fires.

**D-F · The regex engine merged unclosed `<p>` paragraphs.**
Severity: medium (only if cheerio fails). Unclosed `<p>` is common in real
HTML; the pairwise regex swallowed several paragraphs into one — 1 paragraph
where cheerio saw 3, which changes `paragraph_count`, `is_very_short` and the
PEMAT 8 section word counts.
→ Fixed: `<p>` now matched with a lookahead terminator (own close tag or next
block tag); `<p>` inside a container is skipped. Both engines now agree on
sloppy HTML too.

**D-G · Text branch told the AI "already decided: not_assessed".**
Severity: low. All eight deterministic items are `not_assessed` on the text
branch, and the prompt injected them under "do not re-judge" — meaningless
instruction noise. (No score impact: none of those items are in the AI's
judged set.)
→ Fixed: only real verdicts (pass/fail/not_applicable) are injected.

### Not fixed — build instruction

**D-H · `attempt` is always 1.** A4 reads it from Build Prompt, which sets 1,
so the second validation in the repair chain also reports attempt 1. No
functional impact (routing is by `valid`/`api_error`), but the repair is not
distinguishable in logs. **Day 2 action:** in the repair AI node's Code
predecessor — or by pinning a Set node — set `attempt: 2` before the second
Validate. One line, easier done on the canvas than guessed at here.

---

## Known limitations, accepted deliberately

- **Node 11 passes the raw `automated_findings` array through** alongside the
  merged list. Harmless duplication, slightly larger DB payload; removing it
  risks breaking a downstream reference on Day 4. Leave.
- **Regex engine flattens nested lists** and cannot verify
  `figcaption`-to-image association or `<input>`-wrapped-in-`<label>`.
  Documented in the file header and printed in the report when that engine
  runs.
- **Node 8 throws for the whole batch** if any item is under 200 characters.
  WF1 processes one submission at a time, so this cannot occur in practice.
- **CCI 3 "first section"** is operationalized as "everything before the
  second heading" — the CDC does not define it for web pages.
- **`overlap` in Node 11** = one evidence string contains the other after
  whitespace normalisation. Deliberately strict: over-merging would let AI
  text displace a deterministic finding.

---

## What did not need changing

Verified correct against spec and re-tested after the fixes: score
contamination guard (fix #7) · four scores never blended · CCI 17 reverse
scoring handled once at verdict level · null subscores never firing R8 ·
deterministic precedence and the R6 cross-check · fallback path through
merge → R2 → report · SHA-256 fallback byte-identical to Node crypto,
including umlauts and CJK · both check engines byte-identical on both
fixtures · the system prompt character-for-character identical to
`workflow_spec.md` §2.
