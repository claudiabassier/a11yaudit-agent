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

## AI-Abweichungen — Fixture 1 (die eigentlich interessanten Fälle)

| Item | Dein Verdikt | AI-Verdikt | Erste Einordnung |
|---|---|---|---|
| PEMAT 6 (Zahlen klar) | fail | pass | Du: „BD völlig unklar" — bezieht sich auf die Abkürzung, nicht die Zahlen selbst (5 mg, 25 Grad). Wert, ob PEMAT 6 wirklich für Abkürzungsprobleme zuständig ist oder eher PEMAT 3/4. |
| PEMAT 7 (keine Berechnung nötig) | fail | pass | Du: „Mengenangabe unklar" — ähnliche Frage wie oben, ob das Item 7 (Berechnung) oder eher 3/4/6 trifft. |
| CCI 2 (Hauptbotschaft am Anfang) | pass | fail | Du: „relativ am Anfang" — die AI bewertet vermutlich strenger („Seite beginnt mit Werbeinhalt, nicht der Botschaft"), was zum Seiteninhalt passt (Werbeabsatz zuerst). |
| CCI 11 (bekannt/unbekannt erklärt) | pass | fail | Du: „Fachsprache" als Begründung — passt nicht ganz zur Frage selbst (geht um Wissensgrenzen, nicht Sprachniveau). Wert, das Item nochmal genau zu lesen. |
| CCI 17 (Berechnung nötig, reverse) | pass | not_applicable | Du: „je nach individueller Verordnung" — AI sieht keine Berechnung im Text selbst. Unterschiedliche Referenzrahmen (Text selbst vs. reale Nutzungssituation). |
| CCI 20 (numerische Wahrscheinlichkeit) | not_applicable *(„n7a", vermutlich Tippfehler)* | fail | Getippter Wert unklar — bitte bestätigen, ob `n/a` gemeint war. |

## AI-Abweichungen — Fixture 2 (nur drei, alle einen zweiten Blick wert)

| Item | Dein Verdikt | AI-Verdikt | Erste Einordnung |
|---|---|---|---|
| CCI 7 (alle Fachbegriffe erklärt) | pass | fail | AI: „'NSAID' in Anführungszeichen, aber nicht ausgeschrieben; Medikamentenname fehlt ganz." Liest sich wie ein begründeter, spezifischer AI-Fund — wert, den Seitentext nochmal genau danach zu prüfen. |
| CCI 16 (Bedeutung der Zahlen erklärt) | fail | pass | Gegenteiliger Fall zu oben — hier warst du strenger als die AI. |
| CCI 19 (Risiken UND Nutzen adressiert) | pass | fail | AI: „nur Risiken werden genannt, nie der Nutzen der Einnahme." Bereits im Antwortschlüssel als Auffälligkeit vermerkt (siehe `hand-scoring-ai-verdicts.md`) — dieselbe Frage entsteht jetzt unabhängig aus deinem Scoring. |

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

Die AI-Abweichungen oben (9 Fälle) sind die eigentlichen Kandidaten für die ersten LLM-Eval-Testfälle (Woche 2) — bitte pro Fall kurz entscheiden, ob du oder die AI vermutlich richtig lag, und ob es ein echter AI-Fehler, ein Formulierungs-/Interpretationsunterschied, oder eine berechtigte AI-Erkenntnis war (wie bei CCI 7/19 in Fixture 2, wo die AI-Begründung konkret und nachvollziehbar klingt).
