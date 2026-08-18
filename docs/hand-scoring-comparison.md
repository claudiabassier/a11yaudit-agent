# Hand-Scoring vs. AI-Verdikt — Vergleich (17. August 2026)

Erste echte Accuracy-Messung des Projekts. Quellen: `docs/hand-scoring-worksheet.md` (unabhängiges Urteil der Autorin, blind — ohne vorherige Kenntnis der AI-Antworten) gegen `docs/hand-scoring-ai-verdicts.md` (echte AI-Verdikte vom 4. August, aus `demo_output/02`/`03`).

## Ergebnis auf einen Blick

| | Items gesamt | Fehlend | „Teilweise"/„depends" (nicht gezählt) | **AI-Urteile: Übereinstimmung** | Deterministische Checks: Übereinstimmung |
|---|---|---|---|---|---|
| Fixture 1 — `bp-meds-poor.html` | 38 | 1 | 9 | **12/21 = 57.1 %** | 3/7 = 42.9 % |
| Fixture 2 — `bp-meds-good.html` | 38 | 0 | 5 | **23/26 = 88.5 %** | 7/7 = 100 % |
| **Kombiniert** | 76 | 1 | 14 | **35/47 = 74.5 %** | 10/14 = 71.4 % |

**Bereinigt um einen Methodik-Fehler im Arbeitsblatt** (siehe unten — drei CCI-Part-A-Items wurden mit `N/A` beantwortet, was die CDC-Regel für diesen Teil nicht zulässt): Fixture 1 **12/18 = 66.7 %**, kombiniert **35/44 = 79.5 %**.

**Diese Zahlen sind ein erster Datenpunkt, keine validierte Genauigkeitsangabe** — Stichprobe von zwei Fixtures, ein einzelner menschlicher Rater, keine Zweitbewertung (PEMAT sieht offiziell zwei unabhängige Rater vor, siehe `readme.md` „What it is not"). Wert liegt vor allem in den konkreten Abweichungsfällen unten, nicht in der Prozentzahl selbst.

**Zusätzlicher Rater-Vorbehalt, von der Autorin selbst benannt:** Die Raterin verfügt über medizinisches Fachwissen und liest die Fixtures dadurch vermutlich anders als eine Person aus der eigentlichen Zielgruppe (Patient:innen mit durchschnittlicher bis niedriger Gesundheitskompetenz) — genau die Perspektive, aus der PEMAT/CCI offiziell bewertet werden sollen. Die AHRQ-Anleitung („stell dir vor, du kennst dich nicht aus") mildert das, hebt es aber nicht vollständig auf; das ist eine anerkannte, reale Einschränkung von Fachrater:innen, kein Fehler dieser Messung. Beobachtung, die dagegen spricht, dass dies hier stark ausschlägt: bei Fixture 1 (der fachsprachlich dichtesten Seite) war die Raterin bei den Abweichungen tendenziell **strenger** als die AI (PEMAT 6, 7), nicht nachsichtiger — wäre Fachwissen die dominante Verzerrung, wäre die AI eher strenger als der Fachrater zu erwarten gewesen bei Jargon-lastigen Passagen. Kein Beweis der Bias-Freiheit, aber die naheliegende Richtung zeigt sich hier nicht.

**Damit wird ein bereits dokumentiertes Limit konkret, nicht neu erfunden:** `readme.md` „What it is not" nennt seit Projektbeginn „Single-rater design, not PEMAT's normal two" — PEMAT sieht offiziell zwei unabhängige, trainierte Rater:innen mit gemessener Inter-Rater-Übereinstimmung vor. Diese Messung hier hat genau einen Rater (plus die AI als zweite „Stimme", aber nicht gleichwertig unabhängig, da sie dasselbe Item denselben Text liest). Ein sinnvoller nächster Schritt, falls das Format wiederverwendet wird: dasselbe Arbeitsblatt von einer zweiten Person ohne medizinischen Hintergrund unabhängig ausfüllen lassen — das würde eine echte Mensch-zu-Mensch-Inter-Rater-Quote liefern, gegen die sich die Mensch-zu-AI-Quote oben erst richtig einordnen lässt (eine 74,5-%-Übereinstimmung ist nur dann auffällig niedrig, wenn zwei Menschen sich untereinander deutlich häufiger einig wären).

## Ein Setup-Fehler, der die Fixture-1-Zahl nach unten zieht

`docs/hand-scoring-worksheet.md` hat beim Erstellen nicht vermerkt, dass **CDC Clear Communication Index Part A (Items 1–11) laut eigener Regel „applies to all materials"** — kein `N/A` vorgesehen, anders als Parts B/C/D. Die Autorin hat CCI 5, 6 und 12 (alle Part A oder direkt angrenzend) mit `N/A` beantwortet, was gegen diese Regel verstößt. Das ist ein Lücke im Arbeitsblatt, nicht ein Fehler der Bewertung selbst — nachträglich notiert für die nächste Runde, falls das Format wiederverwendet wird.

## AI-Abweichungen, final beurteilt (17. August, nach Einzeldurchsicht)

Jeder Fall einzeln durchgegangen — Item-Text und AI-Originalbegründung geprüft, dann von der Autorin selbst entschieden, wer vermutlich richtig lag. Nicht von mir vorentschieden, nur vorgeschlagen; die finale Spalte ist ihre Antwort.

| Item | Dein Verdikt | AI-Verdikt | AI-Begründung (Original) | **Adjudikation** |
|---|---|---|---|---|
| PEMAT 6 (Zahlen klar) | fail | pass | „The only numbers present are the dose (5 mg, 1 tablet) and storage temperature (25 degrees), which are simple and easy to understand without calculation." | **AI richtig.** Item fragt nach den Zahlen selbst, nicht nach der Abkürzung BD (das ist PEMAT 3/4). |
| PEMAT 7 (keine Berechnung nötig) | fail | pass | „No calculations are required of the user; the dose is stated as a fixed number of tablets." | **Autorin hält an eigenem Urteil fest.** Begründung: die individuelle Arztverschreibung wird im Text nicht berücksichtigt — der Patient muss die generische Anweisung gedanklich mit der eigenen Verordnung abgleichen, was das Item enger liest als nur „reine Arithmetik". Kein Konsens erzielt, echte Meinungsverschiedenheit über den Item-Umfang. |
| CCI 2 (Hauptbotschaft am Anfang) | pass | fail | „The first visible content is promotional material, not the main message about the medication." | **AI richtig.** Seite beginnt nachweislich mit Werbetext, nicht der Botschaft. |
| CCI 11 (bekannt/unbekannt erklärt) | pass | fail | „The material presents clinical facts but does not acknowledge any uncertainty or limitations in what is known about the medicine's effects." | **Kein klarer Sieger.** Autorin bestätigt „clinical facts" trifft zu, hält aber an der Fachsprache-Perspektive fest — Item fragt eigentlich nach Wissensgrenzen, nicht Verständlichkeit; beide Aspekte spielen im Text real eine Rolle, ohne dass einer klar dominiert. |
| CCI 17 (Berechnung nötig, reverse) | fail *(korrigiert — war fälschlich als „pass" normalisiert, siehe unten)* | not_applicable | „No calculations are required of the audience." | **Autorin hält an eigenem Urteil fest**, gleiche Begründung wie PEMAT 7 (individuelle Verordnung). |
| CCI 20 (numerische Wahrscheinlichkeit) | not_applicable *(bestätigt: „n/a" war gemeint, kein Tippfehler-Inhalt)* | fail | „No numeric probabilities are given in words or visually for any risk or side effect mentioned." | **Ungeklärt.** Nach Korrektur des Tippfehlers bleibt `not_applicable` vs. `fail` eine echte, unaufgelöste Abweichung — keine Einigung erzielt in dieser Runde. |

## AI-Abweichungen, final beurteilt — Fixture 2

| Item | Dein Verdikt | AI-Verdikt | AI-Begründung (Original) | **Adjudikation** |
|---|---|---|---|---|
| CCI 7 (alle Fachbegriffe erklärt) | pass | fail | „'NSAID' is not spelled out or explained in audience-friendly terms; the medicine name is also absent, leaving key specialised terms unexplained." | **Tendenz AI, aber knapp.** Autorin: „IBU wurde zuvor genannt, Grenzfall dahingehend, aber NSAID sollte trotzdem erklärt werden" — akzeptiert den AI-Punkt im Kern, sieht aber den Ibuprofen-Kontext als mildernden Faktor. |
| CCI 16 (Bedeutung der Zahlen erklärt) | fail | pass | „The meaning of the numbers is explained in plain terms (morning and evening, the table reinforces this)." | **Autorin hält an eigenem Urteil fest**, wieder mit Verweis auf die individuelle Verschreibungssituation. |
| CCI 19 (Risiken UND Nutzen adressiert) | pass | fail | „Only risks (overdose, side effects, drug interaction) are addressed; no benefits of taking the medication are stated." | **AI richtig.** Autorin bestätigt: „individuelles Textverständnis, würde AI zustimmen." |

**Zusammenfassung der Adjudikation:** von 9 Fällen — **3 AI eindeutig richtig** (PEMAT 6, CCI 2, CCI 19), **1 AI vermutlich richtig, knapp** (CCI 7), **3 Fälle, in denen die Autorin nach Prüfung an ihrem eigenen Urteil festhält** (PEMAT 7, CCI 16, CCI 17 — alle drei mit derselben, eigenständigen Begründung: das Material berücksichtigt nie die individuelle ärztliche Verschreibung, die von der generischen Anweisung abweichen kann), **2 ungeklärt** (CCI 11 — Interpretationsfrage ohne klaren Sieger; CCI 20 — nach Tippfehler-Korrektur weiterhin offen).

**Der wiederkehrende Punkt bei PEMAT 7/CCI 16/CCI 17 ist bemerkenswert, weil er dreimal unabhängig mit derselben Begründung auftaucht, nicht als Zufall.** Die Autorin argumentiert: keines der Items berücksichtigt, dass die tatsächlich verschriebene Dosis eines realen Patienten von der im Material gezeigten generischen Anweisung abweichen kann — das Material selbst adressiert diesen Abgleich nie. Das ist kein Bewertungsfehler ihrerseits, sondern eine eigenständige inhaltliche Beobachtung zum Material, die über die drei Einzelitems hinausgeht.

## Deterministik-Abweichungen (kein AI-Test — Markup-Proxy vs. Item-Semantik)

Nur bei Fixture 1, alle vier in dieselbe Richtung: die deterministische Prüfung zählt **Vorhandensein** von Markup (Überschriften, Listen), nicht **Qualität**.

| Item | Dein Verdikt | Deterministisch | Was die deterministische Prüfung tatsächlich zählt |
|---|---|---|---|
| PEMAT 9 (informative Überschriften) | fail | pass | „2 heading(s) present" — zählt nur die Anzahl, nicht ob die Überschriften wirklich informativ sind |
| PEMAT 12 (visuelle Hinweise) | fail | pass | Liste/Fettschrift/Kursiv vorhanden (die „Additional information"-Liste) — zählt Präsenz, nicht ob sie an der richtigen Stelle helfen |
| CCI 3 (Hauptbotschaft visuell hervorgehoben) | not_applicable | fail | Erste Sektion hat weder Überschrift noch Hervorhebung — hier stimmt die deterministische Einschätzung eher mit deinem Gesamteindruck überein als mit deiner N/A-Antwort |
| CCI 9 (in Abschnitte mit Überschriften gegliedert) | fail | pass | Gleiche Zählweise wie PEMAT 9 |

**Das ist eher ein Design-Befund als ein Genauigkeitsproblem:** die deterministischen Checks sind bewusst grob (schnell, reproduzierbar), aber „informativ" und „hilfreich platziert" sind Qualitätsfragen, die eine reine Zählung nicht beantworten kann. Wert, im Hinterkopf zu behalten, falls die Verbal-Labels (siehe Sprintplan Woche 2, Kalibrierung) überarbeitet werden.

## Nächster Schritt

**Erledigt (17. August).** Alle 9 Fälle einzeln adjudiziert, siehe Tabellen oben. Ergebnis: kein Fall ist ein eindeutiger, unstrittiger AI-Fehler — die drei „Autorin hält an eigenem Urteil fest"-Fälle sind eine konsistente inhaltliche Beobachtung (individuelle Arztverschreibung wird nie berücksichtigt), keine Zufallsstreuung, und damit die stärksten Kandidaten für die Woche-2-LLM-Evals. Die zwei ungeklärten Fälle (CCI 11, CCI 20) sind ebenfalls dokumentiert, aber bewusst nicht künstlich aufgelöst.
