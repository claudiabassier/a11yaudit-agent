# Accessibility & Health-Literacy Screening Report

**Audit:** 2efb0d6a-ceb4-4143-bade-ec266a0f9b6b · **Date:** 2026-08-04 · **Status:** NEEDS HUMAN REVIEW

| | |
|---|---|
| Source | http://host.docker.internal:8080/bp-meds-good.html |
| Title | BP meds (corrected twin) |
| Language | en |
| Primary audience | patients and family members, average to low health literacy |
| EAA/BFSG scope (auditor's declaration) | no |
| Words analyzed | 282 |
| Auditor note | Day 5 demo — corrected page (E14), two-score reporting |

## Scores

These four numbers measure different things on different scales and are deliberately never combined into one figure.

| Measure | Score | Reading |
|---|---|---|
| WCAG screening score — deterministic checks only (reproducible) | 100 | no issues in screened subset |
| WCAG screening score — including AI-proposed findings (varies between runs) | 38 | severe issues found |
| PEMAT-informed understandability | 92.9 | of applicable items passed (%) |
| PEMAT-informed actionability | 100 | of applicable items passed (%) |
| CCI-informed score | 88.2 | CDC interpretation: ≥90 good, ≤89 revise |

## Human review required

Triggered rules: **R1, R4, R7, R9** · flagged legally relevant

- Safety-relevant terms found by deterministic prescreen: 112, breastfeed, call your doctor, mg, overdose, pregnan, side effect, tablet.

## Summary (AI-generated, validated)

This patient-facing leaflet is generally clear, well-structured, and uses plain language effectively. A small number of barriers remain: the drug name and drug class are never stated, 'NSAID' is only partially explained, the dose strength (5 mg) appears once without context, and the emergency trigger criteria are vague. No calculations are required of the reader. Overall health-literacy friendliness is high, with only a few targeted fixes needed.

## Findings (7)

| # | Severity | Title | Criterion / item | Confidence | Source |
|---|---|---|---|---|---|
| 1 | critical (upgraded from high by R9) | Medication name never stated — patient cannot identify their drug | WCAG 3.1.3 (AAA) · PEMAT 4 | 0.97 | ai |
| 2 | critical (upgraded from high by R9) | Abbreviation 'NSAID' not adequately explained for lay readers | WCAG 3.1.4 (AAA) · CCI 7 | 0.95 | ai |
| 3 | critical (upgraded from low by R9) | Phrase 'blood pressure drop too low' not explained for low-literacy readers | WCAG 3.1.3 (AAA) · PEMAT 4 | 0.7 | ai |
| 4 | high | Emergency action trigger 'feel very unwell' is too vague | WCAG 3.3.2 (A) · CCI 14 | 0.88 | ai |
| 5 | medium | Dose strength '5 mg' stated once with no explanation of its meaning | WCAG 3.1.5 (AAA) · PEMAT 6 | 0.82 | ai |
| 6 | medium | No guidance on what to do if question is urgent and reply takes two days | WCAG 3.3.2 (A) · CCI 5 | 0.8 | ai |
| 7 | low | Pregnancy warning lacks instruction on what the doctor will do or decide | WCAG 3.3.2 (A) · CCI 12 | 0.75 | ai |

### 1. Medication name never stated — patient cannot identify their drug

The leaflet never names the actual medicine. A patient who needs to report their medication to another doctor, a pharmacist, or an emergency service cannot do so from this leaflet alone.

**Recommendation:** Add the medicine's generic (and brand) name prominently in the title or opening sentence, e.g. 'Taking amlodipine (Norvasc) safely'.

> # Taking your blood pressure tablets safely Take one tablet (5 mg) twice a day

### 2. Abbreviation 'NSAID' not adequately explained for lay readers

The text puts 'NSAID' in quotes after 'ibuprofen' but does not spell out what the abbreviation stands for or why this class of drugs is a problem. Patients may not understand which other medicines to avoid.

**Recommendation:** Replace with plain language: 'anti-inflammatory painkillers (called NSAIDs — for example ibuprofen or naproxen)' and briefly explain why they interact.

> Painkillers like ibuprofen (a "NSAID") can stop your tablets from working well.

### 3. Phrase 'blood pressure drop too low' not explained for low-literacy readers

The leaflet assumes patients understand what 'blood pressure drop too low' means clinically. Some patients may not connect this to the dizziness and fainting symptoms listed.

**Recommendation:** Briefly link the mechanism to the symptoms: 'Taking too many tablets can make your blood pressure drop too low — this means less blood reaches your brain, which can make you feel dizzy or faint.'

> Taking too many tablets (an overdose) can make your blood pressure drop too low. You may feel dizzy or faint.

### 4. Emergency action trigger 'feel very unwell' is too vague

Patients are told to call 112 'if you feel very unwell' but are given no concrete signs to watch for. Without specific symptoms, patients may not recognise when the situation is serious enough to call emergency services.

**Recommendation:** List specific warning signs that should prompt a 112 call, such as loss of consciousness, chest pain, or inability to stand, rather than the subjective phrase 'feel very unwell'.

> Call your doctor right away, or call 112 if you feel very unwell.

### 5. Dose strength '5 mg' stated once with no explanation of its meaning

The opening sentence mentions '5 mg' but the term is not explained and does not reappear. Patients with low health literacy may not understand what mg means or why the strength matters.

**Recommendation:** Either remove the strength if it adds no actionable value, or briefly explain it: '5 mg — this is the strength printed on your tablet packet'.

> Take one tablet (5 mg) twice a day — once in the morning and once in the evening.

### 6. No guidance on what to do if question is urgent and reply takes two days

The leaflet says messages will be answered within two working days, but does not tell patients what to do if their question is urgent and cannot wait that long.

**Recommendation:** Add a sentence directing patients with urgent questions to call their doctor or pharmacy directly rather than waiting for a message reply.

> Send us a message and we will reply within two working days.

### 7. Pregnancy warning lacks instruction on what the doctor will do or decide

Patients are told to inform their doctor about pregnancy but are not told why this matters or what might change, which may reduce the urgency they feel to act.

**Recommendation:** Add a brief reason: 'Tell your doctor if you are pregnant or breastfeeding — your doctor may need to change your medicine.'

> Tell your doctor if you are pregnant, planning to become pregnant, or breastfeeding.

## Instrument items

Assessment is informed by PEMAT-P (AHRQ) and the CDC Clear Communication Index. It is an automated adaptation and is not an official or validated application of either instrument.

| Instrument | Item | Verdict | Decided by | Rationale |
|---|---|---|---|---|
| CCI | 1 | pass | ai | One clear main message is present: take one tablet twice a day, every day, safely. |
| CCI | 2 | pass | ai | The main message appears in the very first paragraph, before any other content. |
| CCI | 3 | pass | deterministic | First section starts with a heading or contains emphasis markup. |
| CCI | 5 | pass | ai | Multiple calls to action are present: call your doctor, call 112, ask your pharmacist, send a message. |
| CCI | 6 | pass | ai | Both the main message and calls to action use active voice throughout. |
| CCI | 7 | fail | ai | 'NSAID' is not spelled out or explained in audience-friendly terms; the medicine name is also absent, leaving key specialised terms unexplained. |
| CCI | 8 | pass | deterministic | Lists present, none longer than 7 items. |
| CCI | 9 | pass | deterministic | 9 headings structure the material into chunks. |
| CCI | 10 | pass | ai | The first section summarises the most important information: dose, frequency, and the instruction not to stop without consulting a doctor. |
| CCI | 11 | not_applicable | ai | The material is a patient instruction leaflet, not a scientific or evidence summary; what is unknown is not relevant to its purpose. |
| CCI | 12 | pass | ai | Behavioural recommendations are present: take tablets daily, do not stop, call doctor or 112 if overdose. |
| CCI | 13 | pass | ai | The reason for continuing tablets even when feeling well is implied by the instruction itself, and side-effect management rationale is briefly given. |
| CCI | 14 | pass | ai | Specific directions for how to take the medication are provided, including timing, food, and missed-dose steps. |
| CCI | 15 | pass | ai | Numbers used (1 tablet, twice a day) are familiar and necessary for safe use. |
| CCI | 16 | pass | ai | The meaning of the numbers is explained in plain terms (morning and evening, the table reinforces this). |
| CCI | 17 | pass | ai | The audience is not required to perform any calculations; all quantities are pre-specified. |
| CCI | 18 | pass | ai | The nature of the overdose risk is briefly explained (blood pressure drops too low, causing dizziness or fainting). |
| CCI | 19 | fail | ai | Only risks (overdose, side effects, drug interaction) are addressed; no benefits of taking the medication are stated. |
| CCI | 20 | not_applicable | ai | No numeric probability of risk or benefit is presented in this leaflet. |
| PEMAT | 1 | pass | ai | The title and opening sentence immediately state the purpose: safe use of blood pressure tablets. |
| PEMAT | 2 | pass | ai | All sections (dosing, missed dose, overdose, side effects, interactions) are directly relevant to safe tablet use; no off-topic content detected. |
| PEMAT | 3 | pass | ai | The vast majority of language is plain and everyday ('take it as soon as you remember', 'never take two tablets at once'); the single exception 'NSAID' is addressed in a separate finding. |
| PEMAT | 4 | fail | ai | 'NSAID' is placed in quotes but not spelled out or explained; the medicine name itself is never given, so the key medical term is absent. |
| PEMAT | 5 | pass | ai | Instructions throughout use active voice directed at the reader ('Take one tablet', 'Call your doctor', 'Ask your pharmacist'). |
| PEMAT | 6 | pass | ai | Numbers are simple whole numbers (1 tablet, twice a day) and the table reinforces them clearly; '5 mg' is the only potentially unclear number. |
| PEMAT | 7 | pass | ai | No calculations are required; the schedule is pre-computed and presented as a simple table. |
| PEMAT | 8 | pass | deterministic | No section between headings exceeds 150 words. |
| PEMAT | 9 | pass | deterministic | 9 heading(s) present. Informativeness is judged separately by the AI. |
| PEMAT | 10 | pass | ai | Content flows logically: how to take → missed dose → overdose → side effects → interactions → schedule → summary. |
| PEMAT | 11 | pass | ai | A dedicated 'In short' section summarises the key messages concisely. |
| PEMAT | 12 | pass | deterministic | Lists or emphasis markup present as visual cues. |
| PEMAT | 17 | pass | deterministic | Every image has non-empty alt text or a figcaption. |
| PEMAT | 19 | pass | deterministic | Every table has header cells. |
| PEMAT | 20 | pass | ai | Multiple explicit actions are identified: take tablets, call doctor, call 112, ask pharmacist. |
| PEMAT | 21 | pass | ai | All action instructions address the user directly using imperative second-person constructions throughout. |
| PEMAT | 22 | pass | ai | The missed-dose section breaks the action into two clear, sequential steps appropriate for the scenario. |
| PEMAT | 24 | not_applicable | ai | No calculations are required of the reader. |
| PEMAT | 25 | pass | ai | The daily schedule table is simple and self-explanatory; no additional instructions are needed to act on it. |

## Positive observations

- Language is consistently plain and patient-friendly throughout, with short sentences and everyday vocabulary.
- The missed-dose section provides clear, sequential steps that prevent a common and potentially harmful error.
- A dedicated 'In short' summary section reinforces the key message effectively for low-literacy readers.
- The daily schedule table visually reinforces the dosing instructions without requiring any reader calculation.
- Emergency contact information (112) is prominently placed in the overdose section, supporting patient safety.
- Active voice is used consistently across all instructional sections, making actions easy to identify and follow.

## Limitations of this screening

- This tool produces a report about the material; it does not produce accessible content, and it measures the material's literacy demand, not any person's health literacy.
- WCAG coverage is limited to the listed subset. Out of scope: Colour contrast (1.4.3, 1.4.11 — requires rendered CSS) · keyboard operability (2.1.x) · focus order and visibility beyond markup-level tabindex (2.4.3, 2.4.7, 2.4.11) · time-based media (1.2.x) · reflow and zoom (1.4.4, 1.4.10) · pointer and motion input (2.5.x) · status messages (4.1.3) · anything rendered by JavaScript after page load (raw HTML is fetched).
- 6 instrument item(s) were not assessed and are excluded from all score denominators.
- Accuracy of the AI-assisted findings is unmeasured; confirmed/dismissed review decisions accumulate an empirical false-positive rate over time.

---
*Assessment is informed by PEMAT-P (AHRQ) and the CDC Clear Communication Index. It is an automated adaptation and is not an official or validated application of either instrument.*
