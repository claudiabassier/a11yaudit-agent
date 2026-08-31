# Test fixtures

**Three files.** The Day-5 demo pair (`bp-meds-poor.html` / `bp-meds-good.html`), documented in full below, and a third fixture added on Day 6 for the S5 test.

(This folder held two further files, `LIVE_DEMO.md` and `WHERE_ARE_THE_RESULTS.md` — support material written for the one-time Phase-1 grading demo, not for the fixtures themselves. Archived 19 August 2026 at `archive/fixtures-demo-aids/`, `decision_log.md` D-84, external review Finding 9.)

## `bp-meds-short.html` — very short material (added 5 Aug, test S5)

A deliberately **well-formed but short** patient leaflet about furosemide: two paragraphs, 128 words, valid `lang`, a `<title>` and an `<h1>`. Written so that the *only* reason any instrument item drops out is length, not defective markup.

Expected behaviour, verified 5 August (`decision_log.md` D-37):

- `is_very_short: true` (AHRQ: ≤2 paragraphs; operationalised here as ≤2 paragraphs **and** ≤300 words)
- **PEMAT 8** and **PEMAT 9** → `not_applicable`, decided deterministically ("material is very short")
- **PEMAT 11** → `not_applicable`, decided by the AI, which is told the material is short by the deterministic flag
- **CCI 8 and CCI 9 still `fail`** — the CDC Index has no short-material exemption, so the two instruments legitimately disagree about the same page. Expected, not a defect; see D-37.
- deterministic screening **100**, combined screening variable (42 / 72 / 65 across three runs — D-37)
- safety terms `{111, 999, tablet}` and R7 fires

> This fixture is also what exposed the missing UK emergency numbers in the safety prescreen. It is worth keeping precisely because it is *good* content — most fixtures are written to fail, and this one tests whether the tool can avoid punishing material for being brief.

---

# The Day-5 demo pair

Two versions of the same fictitious patient page about blood-pressure tablets.
All expected values below were **verified by running the actual node code
(both the cheerio and the regex engine — identical results)** on 31 Jul 2026.

To audit them in n8n: serve the folder (`python3 -m http.server 8080` in this
directory) and submit `http://host.docker.internal:8080/bp-meds-poor.html`
(from inside the n8n container, `localhost` is the container, not your Mac —
use `host.docker.internal`). Or paste the visible text into the form's text
field to demo the text branch.

---

## `bp-meds-poor.html` — the "before" page

Deliberate defects (do not fix them):

**Markup (all 8 fire — verified):** image without `alt` · no `lang` on
`<html>` · no `<h1>` · heading skip h2→h4 · link without text · input without
label · no `<title>` · table without `<th>`.
→ deterministic-only screening score **52 = "severe issues found"** (R4
fires from automated findings alone, before any AI involvement).

**Deterministic instrument verdicts (verified):** PEMAT_8 **fail** (the long
paragraph is ~190 words) · PEMAT_17 **fail** · PEMAT_19 **fail** · CCI_3
**fail** (first section: promo paragraph, no heading/emphasis) · CCI_8
**fail** (9-item list, CDC limit 7) · PEMAT_9, PEMAT_12, CCI_9 pass.

**Safety prescreen (verified):** `safety_context: true` — terms: bd,
breastfeed, contraindicat, mg, overdose, pregnan, side effect, tablet.
"BD" fires via Tier B (within 40 chars of "5 mg"). → R7; with the AI
failing PEMAT 4 / CCI 7 (undefined BD, jargon), R9 upgrades to critical.

**Content defects for the AI to find:** "Take 1 tablet (5 mg) BD." — BD never
defined (the R9 showcase) · undefined jargon (antihypertensive, titrated,
hyperkalaemia, nephrotoxicity, cephalalgia, NSAIDs) · pervasive passive voice
· distracting promo intro (CCI 1/2/10) · no summary · missed-dose instruction
buried mid-wall-of-text · counts: 301 words, 5 paragraphs.

## `bp-meds-good.html` — the corrected twin

**Markup (verified):** zero automated findings → deterministic screening
score **100**. All 8 deterministic instrument items **pass**.

**Content fixes:** main message first and bold ("one tablet twice a day") ·
BD replaced by "twice a day — morning and evening" · all terms explained
("an overdose", "a 'NSAID'" with example) · active voice, direct address ·
short chunked sections · lists ≤ 7 · summary ("In short") · explicit action
triggers ("Call your doctor right away, or call 112") · labelled form field ·
alt text + figcaption · table with headers · 282 words, 9 paragraphs.

**Expected safety prescreen: STILL `safety_context: true`** (mg, overdose,
side effect, 112, call your doctor, …). This is the demo's key talking
point: the corrected page scores far better on every measure, **and it still
routes to human review**, because medication content never ships on AI-only
review (R7). The tool discriminates quality but never waives safety.

---

## What the before/after demo shows (Day 5)

| | poor | corrected |
|---|---|---|
| automated findings | 8 | 0 |
| deterministic-only screening score | 52 — severe | 100 — no issues in screened subset |
| deterministic instrument fails | 5 of 8 | 0 of 8 |
| safety_context / R7 | true → review | true → review (by design) |

AI-dependent numbers (PEMAT/CCI subscores, AI findings) will vary between
runs and are not pinned here; the deterministic numbers above must reproduce
exactly, and a materially different result means a regression.
