# Antwortschlüssel — AI-Verdikte für den Hand-Scoring-Vergleich

**Nicht öffnen, bevor `docs/hand-scoring-worksheet.md` vollständig ausgefüllt ist.** Diese Datei zeigt, was die AI beim echten Lauf am 4. August tatsächlich geantwortet hat (Quelle: `demo_output/02_report_poor.md`, `demo_output/03_report_corrected.md` — unverändert seit dem Live-Lauf, nichts nachträglich angepasst).

`decided_by` zeigt, ob der jeweilige Wert deterministisch (Code) oder von der AI kam — nur `ai`-Zeilen sind für die eigentliche Genauigkeitsfrage relevant; deterministische Zeilen sind bei jedem Lauf reproduzierbar und keine AI-Leistung.

---

## Fixture 1 — `bp-meds-poor.html`

### PEMAT-P

| # | Verdikt | Entschieden von |
|---|---|---|
| 1 | fail | ai |
| 2 | fail | ai |
| 3 | fail | ai |
| 4 | fail | ai |
| 5 | fail | ai |
| 6 | pass | ai |
| 7 | pass | ai |
| 8 | fail | deterministic |
| 9 | pass | deterministic |
| 10 | fail | ai |
| 11 | fail | ai |
| 12 | pass | deterministic |
| 17 | fail | deterministic |
| 19 | fail | deterministic |
| 20 | pass | ai |
| 21 | fail | ai |
| 22 | fail | ai |
| 24 | not_applicable | ai |
| 25 | not_applicable | ai |

### CDC Clear Communication Index

| # | Verdikt | Entschieden von |
|---|---|---|
| 1 | fail | ai |
| 2 | fail | ai |
| 3 | fail | deterministic |
| 5 | pass | ai |
| 6 | fail | ai |
| 7 | fail | ai |
| 8 | fail | deterministic |
| 9 | pass | deterministic |
| 10 | fail | ai |
| 11 | fail | ai |
| 12 | pass | ai |
| 13 | fail | ai |
| 14 | fail | ai |
| 15 | pass | ai |
| 16 | fail | ai |
| 17 | not_applicable | ai |
| 18 | fail | ai |
| 19 | fail | ai |
| 20 | fail | ai |

---

## Fixture 2 — `bp-meds-good.html`

### PEMAT-P

| # | Verdikt | Entschieden von |
|---|---|---|
| 1 | pass | ai |
| 2 | pass | ai |
| 3 | pass | ai |
| 4 | fail | ai |
| 5 | pass | ai |
| 6 | pass | ai |
| 7 | pass | ai |
| 8 | pass | deterministic |
| 9 | pass | deterministic |
| 10 | pass | ai |
| 11 | pass | ai |
| 12 | pass | deterministic |
| 17 | pass | deterministic |
| 19 | pass | deterministic |
| 20 | pass | ai |
| 21 | pass | ai |
| 22 | pass | ai |
| 24 | not_applicable | ai |
| 25 | pass | ai |

### CDC Clear Communication Index

| # | Verdikt | Entschieden von |
|---|---|---|
| 1 | pass | ai |
| 2 | pass | ai |
| 3 | pass | deterministic |
| 5 | pass | ai |
| 6 | pass | ai |
| 7 | fail | ai |
| 8 | pass | deterministic |
| 9 | pass | deterministic |
| 10 | pass | ai |
| 11 | not_applicable | ai |
| 12 | pass | ai |
| 13 | pass | ai |
| 14 | pass | ai |
| 15 | pass | ai |
| 16 | pass | ai |
| 17 | pass | ai |
| 18 | pass | ai |
| 19 | fail | ai |
| 20 | not_applicable | ai |

---

## Auffällig, wert eines zweiten Blicks beim Vergleich

- **PEMAT 4 bei `bp-meds-good.html`: `fail`** — trotz der Korrektur. Die AI begründet das mit „NSAID" (in Anführungszeichen, aber nicht ausgeschrieben) und dem fehlenden Markennamen des Medikaments. Lohnt sich, unabhängig zu prüfen, ob das eine berechtigte, strenge Bewertung ist oder eine Überkorrektur — genau die Art Fall, die später als LLM-Eval-Testfall dienen kann.
- **CCI 19 bleibt bei beiden Fixtures `fail`** — auch bei der korrigierten Seite werden Nutzen nie explizit genannt, nur Risiken. Wert zu prüfen, ob das gerechtfertigt ist.
- **CCI 11 wechselt zwischen den Fixtures von `fail` zu `not_applicable`** — die AI begründet das damit, dass ein Patienten-Merkblatt (anders als eine Wissenschafts-Zusammenfassung) das Kriterium „was ist bekannt/unbekannt" gar nicht braucht. Wert eines eigenen Urteils, ob das eine konsistente Regelanwendung ist oder eine nachträgliche Rationalisierung.
