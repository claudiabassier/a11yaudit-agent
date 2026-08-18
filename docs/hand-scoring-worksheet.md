# Hand-Scoring-Arbeitsblatt — PEMAT-P & CDC Clear Communication Index

**Zweck:** Woche 1b, Review-Punkt „erste Accuracy-Messung". Du scorst die zwei Day-5-Demo-Fixtures (`fixtures/bp-meds-poor.html`, `fixtures/bp-meds-good.html`) selbst, unabhängig von der AI, nach den echten AHRQ/CDC-Kriterien. Danach — **nicht vorher** — vergleichst du gegen `docs/hand-scoring-ai-verdicts.md`.

**Status: ausgefüllt (17. August).** Vergleich gegen die AI-Verdikte in `docs/hand-scoring-comparison.md`.

**Verdikt-Werte, wie tatsächlich benutzt:** `yes`/`ja`, `no`/`nein`, `n/a`/`N/A` — plus `teilweise`/`depends` an einigen Stellen, wo die Autorin ein binäres pass/fail als unpassend empfand. Im Vergleich werden diese Fälle einzeln benannt, nicht stillschweigend zu pass/fail gezwungen — siehe `docs/hand-scoring-comparison.md`.

## Wie scoren, wenn ein Item unklar ist

**Wichtig zuerst — kein Nachteil gegenüber der AI:** Der System-Prompt, den die AI beim echten Lauf bekommen hat (`code/A2_build_prompt.js`), enthält **exakt dieselben knappen Item-Texte**, die unten in den Tabellen stehen — keine erweiterte Scoring-Anleitung, keine Beispiele. Die AI musste mit demselben knappen Text urteilen wie du gleich. Ein Vergleich unter denselben Bedingungen ist methodisch sauberer als einer, bei dem du mehr Kontext hättest als sie — du bist also nicht im Nachteil, nur weil du „nicht alle Regeln" kennst.

**Allgemeines Rater-Prinzip (AHRQ, verifiziert):** Immer aus Patientenperspektive fragen — „Wenn ich mit dem Thema nicht vertraut wäre, würde ich das sofort verstehen?" Du darfst das Material jederzeit erneut ansehen, musst nicht aus dem Gedächtnis urteilen.

**Vier Item-Beispiele, direkt von AHRQ bestätigt** (Rest der 38 Items: Item-Text + gesunder Menschenverstand, wie bei der AI):

| Item | Agree-Beispiel | Disagree-Beispiel |
|---|---|---|
| PEMAT 1 (Zweck evident) | Überschrift wie „Was während Ihrer Mammographie passiert" — sofort klar | Vage Überschrift wie „Mammographie und Sie" |
| PEMAT 2 (keine Ablenkung) | — | Zählt als Ablenkung: „übermäßige Details zu Geräten, Verfahren oder Hintergrund einer Erkrankung", die nichts mit dem Patienten-Zweck zu tun haben |
| PEMAT 3 (common everyday language) | „doctor" statt „physician", „pain killer" statt „analgesic" — für fast alle Patient:innen sofort verständlich | Fachjargon ohne Not |
| PEMAT 4 (Fachbegriffe definiert) | Begriff wird bei erster Nennung erklärt | Begriff steht unerklärt im Text |

**Bei einem konkreten Item unsicher?** Offizielle AHRQ-Anleitung selbst im Browser öffnen (nur für automatisierte Abrufe blockiert, nicht für dich): [pemat_guide.pdf](https://www.ahrq.gov/sites/default/files/publications/files/pemat_guide.pdf) — gezielt das eine Item nachschlagen, nicht das ganze Dokument vorab lesen.

---

## Fixture 1 — `bp-meds-poor.html` (die absichtlich schlechte Seite)

<details>
<summary>Seiteninhalt (zum Aufklappen)</summary>

> Welcome to our award-winning patient portal! Did you know we were voted best regional health website 2024? Follow us on social media and subscribe to our newsletter for exciting updates.
>
> ## Pharmacological management of arterial hypertension
>
> Antihypertensive therapy with ACE inhibitors is initiated when lifestyle modification proves insufficient. The medication is to be taken as prescribed. Take 1 tablet (5 mg) BD. The dosage may be titrated upwards by the treating physician if blood pressure targets are not attained. It should be noted that abrupt discontinuation is to be avoided, as rebound hypertension may be precipitated. Renal function and serum electrolytes are to be monitored periodically, since hyperkalaemia and deterioration of renal parameters have been observed in susceptible patients. Concomitant administration of NSAIDs is discouraged owing to attenuation of the antihypertensive effect and potentiation of nephrotoxicity. In the event that a dose is omitted, the omitted dose should be taken as soon as it is remembered, unless the subsequent dose is imminent, in which case the omitted dose should be disregarded and the ordinary schedule resumed. Doubling of doses is contraindicated. An overdose may manifest as pronounced hypotension, in which case medical attention should be sought. Side effects of a transient nature, including dry cough, dizziness and cephalalgia, have been reported in a proportion of patients and generally do not necessitate cessation of therapy.
>
> [Bild: bp-chart.png, kein Alt-Text]
>
> #### Additional information
> - Store below 25 degrees
> - Keep out of reach of children
> - Do not use after the expiry date
> - Protect from moisture
> - Do not transfer to another container
> - Return unused tablets to the pharmacy
> - Do not share your medication with others
> - Consult the package leaflet for excipients
> - Inform your physician if pregnant or breastfeeding
>
> | Morning | 1 tablet |
> | Evening | 1 tablet |
>
> For inquiries utilise the contact form below. [Formularfeld ohne Label, Link ohne Text]

</details>

### PEMAT-P — Understandability (Items 1–12, 17, 19)

| # | Kriterium (verbatim AHRQ) | Dein Verdikt | Deine Begründung (1 Satz) |
|---|---|---|---|
| 1 | The material makes its purpose completely evident. | no | Abkürzungen unklar und zu viele Fremdwörter |
| 2 | The material does not include information or content that distracts from its purpose. | no | info wirkt wie wissenschaftliches paper, nicht wie für patienten |
| 3 | The material uses common, everyday language. | no | Abkürzungen nicht definiert, Fachsprache |
| 4 | Medical terms are used only to familiarize audience with the terms. When used, medical terms are defined. | no | weder noch |
| 5 | The material uses the active voice. | no | |
| 6 | Numbers appearing in the material are clear and easy to understand. *(N/A wenn keine Zahlen)* | no | BD völlig unklar |
| 7 | The material does not expect the user to perform calculations. | no | Mengenangabe unklar |
| 8 | The material breaks or "chunks" information into short sections. | no | ein großer Absatz, keine sections |
| 9 | The material's sections have informative headers. | no | ein großer Absatz, keine sections |
| 10 | The material presents information in a logical sequence. | no | ein großer Absatz, keine sections |
| 11 | The material provides a summary. | no | |
| 12 | The material uses visual cues (arrows, boxes, bullets, bold, larger font, highlighting) to draw attention to key points. | no | |
| 17 | The material's visual aids have clear titles or captions. | no | keine sections oder Überschriften |
| 19 | The material uses simple tables with short and clear row and column headings. | no | |

### PEMAT-P — Actionability (Items 20–22, 24–25)

| # | Kriterium (verbatim AHRQ) | Dein Verdikt | Deine Begründung |
|---|---|---|---|
| 20 | The material clearly identifies at least one action the user can take. | yes | nur morgens und abends eine Tablette |
| 21 | The material addresses the user directly when describing actions. | nein | text ist allgemein geschrieben |
| 22 | The material breaks down any action into manageable, explicit steps. | teilweise | in additional information |
| 24 | The material provides simple instructions or examples of how to perform calculations. *(N/A wenn keine Berechnungen)* | N/A | |
| 25 | The material explains how to use the charts, graphs, tables, or diagrams to take actions. *(N/A wenn keine)* | N/A | |

### CDC Clear Communication Index — Part A: Core (Items 1–3, 5–11)

| # | Frage (verbatim CDC) | Dein Verdikt | Deine Begründung |
|---|---|---|---|
| 1 | Does the material contain one main message statement? | teilweise | anwendung wie vom Arzt verschrieben |
| 2 | Is the main message at the top, beginning, or front of the material? | ja | relative am Anfang |
| 3 | Is the main message emphasized with visual cues? | N/A | |
| 5 | Does the material include one or more calls to action for the primary audience? | n/A | |
| 6 | Do both the main message and the call to action use the active voice? | n/A | |
| 7 | Does the material always use words the primary audience uses? *(alle Fachbegriffe/Abkürzungen bei Erstnennung erklärt)* | nein | ausschließlich Fachsprache |
| 8 | Does the material use bulleted or numbered lists? *(>7 Punkte ohne Unterbrechung → nein)* | teilweise | additional Information |
| 9 | Is the material organized in chunks with headings? | no | |
| 10 | Is the most important information summarized in the first paragraph or section? | teilweise | nur die Mengenangabe zum Schluss, was mit der Verschreibung des Arztes kollidieren könnte |
| 11 | Does the material explain what authoritative sources know and don't know about the topic? | yes | Fachsprache |

### CDC — Part B: Behavioral Recommendations (12–14)

| # | Frage | Dein Verdikt | Deine Begründung |
|---|---|---|---|
| 12 | Is a behavioral recommendation present? | n/a | |
| 13 | Does it explain **why** it matters to the audience? | teilweise | im ersten abschnitt, aber nicht ausführlich |
| 14 | Does it give **specific directions** how to perform it? | teilweise | |

### CDC — Part C: Numbers (15–17)

| # | Frage | Dein Verdikt | Deine Begründung |
|---|---|---|---|
| 15 | Are the numbers familiar and necessary? | teilweise | BD unklar |
| 16 | Does it explain what the numbers mean? | teilweise | 1 Tablette morgens und abends |
| 17 | Must the audience calculate? *(reverse-scored: Ja = 0/fail)* | ja | je nach individueller Verordnung des arztes |

### CDC — Part D: Risk (18–20)

| # | Frage | Dein Verdikt | Deine Begründung |
|---|---|---|---|
| 18 | Does it explain the nature of the risk? | teilweise | "do not double the dose" |
| 19 | Does it address risks **and** benefits? | *(nicht ausgefüllt)* | |
| 20 | Is numeric probability also explained in words or visually? *(N/A wenn keine Zahl)* | n7a *(vermutlich n/a)* | |

---

## Fixture 2 — `bp-meds-good.html` (der korrigierte Zwilling)

<details>
<summary>Seiteninhalt (zum Aufklappen)</summary>

> # Taking your blood pressure tablets safely
>
> **Take one tablet (5 mg) twice a day — once in the morning and once in the evening.** Keep taking them every day, even when you feel well. Do not stop on your own: talk to your doctor first.
>
> ## How to take your tablets
> - Take one tablet in the morning and one in the evening.
> - Take them at about the same times each day.
> - You can take them with or without food.
>
> ## If you miss a dose
> Take it as soon as you remember. If your next dose is due soon, skip the missed one. Never take two tablets at once to catch up.
>
> ## If you take too many tablets
> Taking too many tablets (an overdose) can make your blood pressure drop too low. You may feel dizzy or faint. Call your doctor right away, or call 112 if you feel very unwell.
>
> ## Common side effects
> Some people get a dry cough, feel dizzy, or have a headache. These effects usually fade. If they bother you, tell your doctor — do not stop the tablets on your own.
>
> ## What to avoid
> - Painkillers like ibuprofen (a "NSAID") can stop your tablets from working well. Ask your pharmacist before taking them.
> - Tell your doctor if you are pregnant, planning to become pregnant, or breastfeeding.
>
> ## Your daily schedule
> | Time of day | How many tablets |
> | Morning | 1 tablet |
> | Evening | 1 tablet |
>
> [Bild: bp-chart.png, Alt-Text: "Line chart showing blood pressure falling to the target range over eight weeks of treatment", Bildunterschrift: "Most people reach their target blood pressure within eight weeks."]
>
> ## In short
> One tablet, twice a day, every day. Never double up. Ask your doctor or pharmacist whenever you are unsure — they are there to help you.
>
> ## Questions?
> Send us a message and we will reply within two working days. [Formularfeld mit Label „Your email address", Link „Contact page"]

</details>

### PEMAT-P — Understandability (1–12, 17, 19)

| # | Kriterium | Dein Verdikt | Deine Begründung |
|---|---|---|---|
| 1 | The material makes its purpose completely evident. | yes | anweisungen in bezug auf sicherheit der einnahme |
| 2 | The material does not include information or content that distracts from its purpose. | yes | anwenderbezogenheit durchgehend |
| 3 | The material uses common, everyday language. | yes | plain language |
| 4 | Medical terms are used only to familiarize audience with the terms. When used, medical terms are defined. | teilweise | Ibu - NSAD |
| 5 | The material uses the active voice. | yes | |
| 6 | Numbers appearing in the material are clear and easy to understand. | yes | mit zeit und mengenangabe |
| 7 | The material does not expect the user to perform calculations. | yes | |
| 8 | The material breaks or "chunks" information into short sections. | yes | insbesondere die art der Einnahmen |
| 9 | The material's sections have informative headers. | yes | |
| 10 | The material presents information in a logical sequence. | yes | |
| 11 | The material provides a summary. | ja | "in short" |
| 12 | The material uses visual cues to draw attention to key points. | teilweise | |
| 17 | The material's visual aids have clear titles or captions. | yes | |
| 19 | The material uses simple tables with short and clear row and column headings. | ja | daily schedule |

### PEMAT-P — Actionability (20–22, 24–25)

| # | Kriterium | Dein Verdikt | Deine Begründung |
|---|---|---|---|
| 20 | The material clearly identifies at least one action the user can take. | yes | einnahmehinweise ausführlich |
| 21 | The material addresses the user directly when describing actions. | yes | |
| 22 | The material breaks down any action into manageable, explicit steps. | yes | |
| 24 | Simple instructions/examples for calculations. *(N/A)* | n/a | |
| 25 | Explains how to use charts/tables to take action. *(N/A)* | teilweise | daily schedule |

### CDC — Part A: Core (1–3, 5–11)

| # | Frage | Dein Verdikt | Deine Begründung |
|---|---|---|---|
| 1 | One main message statement? | yes | safety statement |
| 2 | Main message at the top? | yes | |
| 3 | Emphasized with visual cues? | yes | |
| 5 | One or more calls to action? | yes | ask doctor/ pharmacy |
| 6 | Active voice throughout? | yes | |
| 7 | All specialised terms explained at first use? | yes | |
| 8 | Bulleted/numbered lists, none >7 unbroken? | yes | |
| 9 | Organized in chunks with headings? | yes | |
| 10 | Most important info summarised first? | yes | dosage |
| 11 | Explains what's known and unknown? | n/a | |

### CDC — Part B: Behavioral Recommendations (12–14)

| # | Frage | Dein Verdikt | Deine Begründung |
|---|---|---|---|
| 12 | Recommendation present? | yes | |
| 13 | Explains why it matters? | yes | |
| 14 | Specific directions given? | yes | |

### CDC — Part C: Numbers (15–17)

| # | Frage | Dein Verdikt | Deine Begründung |
|---|---|---|---|
| 15 | Numbers familiar/necessary? | yes | |
| 16 | Meaning of numbers explained? | no | |
| 17 | Must audience calculate? *(reverse)* | depends | user has to obey prescription |

### CDC — Part D: Risk (18–20)

| # | Frage | Dein Verdikt | Deine Begründung |
|---|---|---|---|
| 18 | Nature of risk explained? | teilweise | prinzipiell ja, konkret folgen und was dann zu tun wäre nicht |
| 19 | Risks **and** benefits addressed? | yes | |
| 20 | Numeric probability explained? *(N/A)* | n/a | |

---

## Danach

Vergleich gegen `docs/hand-scoring-ai-verdicts.md` → siehe `docs/hand-scoring-comparison.md`.
