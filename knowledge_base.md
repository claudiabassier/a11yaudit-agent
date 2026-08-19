# A11yAudit - Knowledge Base

**Version 2.4 · 5 August 2026** · Reference document for SUB-A prompt construction and the automated-checks node.

> **v2.3 change:** §4's rationale note rewritten. It claimed patients "routinely misread BD as bedtime" - **unsupported, and inverted relative to ISMP**, which records the opposite (`BD` meaning *bedtime* mistaken as `BID`) and drops `BD` entirely from its current 2024 list. Replaced with the correct patient-facing evidence base (Wolf et al. 2007) and the correct clinician-facing citation, kept separate. Two new sources added. See `decision_log.md` **D-43**. No instrument item, prescreen term or code path changed.
>
> **v2.2 change:** §4 emergency-number list extended with `999` and `111` (`decision_log.md` D-37). No instrument item was changed; §2 and §3 remain as verified against the primary sources on 31 July. Every item below is quoted or paraphrased from the primary source listed at the end.

> **Adaptation notice - read first.**
> PEMAT-P and the CDC Clear Communication Index were designed for **trained human raters** assessing **complete materials**. This project applies a subset of their items to **web page text via an LLM**. That is an *unvalidated adaptation*, not a validated use of either instrument. All instrument-derived output in this system is therefore labelled **"PEMAT-informed"** / **"CCI-informed"** and never presented as an official PEMAT or Index score. See `decision_log.md` D-07.

---

## 1. WCAG 2.2 - scope actually covered

WCAG 2.2 contains 87 success criteria. This tool addresses a small, explicitly listed subset.

### 1.1 Deterministic checks (automated node, no AI)

| Check | SC | Level | Severity |
|---|---|---|---|
| `<img>` without `alt` attribute | 1.1.1 | A | high |
| `<html>` missing `lang` | 3.1.1 | A | high |
| No `<h1>` / heading level skipped | 1.3.1 | A | medium |
| Link or button without accessible name | 2.4.4 / 4.1.2 | A | high |
| `<input>` without label / `aria-label` | 3.3.2 | A | high |
| Missing `<title>` | 2.4.2 | A | medium |
| Positive `tabindex` | 2.4.3 | A | medium |
| `<meta http-equiv="refresh">` | 2.2.1 | A | high |
| Table without `<th>` | 1.3.1 | A | medium |

### 1.2 AI-assessed criteria (judgment required)

3.1.3 (unusual words), 3.1.4 (abbreviations), 3.1.5 (reading level, AAA), 2.4.6 (headings and labels), 3.3.2 (instructions quality), 1.3.1 (semantic structure quality).

### 1.3 Explicitly **out of scope** - state this in every report

Colour contrast (1.4.3/1.4.11 - requires rendered CSS), keyboard operability (2.1.x), focus order and visibility (2.4.3/2.4.7/2.4.11), all time-based media (1.2.x), reflow and zoom (1.4.10/1.4.4), pointer/motion criteria (2.5.x), status messages (4.1.3), and anything rendered by JavaScript after page load (the workflow fetches raw HTML only).

---

## 2. PEMAT-P - Patient Education Materials Assessment Tool (Printable)

24 scored items: **Understandability** = items 1–12 and 15–19 (17 items); **Actionability** = items 20–26 (7 items). Items 13–14 exist only in the audiovisual version (PEMAT-A/V), hence the numbering gap. Scoring: Agree = 1, Disagree = 0, some items allow N/A. Score = points ÷ possible points × 100, calculated **separately** for the two domains.

### 2.1 Understandability items and their handling here

| # | Item (verbatim) | Handled by |
|---|---|---|
| 1 | The material makes its purpose completely evident. | AI |
| 2 | The material does not include information or content that distracts from its purpose. | AI |
| 3 | The material uses common, everyday language. | AI |
| 4 | Medical terms are used only to familiarize audience with the terms. When used, medical terms are defined. | AI **(safety-critical - see rule R9)** |
| 5 | The material uses the active voice. | AI |
| 6 | Numbers appearing in the material are clear and easy to understand. *(N/A if no numbers)* | AI |
| 7 | The material does not expect the user to perform calculations. | AI |
| 8 | The material breaks or "chunks" information into short sections. *(N/A if very short)* | Deterministic + AI |
| 9 | The material's sections have informative headers. *(N/A if very short)* | Deterministic (presence) + AI (informativeness) |
| 10 | The material presents information in a logical sequence. | AI |
| 11 | The material provides a summary. *(N/A if very short)* | AI |
| 12 | The material uses visual cues (arrows, boxes, bullets, bold, larger font, highlighting) to draw attention to key points. | Deterministic (lists / `<strong>` / `<em>` present) |
| 15 | The material uses visual aids whenever they could make content more easily understood. | **Not assessed** |
| 16 | The material's visual aids reinforce rather than distract from the content. | **Not assessed** |
| 17 | The material's visual aids have clear titles or captions. | Deterministic (partial: `alt` / `<figcaption>` present) |
| 18 | The material uses illustrations and photographs that are clear and uncluttered. | **Not assessed** |
| 19 | The material uses simple tables with short and clear row and column headings. | Deterministic (partial: `<th>` present) |

*"Very short material" is defined by AHRQ as two or fewer paragraphs and no more than one page.*

### 2.2 Actionability items

| # | Item (verbatim) | Handled by |
|---|---|---|
| 20 | The material clearly identifies at least one action the user can take. | AI |
| 21 | The material addresses the user directly when describing actions. | AI |
| 22 | The material breaks down any action into manageable, explicit steps. | AI |
| 23 | The material provides a tangible tool (e.g., menu planners, checklists) whenever it could help the user take action. | **Not assessed** |
| 24 | The material provides simple instructions or examples of how to perform calculations. *(N/A if no calculations)* | AI |
| 25 | The material explains how to use the charts, graphs, tables, or diagrams to take actions. *(N/A if none)* | AI |
| 26 | The material uses visual aids whenever they could make it easier to act on the instructions. | **Not assessed** |

### 2.3 Scoring rule implemented in the Decision Engine

Items marked **Not assessed** are excluded from the denominator (treated as N/A) and the count of excluded items is printed in the report. Scores are labelled *PEMAT-informed*.

---

## 3. CDC Clear Communication Index

20 items in 4 parts. **Part A (1–11) applies to all materials.** Parts B, C, D are conditional. Score = earned ÷ applicable × 100. CDC's own interpretation: **≥ 90 = good; ≤ 89 = revise.** Note item 17 is reverse-scored.

### Part A - Core (always applies)

| # | Question | Handled by |
|---|---|---|
| 1 | Does the material contain one main message statement? | AI |
| 2 | Is the main message at the top, beginning, or front of the material? *(web: first section visible without scrolling)* | AI |
| 3 | Is the main message emphasized with visual cues? | Deterministic (partial) |
| 4 | Does the material contain at least one visual that conveys or supports the main message? *(no caption/labels → no)* | **Not assessed** |
| 5 | Does the material include one or more calls to action for the primary audience? | AI |
| 6 | Do both the main message and the call to action use the active voice? | AI |
| 7 | Does the material always use words the primary audience uses? *(all specialized terms explained - not merely defined - at first use; acronyms and abbreviations spelled out)* | AI **(safety-critical - rule R9)** |
| 8 | Does the material use bulleted or numbered lists? *(>7 items unbroken → no)* | Deterministic |
| 9 | Is the material organized in chunks with headings? | Deterministic + AI |
| 10 | Is the most important information summarized in the first paragraph or section? | AI |
| 11 | Does the material explain what authoritative sources know **and don't know** about the topic? | AI |

### Part B - Behavioral Recommendations (12–14)
12 present? · 13 explains **why** it matters to the audience · 14 gives **specific directions** how to perform it (incl. when and how to contact a provider). - All AI, conditional.

### Part C - Numbers (15–17)
15 numbers familiar/necessary · 16 explains what numbers mean · 17 audience must calculate (**reverse: Yes = 0**). - All AI, conditional.

### Part D - Risk (18–20)
18 explains nature of the risk · 19 addresses risks **and** benefits *(N/A if no behavioral recommendation)* · 20 numeric probability also explained in words or visual *(N/A)*. - All AI, conditional.

---

## 4. Health-safety trigger list (deterministic, feeds rules R7 and R9)

Regex match on `content_text`, case-insensitive. Presence forces human review - no AI involvement.

> **Matching rule (v2.1, from review):** short and ambiguous abbreviations collide with ordinary words - German "im" ("in the"), English "stat", "od". Standalone matching would fire R7 on virtually every German page, routing everything to review and destroying the tool's ability to discriminate (test E14 could never pass). Therefore two tiers:
> - **Tier A - standalone match:** unambiguous long terms only (e.g. `contraindicat`, `overdose`, `Dosierung`, `Notfall`).
> - **Tier B - context-gated match:** dosing abbreviations (`bd`, `bid`, `tid`, `qid`, `qd`, `qhs`, `prn`, `po`, `sc`, `im`, `iv`, `stat`, `ac`, `pc`, `od`, `os`, `ou`) count only when within 40 characters of a number, unit, or dose-form word (`\d`, `mg`, `mcg`, `ml`, `tablet|Tablette`, `capsule|Kapsel`, `drops|Tropfen`, `dose|Dosis`). "Take 1 tablet BD" matches; "im Krankenhaus" does not.

*Rationale for the list itself, corrected 5 Aug (see `decision_log.md` D-43):*

*Two separate evidence bases, and they must not be blurred.*

- ***Clinician-facing.*** *ISMP's [List of Error-Prone Abbreviations](https://online.ecri.org/hubfs/ISMP/Resources/ISMP_ErrorProneAbbreviation_List.pdf) documents abbreviations misread in prescriptions and orders. Relevant entries: `o.d./OD` (once daily) **mistaken as right eye**, oculus dexter - "leading to oral liquid medications administered in the eye"; `qhs` mistaken as `qhr`; `Qn` mistaken as `qh`. **`BD` does not appear on the current (2024) list at all.** The 2015 edition listed it in the reverse direction - `BD` written to mean **bedtime**, mistaken as `BID` (twice daily). Bedtime confusion on the ISMP list attaches to `HS`/`qhs`, not to BD meaning twice-daily.*
- ***Patient-facing - the relevant base for this tool.*** *[Wolf et al. 2007](https://pubmed.ncbi.nlm.nih.gov/17587533/) (Patient Educ Couns 67(3):293–300) tested 395 patients on five common dosage instructions. Misunderstanding: **63% low literacy / 51% marginal / 38% adequate** (p<0.001); per-instruction rates 8–33%. Six causes derived, including **label language**, **complexity of instructions**, and **implicit versus explicit dosage intervals**. Conclusion: "the instructions themselves are awkwardly phrased, vague, and unnecessarily difficult."*

*The prescreen list is justified by the second base, not the first: this tool audits material patients read, not orders clinicians write. An earlier version of this note claimed patients "routinely misread BD as bedtime" - unsupported, and inverted relative to ISMP. Removed.*

**Dose/units:** `mg`, `mcg`, `µg`, `ml`, `IU`, `units`, `tablet`, `capsule`, `drops`, `puffs`, `Dosis`, `Dosierung`, `Tablette`, `Tropfen`

**Emergency / escalation:** `emergency`, `immediately`, `urgent`, `call 911`, `call your doctor`, `seek medical attention`, `Notfall`, `sofort`, `Notaufnahme`, `112`, **`999`, `111`**

**Risk terms:** `contraindicat`, `overdose`, `side effect`, `adverse`, `allergic`, `interaction`, `warning`, `Nebenwirkung`, `Wechselwirkung`, `Gegenanzeige`, `Überdos` *(stem corrected from `Überdosis` on 31 Jul: the longer stem misses "Überdosierung", which splits Überdos-ierung. Matches Überdosis, Überdosen and Überdosierung; still reported as "überdosis". See `decision_log.md` D-19.)*

> **Emergency numbers are context-gated (31 Jul).** `112`, `911`, `999` and `111` count only within 40 characters of a word that makes them a phone number (*call, dial, phone, ring, rufen, wählen, anrufen, Notruf, Notfall, emergency, ambulance, Rettungsdienst*). Standalone matching fired on ordinary content - `112/70` is a blood-pressure reading, not an emergency number. Same correction as the two-tier rule above, for the same reason. Matching uses digit boundaries, so a number cannot match inside a longer one.
>
> **`999` and `111` added 5 August (D-37).** The list originally held only the EU/German (`112`) and US (`911`) numbers, while English-language patient material is in scope. A test fixture reading *"Call 111 for advice, or 999 if you feel very unwell"* produced **no** emergency-number match. Found by reading the report, not by a failing test. Other national numbers (`000`, `119`, `115`) are deliberately **not** added: each needs verification against a primary source and raises false-positive risk on numbers that occur in ordinary text.

**Vulnerable-context terms:** `pregnan`, `Schwangerschaft`, `breastfeed`, `Stillzeit`, `child dose`, `Kinderdosis`, `suicid`, `Suizid`, `self-harm`

> The suicide/self-harm terms trigger review because such content carries additional editorial-safety requirements beyond accessibility. They are a routing signal only; the tool makes no clinical assessment.

---

## 5. Legal context (informational - the tool makes no legal determinations)

- **EAA** (Directive (EU) 2019/882) and the German **BFSG**, applicable since 28 June 2025, cover specified products and services - e-commerce, banking, transport, and others. Coverage is **not** health-specific and depends on the service and provider, including micro-enterprise exemptions.
- **EN 301 549** is the harmonised European standard, incorporating WCAG.
- Public bodies fall under the earlier Web Accessibility Directive / BITV 2.0 regime.

Scope determination is a **legal question**, made by a human. The workflow only records the auditor's declaration (`eaa_scope` checkbox) and uses it as a routing signal (rule R5).

---

## 6. Licensing and attribution

PEMAT (AHRQ) and the Clear Communication Index (CDC) are works of US federal agencies and are freely usable; both must be cited. Neither agency endorses this tool. Reports carry the line: *"Assessment is informed by PEMAT-P (AHRQ) and the CDC Clear Communication Index. It is an automated adaptation and is not an official or validated application of either instrument."*

---

## Sources

- [PEMAT for Printable Materials (PEMAT-P) - AHRQ](https://www.ahrq.gov/health-literacy/patient-education/pemat-p.html) - full item list, scoring procedure
- [PEMAT and User's Guide - AHRQ](https://www.ahrq.gov/health-literacy/patient-education/pemat.html)
- [CDC Clear Communication Index Score Sheet (PDF)](https://www.cdc.gov/ccindex/pdf/full-index-score-sheet.pdf) - all 20 items, scoring, interpretation
- [CDC Clear Communication Index User Guide](https://www.cdc.gov/ccindex/tool/index.html)
- [CCI applied to a patient portal - Journal study](https://pmc.ncbi.nlm.nih.gov/articles/PMC5114169/) - precedent for web application
- [W3C COGA - Making Content Usable for People with Cognitive and Learning Disabilities](https://accessibility.education.gov.uk/guidelines/coga)
- [Health literacy evaluation measures overview - RHIhub](https://www.ruralhealthinfo.org/toolkits/health-literacy/5/evaluation-measures)
- [SHeLL Health Literacy Editor - Sydney Health Literacy Lab (JMIR)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9975914/) - the closest existing automated health-literacy tool: six language assessments, browser-based, end-user tested. **Related work, not a source for any item here.** It does not check markup and is not grounded in PEMAT or the CDC Index. Added 5 Aug (D-45)
- [Wolf MS, Davis TC, Shrank W, et al. *To err is human: patient misinterpretations of prescription drug label instructions.* Patient Educ Couns. 2007;67(3):293–300](https://pubmed.ncbi.nlm.nih.gov/17587533/) - 395 patients; misunderstanding 63% / 51% / 38% by literacy level, per-instruction 8–33%; six derived causes including *implicit versus explicit dosage intervals*. **The evidence base for §4's dosing-abbreviation tier.** Added 5 Aug (D-43)
- [ISMP List of Error-Prone Abbreviations, Symbols, and Dose Designations (2024)](https://online.ecri.org/hubfs/ISMP/Resources/ISMP_ErrorProneAbbreviation_List.pdf) - clinician-facing. Cited for `OD` → *right eye*, and to record that **`BD` is not on the current list**. Added 5 Aug (D-43)
