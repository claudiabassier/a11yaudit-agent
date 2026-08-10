# Accessibility & Health-Literacy Screening Report

**Audit:** 95c9f52e-56e6-4609-ac1f-3459d82205f9 · **Date:** 2026-08-04 · **Status:** NEEDS HUMAN REVIEW

| | |
|---|---|
| Source | http://host.docker.internal:8080/bp-meds-poor.html |
| Title | BP meds (poor fixture) |
| Language | en |
| Primary audience | patients and family members, average to low health literacy |
| EAA/BFSG scope (auditor's declaration) | no |
| Words analyzed | 301 |
| Auditor note | ay 5 demo — poor page, two-score reporting |

## Scores

These four numbers measure different things on different scales and are deliberately never combined into one figure.

| Measure | Score | Reading |
|---|---|---|
| WCAG screening score — deterministic checks only (reproducible) | 52 | severe issues found |
| WCAG screening score — including AI-proposed findings (varies between runs) | 0 | severe issues found |
| PEMAT-informed understandability | 28.6 | of applicable items passed (%) |
| PEMAT-informed actionability | 33.3 | of applicable items passed (%) |
| CCI-informed score | 22.2 | CDC interpretation: ≥90 good, ≤89 revise |

## Human review required

Triggered rules: **R1, R4, R7, R8, R9** · flagged legally relevant

- Safety-relevant terms found by deterministic prescreen: bd, breastfeed, contraindicat, mg, overdose, pregnan, side effect, tablet.

## Summary (AI-generated, validated)

This patient-facing medication guide for an ACE inhibitor contains numerous critical accessibility and comprehension barriers. Medical jargon, undefined abbreviations, passive voice throughout, and complex sentence structures make the content largely inaccessible to patients with average or low health literacy. The opening section is dominated by promotional content unrelated to the patient's medication needs, and key safety instructions are buried in dense prose rather than presented as clear, actionable steps.

## Findings (25)

| # | Severity | Title | Criterion / item | Confidence | Source |
|---|---|---|---|---|---|
| 1 | critical | Multiple undefined medical terms create patient safety risk | WCAG 3.1.3 (AAA) · PEMAT 4 | 0.98 | ai |
| 2 | critical | Abbreviation 'BD' undefined — dosing frequency unclear | WCAG 3.1.4 (AAA) · PEMAT 4 | 0.99 | ai |
| 3 | critical | Abbreviation 'NSAIDs' undefined — drug interaction warning inaccessible | WCAG 3.1.4 (AAA) · PEMAT 4 | 0.98 | ai |
| 4 | critical | Missed-dose instructions are a single complex sentence with nested conditions | WCAG 3.1.5 (AAA) · PEMAT 22 | 0.97 | ai |
| 5 | critical (upgraded from high by R9) | Drug class 'ACE inhibitors' used without explanation or drug name given | WCAG 3.1.3 (AAA) · PEMAT 4 | 0.95 | ai |
| 6 | critical (upgraded from high by R9) | Overall reading level far exceeds recommended level for patient materials | WCAG 3.1.5 (AAA) · CCI 7 | 0.97 | ai |
| 7 | critical (upgraded from low by R9) | Term 'excipients' undefined in storage bullet point | WCAG 3.1.3 (AAA) · PEMAT 4 | 0.88 | ai |
| 8 | high | 1 image(s) without alt attribute | WCAG 1.1.1 (A) | 1 | automated |
| 9 | high | Page language not declared | WCAG 3.1.1 (A) | 1 | automated |
| 10 | high | 1 link(s)/button(s) without accessible name | WCAG 2.4.4 (A) | 1 | automated |
| 11 | high | 1 form field(s) without a label | WCAG 3.3.2 (A) | 1 | automated |
| 12 | high | Promotional content at top displaces critical medication information | WCAG 2.4.6 (AA) · CCI 1 | 0.97 | ai |
| 13 | high | Main heading uses clinical terminology patients will not understand | WCAG 2.4.6 (AA) · CCI 2 | 0.96 | ai |
| 14 | high | Critical 'do not stop suddenly' warning buried in dense paragraph | WCAG 3.3.2 (A) · CCI 12 | 0.95 | ai |
| 15 | high | Overdose action instruction is vague — no specific steps or contact given | WCAG 3.3.2 (A) · PEMAT 20 | 0.94 | ai |
| 16 | medium | No top-level heading (h1) | WCAG 1.3.1 (A) | 1 | automated |
| 17 | medium | Heading level skipped (h2 → h4) | WCAG 1.3.1 (A) | 1 | automated |
| 18 | medium | Page has no title | WCAG 2.4.2 (A) | 1 | automated |
| 19 | medium | 1 data table(s) without header cells | WCAG 1.3.1 (A) | 1 | automated |
| 20 | medium | Side-effect section does not tell patients when to act or seek help | WCAG 3.1.5 (AAA) · CCI 11 | 0.9 | ai |
| 21 | medium | Monitoring instruction gives no actionable steps for the patient | WCAG 3.3.2 (A) · PEMAT 22 | 0.88 | ai |
| 22 | medium | Contact instruction uses formal register and does not specify what it is for | WCAG 3.3.2 (A) · PEMAT 21 | 0.85 | ai |
| 23 | medium | No summary of key information provided | WCAG 2.4.6 (AA) · PEMAT 11 | 0.92 | ai |
| 24 | medium | No single clear main message statement present | WCAG 3.1.5 (AAA) · CCI 1 | 0.91 | ai |
| 25 | low | Section heading 'Additional information' does not describe its content | WCAG 2.4.6 (AA) · PEMAT 10 | 0.82 | ai |

### 1. Multiple undefined medical terms create patient safety risk

Words like 'hyperkalaemia', 'nephrotoxicity', 'rebound hypertension', 'cephalalgia', and 'hypotension' are never explained. A patient who does not understand these terms cannot recognise warning signs or know when to seek help, which could lead to harm.

**Recommendation:** Replace or immediately define every clinical term in plain language, e.g. 'hyperkalaemia (too much potassium in your blood)', 'cephalalgia (headache)', 'hypotension (blood pressure that is too low)'.

> hyperkalaemia and deterioration of renal parameters have been observed in susceptible patients. Concomitant administration of NSAIDs is discouraged owing to attenuation of the antihypertensive effect and potentiation of nephrotoxicity

### 2. Abbreviation 'BD' undefined — dosing frequency unclear

'BD' is a Latin medical abbreviation meaning 'twice daily'. It is never explained. A patient who does not know this could take the tablet only once a day or at the wrong times, which is a direct medication safety risk.

**Recommendation:** Replace 'BD' with 'twice a day (once in the morning and once in the evening)' and remove the abbreviation entirely, or at minimum spell it out on first use.

> Take 1 tablet (5 mg) BD.

### 3. Abbreviation 'NSAIDs' undefined — drug interaction warning inaccessible

'NSAIDs' is never explained. Patients who do not know this stands for a common class of pain relievers (like ibuprofen) cannot act on the warning to avoid them, creating a real safety risk.

**Recommendation:** Expand 'NSAIDs' to 'NSAIDs (non-steroidal anti-inflammatory drugs, such as ibuprofen or naproxen)' at first use, and consider listing common brand names patients would recognise.

> Concomitant administration of NSAIDs is discouraged owing to attenuation of the antihypertensive effect and potentiation of nephrotoxicity.

### 4. Missed-dose instructions are a single complex sentence with nested conditions

The instruction for what to do if a dose is missed is written as one long sentence with two nested 'if' conditions. Patients under stress or with low literacy are likely to misread this and either double-dose or skip incorrectly, both of which are safety risks.

**Recommendation:** Rewrite as numbered steps: '1. If you miss a dose, take it as soon as you remember. 2. If it is almost time for your next dose, skip the missed dose. 3. Never take two doses at the same time.'

> In the event that a dose is omitted, the omitted dose should be taken as soon as it is remembered, unless the subsequent dose is imminent, in which case the omitted dose should be disregarded and the ordinary schedule resumed.

### 5. Drug class 'ACE inhibitors' used without explanation or drug name given

The text refers to 'ACE inhibitors' without explaining what this means or naming the specific medicine. Patients need to know the name of their medicine to identify it, ask questions about it, and avoid errors.

**Recommendation:** State the specific medicine name (e.g. 'lisinopril') and explain 'ACE inhibitor' in plain language, e.g. 'a type of medicine that relaxes your blood vessels to lower your blood pressure'.

> Antihypertensive therapy with ACE inhibitors is initiated when lifestyle modification proves insufficient.

### 6. Overall reading level far exceeds recommended level for patient materials

The text uses long, complex sentences and advanced vocabulary throughout. Patient health materials should target a reading age of around 12 or below (Grade 6–8), but this content is written at a professional or academic level.

**Recommendation:** Rewrite the entire body text using short sentences (under 20 words), common everyday words, and active voice. Aim for a Flesch-Kincaid Grade Level of 6–8.

> Concomitant administration of NSAIDs is discouraged owing to attenuation of the antihypertensive effect and potentiation of nephrotoxicity. In the event that a dose is omitted, the omitted dose should be taken as soon as it is remembered

### 7. Term 'excipients' undefined in storage bullet point

'Excipients' is a pharmaceutical term for inactive ingredients. Most patients will not know this word and will not understand what they are being asked to check.

**Recommendation:** Replace with: 'Check the package leaflet for a full list of ingredients, including fillers and coatings, in case you have any allergies.'

> Consult the package leaflet for excipients

### 8. 1 image(s) without alt attribute

Images without an alt attribute are invisible to screen-reader users; assistive technology may read the file name instead.

**Recommendation:** Add an alt attribute to every image: descriptive if informative, empty (alt="") if decorative.

> <img src="bp-chart.png">

### 9. Page language not declared

Without a lang attribute, screen readers guess the pronunciation rules and may read the text in the wrong language.

**Recommendation:** Add lang="de" or lang="en" to the <html> element.

> <html>

### 10. 1 link(s)/button(s) without accessible name

A control with no text and no label is announced only as "link" or "button" — the user cannot know what it does.

**Recommendation:** Give every link and button visible text, or an aria-label if it is icon-only.

> <a href="/contact"></a>

### 11. 1 form field(s) without a label

Unlabelled form fields leave screen-reader users guessing what to enter.

**Recommendation:** Associate every field with a <label for="…">, or add aria-label.

> <input type="text" name="email">

### 12. Promotional content at top displaces critical medication information

The page opens with award announcements and social media promotion rather than the patient's medication instructions. This forces patients to scroll past irrelevant content to find safety-critical information and signals that the page may not be focused on their needs.

**Recommendation:** Remove or relocate all promotional content. Begin the page immediately with the medication name, its purpose, and the most important instructions.

> Welcome to our award-winning patient portal! Did you know we were voted best regional health website 2024? Follow us on social media and subscribe to our newsletter for exciting updates.

### 13. Main heading uses clinical terminology patients will not understand

The heading 'Pharmacological management of arterial hypertension' uses three clinical terms that many patients will not recognise. A heading should immediately tell patients what the page is about in words they know.

**Recommendation:** Replace with a plain-language heading such as 'Your blood pressure medicine: what you need to know'.

> ## Pharmacological management of arterial hypertension

### 14. Critical 'do not stop suddenly' warning buried in dense paragraph

The warning not to stop taking the medicine suddenly is hidden inside a long paragraph of clinical text. Patients may not read this far or may not recognise its importance, yet stopping abruptly could cause a dangerous rise in blood pressure.

**Recommendation:** Present this warning prominently as a clearly labelled alert box or bold statement near the top of the instructions: 'Important: Do not stop taking this medicine suddenly without talking to your doctor first.'

> abrupt discontinuation is to be avoided, as rebound hypertension may be precipitated.

### 15. Overdose action instruction is vague — no specific steps or contact given

'Medical attention should be sought' does not tell patients what to do, how urgently, or who to call. In an overdose situation, patients need immediate, specific guidance such as calling emergency services.

**Recommendation:** Replace with a specific, urgent instruction: 'If you take too much, call 999 (or your local emergency number) or go to your nearest A&E immediately.'

> An overdose may manifest as pronounced hypotension, in which case medical attention should be sought.

### 16. No top-level heading (h1)

Screen-reader users navigate by headings; without an h1 the page has no announced main topic.

**Recommendation:** Give the page exactly one h1 stating its main topic.

> heading levels found: 2, 4

### 17. Heading level skipped (h2 → h4)

Skipped heading levels break the outline that assistive technology builds from the page.

**Recommendation:** Use consecutive heading levels; do not jump levels for visual effect.

> heading sequence: 2 → 4

### 18. Page has no title

The title is the first thing a screen reader announces and what appears in tabs and bookmarks.

**Recommendation:** Add a descriptive <title> in the <head>.

> <head> contains no non-empty <title>

### 19. 1 data table(s) without header cells

Without <th> header cells a screen reader cannot tell the user what each column or row means.

**Recommendation:** Mark header cells with <th> (and scope="col"/"row" where needed).

> <table> <tbody><tr><td>Morning</td><td>1 tablet</td></tr> <tr><td>Evening</td><td>1 tablet</td></tr> </tbody></table>

### 20. Side-effect section does not tell patients when to act or seek help

The text says side effects 'generally do not necessitate cessation of therapy' but gives no guidance on when a patient should contact their doctor. Patients need to know which symptoms are normal and which require action.

**Recommendation:** Add clear guidance: 'Most side effects are mild. However, contact your doctor if your cough is severe, you feel very dizzy, or you have any swelling of your face or throat.'

> Side effects of a transient nature, including dry cough, dizziness and cephalalgia, have been reported in a proportion of patients and generally do not necessitate cessation of therapy.

### 21. Monitoring instruction gives no actionable steps for the patient

'Renal function and serum electrolytes are to be monitored periodically' does not tell patients what they need to do — for example, whether they should book a blood test, how often, or who arranges it.

**Recommendation:** Rewrite to clarify patient action: 'Your doctor will arrange regular blood tests to check your kidneys and salt levels. Make sure you attend these appointments.'

> Renal function and serum electrolytes are to be monitored periodically, since hyperkalaemia and deterioration of renal parameters have been observed in susceptible patients.

### 22. Contact instruction uses formal register and does not specify what it is for

'For inquiries utilise the contact form below' uses an unnecessarily formal word ('utilise') and does not tell patients what kinds of questions the form is for, or whether it is appropriate for urgent medical concerns.

**Recommendation:** Replace with: 'Have a question about your medicine? Use the contact form below. For urgent medical concerns, call your doctor or 999.'

> For inquiries utilise the contact form below.

### 23. No summary of key information provided

The material does not include a summary of the most important points. Patients with low literacy or cognitive load benefit greatly from a short recap of the key actions they need to take.

**Recommendation:** Add a 'Key points' box at the top or bottom listing: the medicine name, dose, when to take it, what to avoid, and when to seek urgent help.

> Morning | 1 tablet Evening | 1 tablet

### 24. No single clear main message statement present

The material does not open with a clear statement of what the patient needs to know or do. Instead it begins with promotional content and then launches into clinical detail. Patients need one clear message to anchor their understanding.

**Recommendation:** Add a single main message at the very top, such as: 'This page explains how to take your blood pressure medicine safely.'

> Welcome to our award-winning patient portal! Did you know we were voted best regional health website 2024? Follow us on social media and subscribe to our newsletter for exciting updates.

### 25. Section heading 'Additional information' does not describe its content

'Additional information' is a vague label that does not help patients understand what the section contains. A descriptive heading helps patients find what they need quickly.

**Recommendation:** Replace with a descriptive heading such as 'How to store your medicine' or 'Storage and safety information'.

> #### Additional information - Store below 25 degrees - Keep out of reach of children - Do not use after the expiry date

## Instrument items

Assessment is informed by PEMAT-P (AHRQ) and the CDC Clear Communication Index. It is an automated adaptation and is not an official or validated application of either instrument.

| Instrument | Item | Verdict | Decided by | Rationale |
|---|---|---|---|---|
| CCI | 1 | fail | ai | There is no single clear main message statement; the page opens with promotional content and then presents a dense block of clinical information without a unifying message. |
| CCI | 2 | fail | ai | The first visible content is promotional material, not the main message about the medication. |
| CCI | 3 | fail | deterministic | No heading or emphasis markup in the first section. |
| CCI | 5 | pass | ai | At least one call to action is present: taking the tablet as directed, and contacting via the form for inquiries. |
| CCI | 6 | fail | ai | Neither the main message nor the calls to action consistently use active voice; passive constructions dominate throughout. |
| CCI | 7 | fail | ai | Numerous specialised terms and abbreviations (BD, NSAIDs, ACE inhibitors, hyperkalaemia, nephrotoxicity, cephalalgia) are used without explanation at first use. |
| CCI | 8 | fail | deterministic | A list runs longer than 7 items without a break (CDC rule). |
| CCI | 9 | pass | deterministic | 2 headings structure the material into chunks. |
| CCI | 10 | fail | ai | The first section contains only promotional content; the most important medication information is not summarised there. |
| CCI | 11 | fail | ai | The material presents clinical facts but does not acknowledge any uncertainty or limitations in what is known about the medicine's effects in this patient. |
| CCI | 12 | pass | ai | A behavioural recommendation is present: take the tablet as prescribed, twice daily. |
| CCI | 13 | fail | ai | The material does not explain why the patient should take the medicine (e.g. to lower blood pressure and reduce risk of stroke or heart attack); the purpose is implied but never stated in patient-relevant terms. |
| CCI | 14 | fail | ai | Specific directions on how to perform the recommended behaviour (e.g. what time of day, with or without food, with water) are absent beyond the bare dose instruction. |
| CCI | 15 | pass | ai | The numbers used (1 tablet, 5 mg, 25 degrees) are simple and familiar; no complex or unfamiliar numeric formats are used. |
| CCI | 16 | fail | ai | The meaning of the numbers is not explained; for example, '5 mg' is stated but its significance to the patient is not described. |
| CCI | 17 | not_applicable | ai | No calculations are required of the audience. |
| CCI | 18 | fail | ai | The nature of the risks (e.g. what rebound hypertension means for the patient, how likely side effects are) is not explained in terms the patient can understand. |
| CCI | 19 | fail | ai | Risks are mentioned but benefits of taking the medicine are never stated, so the patient cannot weigh them. |
| CCI | 20 | fail | ai | No numeric probabilities are given in words or visually for any risk or side effect mentioned. |
| PEMAT | 1 | fail | ai | The page opens with promotional content and uses a clinical heading; the purpose of the page as a patient medication guide is not immediately or completely evident to a lay reader. |
| PEMAT | 2 | fail | ai | The opening promotional block about awards and social media is entirely unrelated to the medication purpose and distracts from the patient's informational needs. |
| PEMAT | 3 | fail | ai | The material consistently uses clinical and formal language rather than common everyday words throughout, including 'pharmacological', 'antihypertensive', 'titrated', 'concomitant', 'precipitated', 'cephalalgia', and 'contraindicated'. |
| PEMAT | 4 | fail | ai | Multiple medical terms (hyperkalaemia, nephrotoxicity, cephalalgia, hypotension, rebound hypertension) and abbreviations (BD, NSAIDs, ACE) are used without definition or plain-language explanation. |
| PEMAT | 5 | fail | ai | Passive voice is used almost exclusively throughout the instructional content, obscuring who must perform each action. |
| PEMAT | 6 | pass | ai | The only numbers present are the dose (5 mg, 1 tablet) and storage temperature (25 degrees), which are simple and easy to understand without calculation. |
| PEMAT | 7 | pass | ai | No calculations are required of the user; the dose is stated as a fixed number of tablets. |
| PEMAT | 8 | fail | deterministic | At least one section between headings exceeds 150 words (max found: 188). |
| PEMAT | 9 | pass | deterministic | 2 heading(s) present. Informativeness is judged separately by the AI. |
| PEMAT | 10 | fail | ai | The page begins with promotional content before clinical information, and the missed-dose and overdose instructions are buried at the end of a dense paragraph rather than presented in a logical patient-centred sequence. |
| PEMAT | 11 | fail | ai | The material does not include a summary of key points; the dosing table at the end is minimal and does not recap the most important information. |
| PEMAT | 12 | pass | deterministic | Lists or emphasis markup present as visual cues. |
| PEMAT | 17 | fail | deterministic | At least one image lacks both alt text and a figcaption. |
| PEMAT | 19 | fail | deterministic | At least one table has no header cells. |
| PEMAT | 20 | pass | ai | At least one concrete action is identifiable: taking one tablet in the morning and one in the evening, supported by the dosing table. |
| PEMAT | 21 | fail | ai | Most action-oriented sentences use passive constructions or third-person references ('the omitted dose should be taken', 'medical attention should be sought') rather than addressing the user directly as 'you'. |
| PEMAT | 22 | fail | ai | The missed-dose instruction is a single complex conditional sentence rather than broken into explicit numbered steps; no other multi-step action is structured as discrete steps. |
| PEMAT | 24 | not_applicable | ai | No calculations are required of the user. |
| PEMAT | 25 | not_applicable | ai | The dosing table is a simple reference, not a chart or table requiring interpretation to take action. |

## Positive observations

- The dosing table (Morning | 1 tablet, Evening | 1 tablet) provides a simple, visual reinforcement of the twice-daily schedule that is easy to scan.
- The storage and safety bullet list uses short, plain-language statements that are largely accessible (e.g. 'Keep out of reach of children', 'Do not use after the expiry date').
- The missed-dose section does attempt to cover the key scenarios (take it, skip it, never double up), which is the correct clinical content even if the presentation needs improvement.
- The material correctly includes a warning about not sharing medication and returning unused tablets to the pharmacy, which are important safety behaviours.

## Limitations of this screening

- This tool produces a report about the material; it does not produce accessible content, and it measures the material's literacy demand, not any person's health literacy.
- WCAG coverage is limited to the listed subset. Out of scope: Colour contrast (1.4.3, 1.4.11 — requires rendered CSS) · keyboard operability (2.1.x) · focus order and visibility beyond markup-level tabindex (2.4.3, 2.4.7, 2.4.11) · time-based media (1.2.x) · reflow and zoom (1.4.4, 1.4.10) · pointer and motion input (2.5.x) · status messages (4.1.3) · anything rendered by JavaScript after page load (raw HTML is fetched).
- 6 instrument item(s) were not assessed and are excluded from all score denominators.
- 1 AI finding(s) were discarded because their evidence quote could not be verified verbatim in the source (anti-fabrication check).
- Accuracy of the AI-assisted findings is unmeasured; confirmed/dismissed review decisions accumulate an empirical false-positive rate over time.

---
*Assessment is informed by PEMAT-P (AHRQ) and the CDC Clear Communication Index. It is an automated adaptation and is not an official or validated application of either instrument.*
