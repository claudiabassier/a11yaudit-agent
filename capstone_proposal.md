# Capstone Proposal — A11yAudit
### AI-assisted accessibility and health-literacy audit tool for digital health content

**Author:** Claudia Bassier · **Program:** Turing College, AI for Business — Capstone (Case 3: automation / build something useful for your work environment) · **Version 2.1, 4 August 2026** · **Submission target:** 7 August 2026 (platform access ends 13 August; submitting on the 7th leaves room for the STL review)

## Problem
Digital health content must be accessible, and comprehensible, to people who are frequently reading it while in pain, frightened, or medicated — that is, at reduced cognitive capacity precisely when comprehension matters most. Two toolsets exist and neither closes the gap: accessibility checkers (axe, WAVE, Lighthouse) test markup well but reduce language to a syllable-counting readability grade; validated health-literacy instruments (PEMAT-P, CDC Clear Communication Index) assess language properly but are manual rubrics applied by trained raters. Nothing connects the two into a single audit of a health page.

## What I am building
A self-hosted n8n workflow that accepts a URL or pasted content and returns: a prioritised list of accessibility barriers with plain-language explanations and concrete fixes, a WCAG screening score over an explicitly listed criteria subset (no conformance claim), PEMAT-informed understandability and actionability subscores, a CCI-informed score, a draft accessibility statement, and a full per-item reasoning trail stored in Postgres. Deterministic rules — not the AI — decide what must go to a human.

## Target users and measurable outcome
Accessibility testers/auditors and content owners at small health providers. **Outcome:** a first-pass audit of a page in under three minutes rather than one to two hours of manual screening, with every safety-relevant and legally exposed case deterministically routed to a human reviewer, and every finding traceable to a published criterion. **Measured, not just targeted:** nine successful full pipeline runs (5–12 August), each including the live AI call, completed end to end in **59–69 seconds** — see `decision_log.md` D-54.

## Architecture (Docker Compose: n8n + Postgres 16, fully local)
**WF1 Audit Intake** (**20 nodes as built** — see `decision_log.md` D-26): form → validation → URL/text branch → deterministic HTML checks → safety prescreen → SUB-A → findings merge → decision engine → four Postgres writes → report and statement generation. **SUB-A** (subworkflow): one typed AI call at temperature 0 against a strict JSON schema → output validation including **verbatim-evidence verification against the source text** → one repair retry → guaranteed safe fallback. **Decision engine:** nine AI-independent hard rules (critical severity, AI fallback, low confidence, score < 70, declared EAA/BFSG scope, AI-vs-deterministic disagreement, medical-safety keywords, low understandability, undefined medical term in safety content). **WF-Error:** logs failure metadata only, never content.

**Design principle:** the AI proposes, deterministic rules dispose. No routing, scoring, or escalation decision depends on the AI being correct; if the AI fails entirely, the system still produces a conservative, correct outcome.

## Grounding and independent research
The language analysis is grounded in **PEMAT-P (AHRQ)** and the **CDC Clear Communication Index**, with item lists taken from the primary sources and mapped item by item to deterministic checks, AI judgment, or explicitly *not assessed*. This makes each finding traceable to a published criterion and, unlike a generic prompt, falsifiable.

## What this is not — stated limitations
- It produces a **report**, not accessible content. A human confirms findings; a content owner rewrites the page. Both steps lie outside this system.
- It measures the **literacy demand of the material**, not anyone's health literacy.
- It covers a **listed subset of WCAG 2.2**. Colour contrast, keyboard operation, focus order, media, and anything rendered by JavaScript are out of scope and declared in every report.
- Applying PEMAT and the CDC Index to web text via an LLM is an **unvalidated adaptation**; all such output is labelled "PEMAT-informed"/"CCI-informed" and is never presented as an official score.
- **Accuracy is unmeasured.** The schema records every verdict and every human override so that a false-positive rate per criterion can be derived from routine use — the natural next project.

## How it meets the capstone requirements
20 functional nodes (see `decision_log.md` D-26) including a real AI node and a reusable subworkflow · single-split branching; one exception, now resolved on the development branch — `Validate Output`/`Validate Output2` carried byte-identical validation logic in two places until D-54 flagged it; extracted into one shared subworkflow called from both sites (`decision_log.md` D-55), with the repair-branch call's live routing left honestly unverified in n8n's editor rather than assumed proven, and not yet promoted from `-dev` to the submitted original · consistent Postgres data model with idempotent upserts, referential integrity, and a documented 14-case edge-case matrix · four documented human-interaction points · security and compliance matched to the health scenario (fully local stack, anonymised test data, encrypted credentials, content-free error logs) · independent research beyond the course material (WCAG 2.2, PEMAT-P, CDC Index, EAA/BFSG) · end-to-end explainable, with a decision log recording rationale and rejected alternatives.

## Relationship to my previous n8n project
This was designed fresh — no code or workflow carried over — but deliberately applies the same architectural pattern as my earlier an earlier project [project name]: central AI call with validation and fallback, deterministic decision engine, error handler. It closes two things that project's own roadmap notes named as the next step to production use: Google Sheets is replaced by a relational database with constraints and cross-record querying, and manual, pinned-execution testing is replaced by automated deterministic checks. It adds one thing that project lacked: a grounding standard against which the AI's output can be judged.

## Security and compliance
Runs entirely on local hardware; only anonymised demo content is sent to the AI API; credentials encrypted via `N8N_ENCRYPTION_KEY`; error logs contain no content (GDPR data minimisation); the AI makes no legal or clinical determination.

## Timeline

*Planned (v2.0, 31 July):* 2 Aug stack and schema verified · 4 Aug SUB-A built and failure paths tested · 7 Aug WF1 end-to-end · 9 Aug edge-case matrix complete · 10 Aug demo audit with before/after comparison · 12 Aug documentation and presentation · 13 Aug submit.

*Actual (updated 4 August):* the review deadline moved forward, the plan was rescoped to a 7-day window and all Tier 2 scope was cut (`decision_log.md` D-14, D-20). 31 Jul Day 0, all Code-node JavaScript pre-written and reviewed · 3 Aug Days 1–2, environment, schema, `WF-Error`, `SUB-A` with fallback · 4 Aug Days 3–5, WF1 built end to end, demo audit and before/after comparison complete · 4–6 Aug Day 6, edge cases and subworkflow failure tests · 7 Aug documentation sync, readme, package, **submit**.

## Deliverables
Three exported workflow JSONs · `postgres_schema.sql` · technical specification · knowledge base with verified instrument items and sources · design decision log · build runbook with test matrix · 16 proof screenshots · demo audit report (poor page and corrected page) · presentation script.
