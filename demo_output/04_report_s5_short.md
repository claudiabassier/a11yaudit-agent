# Accessibility & Health-Literacy Screening Report

**Audit:** 9ab1fb84-91bb-4bb5-a714-ec03bcac85be · **Date:** 2026-08-05 · **Status:** NEEDS HUMAN REVIEW

| | |
|---|---|
| Source | http://host.docker.internal:8080/bp-meds-short.html |
| Title | S5 very short material - water tablet |
| Language | en |
| Primary audience | patients and family members, average to low health literacy |
| EAA/BFSG scope (auditor's declaration) | no |
| Words analyzed | 128 |
| Auditor note | S5: two-paragraph material, tests not_applicable handling |

## Scores

These four numbers measure different things on different scales and are deliberately never combined into one figure.

| Measure | Score | Reading |
|---|---|---|
| WCAG screening score — deterministic checks only (reproducible) | 100 | no issues in screened subset |
| WCAG screening score — including AI-proposed findings (varies between runs) | 42 | severe issues found |
| PEMAT-informed understandability | 77.8 | of applicable items passed (%) |
| PEMAT-informed actionability | 66.7 | of applicable items passed (%) |
| CCI-informed score | 73.3 | CDC interpretation: ≥90 good, ≤89 revise |

## Human review required

Triggered rules: **R1, R4, R7, R9** · flagged legally relevant

- Safety-relevant terms found by deterministic prescreen: tablet.

## Summary (AI-generated, validated)

This very short patient leaflet about furosemide is generally clear and well-written, using plain language and a logical structure. A small number of barriers exist around undefined medical terms, ambiguous contact instructions, and missing explanation of why certain symptoms are urgent. The material performs well on most PEMAT and CDC Index criteria given its brevity and focused scope.

## Findings (6)

| # | Severity | Title | Criterion / item | Confidence | Source |
|---|---|---|---|---|---|
| 1 | critical | Unclear when to call 111 vs 999 — ambiguous action trigger | WCAG 3.3.2 (A) · PEMAT 22 | 0.88 | ai |
| 2 | critical (upgraded from high by R9) | Drug name 'furosemide' not explained beyond brand synonym | WCAG 3.1.3 (AAA) · PEMAT 4 | 0.85 | ai |
| 3 | critical (upgraded from medium by R9) | 'Pass urine' may be unfamiliar to some low-literacy readers | WCAG 3.1.3 (AAA) · CCI 7 | 0.72 | ai |
| 4 | high | No instructions on how to contact the practice nurse | WCAG 3.3.2 (A) · PEMAT 22 | 0.82 | ai |
| 5 | medium | No explanation of why swollen ankles after a week is significant | WCAG 3.1.5 (AAA) · CCI 12 | 0.78 | ai |
| 6 | low | Dizziness on standing not explained — patients may not recognise it | WCAG 3.1.5 (AAA) · CCI 11 | 0.7 | ai |

### 1. Unclear when to call 111 vs 999 — ambiguous action trigger

The text says to call 111 'for advice' or 999 'if you feel very unwell', but both situations (faint, abnormal heartbeat) are described together without telling the patient which symptom maps to which number. A patient who feels faint may not know whether that counts as 'very unwell' and could choose the wrong service.

**Recommendation:** Separate the two emergency numbers with explicit symptom-to-action mapping, e.g. 'If you feel faint, call 999 immediately. If your heartbeat feels unusual but you are not faint, call 111.'

> If you feel faint or your heartbeat does not feel normal, this needs to be checked the same day. Call 111 for advice, or 999 if you feel very unwell.

### 2. Drug name 'furosemide' not explained beyond brand synonym

The leaflet introduces 'furosemide' and notes it is 'sometimes called a water tablet', but does not explain what class of medicine it is or why it has this effect. Patients with low health literacy may not connect the drug name on their prescription packet to the leaflet.

**Recommendation:** Add a brief explanation such as 'Furosemide (your water tablet) is a diuretic — a medicine that helps your kidneys remove extra fluid from your body.'

> Your doctor has prescribed furosemide, sometimes called a water tablet. It helps your body get rid of extra fluid

### 3. 'Pass urine' may be unfamiliar to some low-literacy readers

'Pass urine' is a clinical phrase that some patients, particularly those with low health literacy or those for whom English is a second language, may not immediately understand. Everyday alternatives like 'urinate' or 'go to the toilet more often' are more universally understood.

**Recommendation:** Replace 'pass urine' with 'need to go to the toilet to urinate (wee) more often' to ensure comprehension across literacy levels.

> you may notice that you pass urine more often for a few hours after taking it

### 4. No instructions on how to contact the practice nurse

Patients are told to 'tell your practice nurse' if certain symptoms occur, but no method of contact is given (phone, online form, in person). Patients who are new to a practice or have low confidence navigating healthcare may not know how to reach the nurse.

**Recommendation:** Add a brief instruction such as 'Call your GP surgery to speak to or leave a message for the practice nurse.'

> Tell your practice nurse if you feel dizzy when you stand up, if you become very thirsty, or if your ankles are still swollen after a week.

### 5. No explanation of why swollen ankles after a week is significant

The leaflet tells patients to report swollen ankles after a week but does not explain why this matters or what it might mean. Without this context, patients may not appreciate the importance of acting on this symptom and may delay contacting their nurse.

**Recommendation:** Add a brief reason, e.g. 'Swollen ankles after a week may mean the tablet is not working well enough, so your nurse may need to review your dose.'

> if your ankles are still swollen after a week

### 6. Dizziness on standing not explained — patients may not recognise it

Dizziness when standing up is a specific symptom (postural hypotension) that patients may not recognise as distinct from general dizziness. Without a brief description, some patients may not realise this applies to them.

**Recommendation:** Clarify with a short description: 'feel dizzy or light-headed when you stand up from sitting or lying down'.

> Tell your practice nurse if you feel dizzy when you stand up

## Instrument items

Assessment is informed by PEMAT-P (AHRQ) and the CDC Clear Communication Index. It is an automated adaptation and is not an official or validated application of either instrument.

| Instrument | Item | Verdict | Decided by | Rationale |
|---|---|---|---|---|
| CCI | 1 | pass | ai | The main message — how to take furosemide safely — is clearly singular and consistent throughout the material. |
| CCI | 2 | pass | ai | The main message appears in the first sentence of the first (and only) section, immediately visible. |
| CCI | 3 | pass | deterministic | First section starts with a heading or contains emphasis markup. |
| CCI | 5 | pass | ai | Multiple calls to action are present: take the tablet each morning, tell the practice nurse if symptoms occur, call 111 or 999 as appropriate. |
| CCI | 6 | pass | ai | Both the main message and calls to action use active voice throughout. |
| CCI | 7 | fail | ai | 'Furosemide' is introduced with a lay synonym but not explained; 'pass urine' is used without an everyday alternative being offered. |
| CCI | 8 | fail | deterministic | No bulleted or numbered lists in the material. |
| CCI | 9 | fail | deterministic | Fewer than 2 headings; material is not chunked with headings. |
| CCI | 10 | pass | ai | The first section immediately states what the medicine is and what it does, covering the most important information. |
| CCI | 11 | fail | ai | The material does not acknowledge any uncertainty or limits of knowledge (e.g. that symptoms may or may not indicate a problem); it presents all information as definitive. |
| CCI | 12 | pass | ai | A clear behavioural recommendation is present: take one tablet each morning with a glass of water. |
| CCI | 13 | pass | ai | The reason for taking the tablet in the morning is explained: to avoid being woken at night. |
| CCI | 14 | pass | ai | Specific directions for how to take the tablet are given: one tablet, each morning, with a glass of water. |
| CCI | 15 | pass | ai | Numbers used are familiar and necessary: 'one tablet', 'a few hours', 'a week', and emergency numbers 111 and 999. |
| CCI | 16 | pass | ai | The meaning of numbers is contextualised: 'a few hours' relates to increased urination, 'a week' to the timeframe for ankle swelling to resolve. |
| CCI | 17 | not_applicable | ai | No calculations are required of the patient. |
| CCI | 18 | not_applicable | ai | The material does not present statistical risk information; it describes symptoms to watch for rather than probability of harm. |
| CCI | 19 | not_applicable | ai | No explicit risks and benefits comparison is presented in the material. |
| CCI | 20 | not_applicable | ai | No numeric probability of risk is presented in the material. |
| PEMAT | 1 | pass | ai | The title and opening sentence immediately establish that the material is about taking a prescribed water tablet (furosemide). |
| PEMAT | 2 | pass | ai | All content is directly relevant to taking furosemide safely; there are no sidebars, advertisements, or off-topic information. |
| PEMAT | 3 | pass | ai | The majority of language is plain and everyday ('glass of water', 'woken up during the night', 'feel faint'); 'pass urine' is a minor exception but does not dominate. |
| PEMAT | 4 | fail | ai | The drug name 'furosemide' is linked to the lay term 'water tablet' but not formally defined or explained; 'pass urine' is used without definition. |
| PEMAT | 5 | pass | ai | Instructions throughout use active voice directed at the patient ('Take one tablet', 'Tell your practice nurse', 'Call 111'). |
| PEMAT | 6 | pass | ai | The only numbers used are simple and contextualised: 'one tablet', 'a few hours', 'a week', '111', '999' — all easy to understand without calculation. |
| PEMAT | 7 | pass | ai | No calculations are required of the patient; dosing is a fixed single tablet each morning. |
| PEMAT | 8 | not_applicable | deterministic | Material is very short (≤2 paragraphs); chunking not applicable per AHRQ. |
| PEMAT | 9 | not_applicable | deterministic | Material is very short; headers not applicable per AHRQ. |
| PEMAT | 10 | pass | ai | The material follows a logical sequence: what the medicine is → how to take it → when to report symptoms → emergency action. |
| PEMAT | 11 | not_applicable | ai | The material is explicitly flagged as very short; a summary section is not expected or appropriate. |
| PEMAT | 12 | fail | deterministic | No lists or emphasis markup found. |
| PEMAT | 17 | not_applicable | deterministic | No images in the material. |
| PEMAT | 19 | not_applicable | deterministic | No tables in the material. |
| PEMAT | 20 | pass | ai | At least one clear action is identified: take one tablet each morning with a glass of water. |
| PEMAT | 21 | pass | ai | All action instructions address the user directly using imperative second-person constructions ('Take', 'Tell', 'Call'). |
| PEMAT | 22 | fail | ai | The symptom-reporting actions are not broken into clearly separated steps; the 111/999 decision is ambiguous and not mapped to specific symptoms. |
| PEMAT | 24 | not_applicable | ai | No calculations are required of the patient. |
| PEMAT | 25 | not_applicable | ai | No charts or tables are present in the material. |

## Positive observations

- The material uses plain, conversational language throughout, making it accessible to a broad patient audience.
- The rationale for morning dosing is clearly explained, which supports patient adherence.
- Emergency contact numbers (111 and 999) are both provided, giving patients a tiered response pathway.
- The lay term 'water tablet' is introduced alongside the drug name 'furosemide', helping patients connect the leaflet to their prescription.
- The material is concise and free from distracting or irrelevant content, keeping the patient focused on the key actions.
- Active voice and direct address ('Take', 'Tell', 'Call') are used consistently, making instructions easy to follow.

## Limitations of this screening

- This tool produces a report about the material; it does not produce accessible content, and it measures the material's literacy demand, not any person's health literacy.
- WCAG coverage is limited to the listed subset. Out of scope: Colour contrast (1.4.3, 1.4.11 — requires rendered CSS) · keyboard operability (2.1.x) · focus order and visibility beyond markup-level tabindex (2.4.3, 2.4.7, 2.4.11) · time-based media (1.2.x) · reflow and zoom (1.4.4, 1.4.10) · pointer and motion input (2.5.x) · status messages (4.1.3) · anything rendered by JavaScript after page load (raw HTML is fetched).
- 6 instrument item(s) were not assessed and are excluded from all score denominators.
- Accuracy of the AI-assisted findings is unmeasured; confirmed/dismissed review decisions accumulate an empirical false-positive rate over time.

---
*Assessment is informed by PEMAT-P (AHRQ) and the CDC Clear Communication Index. It is an automated adaptation and is not an official or validated application of either instrument.*
