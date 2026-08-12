# A11yAudit — Projektkontext

Selbst gehostete n8n-Automatisierung, die digitale Gesundheitsinhalte auf Barrierefreiheit und Verständlichkeit prüft. Eingabe: URL oder eingefügter Text. Ausgabe: priorisierte Befunde mit Belegen, getrennte Scores, Entwurf einer Barrierefreiheitserklärung, alles in Postgres.

Sprache im Dialog mit mir: Deutsch. Code, Kommentare und Dokumentation: Englisch (wie im Bestand).

Stil: knapp und direkt. Wörter streichen, die den Sinn nicht ändern. Kein Filler, kein Cheerleading.

---

## Pipeline

```
Form (URL oder Text)
  → deterministische HTML-Checks (9 WCAG-Kriterien, ohne AI)
  → Safety-Prescreen (Regex: Dosierung, Notfall, Risikobegriffe)
  → SUB-A: ein AI-Call, gegen striktes Schema validiert, mit sicherem Fallback
  → Decision Engine (deterministisches Scoring + 9 harte Regeln)
  → Postgres (audits · findings)
  → Report + Entwurf Barrierefreiheitserklärung
```

**Stack:** n8n (Docker Compose) · Postgres 16 · Anthropic `claude-sonnet-4-6`, Temperature 0, genau ein Analyse-Call · läuft vollständig lokal.

Code-Nodes brauchen `NODE_FUNCTION_ALLOW_EXTERNAL=cheerio` und `NODE_FUNCTION_ALLOW_BUILTIN=crypto` (in `docker-compose.yml` gesetzt).

---

## Unverhandelbare Invarianten

Diese Eigenschaften sind das Systemdesign, nicht Implementierungsdetails. Änderungen daran nur nach ausdrücklicher Rücksprache mit mir.

1. **Die AI schlägt vor, deterministische Regeln entscheiden.** Die AI bewertet Instrument-Items und schlägt Befunde vor. Sie entscheidet nichts, was zählt — Scoring, Eskalation und die Weiterleitung sicherheitskritischer Inhalte an einen menschlichen Prüfer laufen über feste Regeln.

2. **Der Safety-Prescreen läuft vor dem AI-Call.** Nicht danach, nicht parallel. Deshalb funktioniert die Sicherheitsroutine auch bei totem Modell.

3. **Fail safe.** Fällt die AI aus, endet der Audit mit „full human audit required" — er läuft durch, statt still zu scheitern.

4. **Evidenzverifikation.** Jeder Befund muss die Quelle wörtlich zitieren; das Zitat wird nach Whitespace-Normalisierung im Code gegen den tatsächlichen Text geprüft. Nicht auffindbare Evidenz wird **still verworfen, ohne Retry und ohne Repair-Angebot** — das Modell bekommt keine Gelegenheit, ein erfundenes Zitat zu verteidigen. Diese Eigenschaft nicht "verbessern".

5. **Deterministischer Vorrang.** Widersprechen sich Maschinenprüfung und AI, gewinnt die Maschinenprüfung — und der Widerspruch löst menschliche Prüfung aus.

6. **`screening_score_deterministic` ist das Ergebnis.** `screening_score` ist beratend und wird nie als Eigenschaft einer Seite zitiert. Die verbalen Labels des kombinierten Scores sind **nicht kalibriert**.

7. **Keine Konformitätsaussage.** Das Tool prüft eine benannte Teilmenge von WCAG 2.2. Instrument-Scores heißen „PEMAT-informed" / „CCI-informed" und sind eine unvalidierte Adaption. Weder AHRQ noch CDC unterstützen dieses Tool. Formulierungen, die das aufweichen, sind Fehler.

8. **Grounding statt Plausibilität.** Sprachbefunde beziehen sich auf benannte Items aus PEMAT-P und dem CDC Clear Communication Index. Item-Definitionen stehen in `knowledge_base.md` und stammen aus Primärquellen. **Erfinde niemals Item-Definitionen oder -Nummern.** Wenn etwas nicht in `knowledge_base.md` steht, sag es, statt zu ergänzen. In einer früheren Fassung wurden nicht existierende PEMAT-Items zitiert — dieser Fehlertyp ist im Gesundheitskontext fatal.

---

## Arbeitsregeln

- **Plan-Modus bei allem, was mehrere Dateien berührt.** Erst Plan zeigen, dann ändern.
- **Technische Schritte konkret und wörtlich erklären** — welches Fenster, welcher Button, welcher Befehl. Kein Tooling-Vorwissen voraussetzen (Terminal, Docker, n8n, SQL). Gilt pauschal, nicht nur für n8n/SQL-Neuland.
- **Scoring-Logik und die 9 harten Regeln nicht ohne Rückfrage anfassen.**
- **`decision_log.md` bei jeder Designentscheidung fortschreiben** — inklusive verworfener Alternativen und ihrer Nachteile. Das Log ist Teil des Produkts.
- **Dokumentation driftet still.** Wird ein Workflow geändert, immer auch `workflow_spec.md` und `readme.md` nachziehen. Prüfe gegen den exportierten Workflow, nicht gegen meine Statusnotizen. Versionsköpfe und Changelogs der betroffenen Dateien (`workflow_spec.md`, `decision_log.md`, `knowledge_base.md`, …) beim Bearbeiten mit hochzählen.
- **Adversarial testen, nicht bestätigend.** Tests sollen Fehler finden, nicht Bestehen erzeugen. Prüf besonders, ob ein Fehler in die *unsichere* Richtung fällt.
- **Nichts Geplantes als vorhanden dokumentieren.** Der Abschnitt *What it is not* im README ist eine Stärke, keine Schwäche — er bleibt vollständig.
- **Überclaiming aktiv erkennen, nicht nur vermeiden.** Konformitätsaussagen, „löst X für alle"-Framing, Reichweitenaussagen über den geprüften Teilbereich hinaus, PEMAT/CCI-Ausgabe als validierten Instrument-Score dargestellt — wo immer das auftaucht aktiv korrigieren, nicht nur an der gerade bearbeiteten Stelle. Vor jeder Veröffentlichung `meta/claims_check.sh` laufen lassen — vier falsche Behauptungen dieser Art sind im Projekt bereits durchgerutscht (`decision_log.md` D-41, D-43, D-45).
- **Faktenclaims vor Aufnahme in ein Dokument gegen Primärquellen prüfen** — nicht nur Instrument-Item-Nummern (Invariante 8), auch WCAG-Kriterien und Rechtsaussagen zu EAA/BFSG. Diese Fehlerklasse ist mehrfach aufgetreten (`decision_log.md` D-43, D-45).
- **Bei technischen Sackgassen kein offenes Debugging.** Zeitlimit setzen und einen Fallback benennen, bevor es losgeht (z. B. „30 Minuten, dann Umstieg auf X") — bewährtes Muster aus `decision_log.md` D-17.
- **Kein Secret ins Repo.** Keine Keys, Tokens, Verbindungsdaten, produktiven Webhook-URLs, realen Kundendaten. Das Repo ist derzeit privat, wird aber später öffentlich.
- **Der eingereichte Stand v1.3 wird nicht verändert.** Siehe Arbeitsumgebung.

---

## Arbeitsumgebung

Der begutachtete Stand (Version 1.3, 5. August 2026) bleibt unversehrt. Weiterentwicklung findet ausschließlich auf Kopien statt.

**Im Repo**

*Ursprünglich als Zielzustand von Sprint-Schritt 1/2 formuliert (unmittelbar nach dem Kopieren des Repos, vor dem ersten Commit) — inzwischen umgesetzt, dieser Absatz war seither nicht mehr aktualisiert worden (dieselbe Art Drift, die diese Datei selbst an anderer Stelle als Fehlerklasse benennt). Tatsächlicher Stand: Tag `v1.3-capstone` gesetzt, Arbeit läuft auf dem Branch `subworkflow-refactor` (nicht auf `main`), mehrere Commits vorhanden — siehe `git log` oder `A11yAudit_Fahrplan.md` für den aktuellen Stand, nicht diesen Absatz.*

- ~~Tag `v1.3-capstone` soll den eingereichten Stand markieren, sobald der erste Commit steht.~~ Erledigt.
- ~~Arbeit soll auf Zweigen laufen, nicht direkt auf `main`.~~ Erledigt (`subworkflow-refactor`).
- `workflows_export/v1.3-as-submitted/` als eingefrorenes Unterverzeichnis war so geplant, existiert aber nicht — die Exporte liegen weiterhin direkt in `workflows_export/`; laut „Verifizierte Referenz" unten (10.08.) unverändert original, das genügt bisher als Schutz.

**In n8n**

n8n kennt keine Versionierung — eine Änderung am importierten Workflow überschreibt das Original unwiderruflich. Deshalb existieren alle drei Workflows doppelt:

| Original | Entwicklung |
|---|---|
| Hauptworkflow (deaktiviert) | Hauptworkflow `-dev` |
| SUB-A (deaktiviert) | SUB-A `-dev` |
| WF-Error (deaktiviert) | WF-Error `-dev` |

**Zwei Fallen, die dabei regelmäßig auftreten — bei jeder Änderung mitprüfen:**

1. **Duplizierte Workflows zeigen weiterhin auf die Original-IDs.** Ein kopierter Hauptworkflow ruft über den Execute-Workflow-Node das *originale* SUB-A auf, nicht die Kopie. Dasselbe gilt für die Fehlerhandler-Einstellung. Nach jedem Duplizieren umhängen und verifizieren, dass tatsächlich die Dev-Variante läuft.
2. **Datentrennung.** Dev- und Originalvariante dürfen nicht in dieselben Audit-Daten schreiben. Die Idempotenz-Logik zählt bei identischem Inhalt hoch, statt eine neue Zeile anzulegen — Testläufe würden sonst Zeilen der Originaldaten verändern. Getrenntes Schema oder getrennte Datenbank verwenden.

Wenn eine Änderung ansteht, immer zuerst prüfen: Läuft sie auf der Dev-Variante, und schreibt sie in die Dev-Daten?

---

## Repository

| Pfad | Inhalt |
|---|---|
| `workflows_export/` | vier Dateien: die drei Pipeline-Workflows — Hauptworkflow (`WF1_Audit_Intake.json`), AI-Subworkflow (`SUB-A_AI_Analysis.json`), Fehlerhandler (`WF-Error.json`) — plus `_cheerio_test.json`, Testschrott aus Tag 1, kein Teil der Pipeline |
| `postgres_schema.sql`, `postgres_schema_addendum.sql` | Schema — 4 Tabellen, 2 Views |
| `code/` | JavaScript und SQL je Node, eine Datei pro Node, mit Ein-/Ausgabevertrag und Testeingabe |
| `code/_DAY0_REVIEW.md` | Code-Review vor dem Bau; acht selbst gefundene Defekte |
| `code/_S4_evidence_check_harness.js` | Harness für den Anti-Fabrication-Test |
| `fixtures/` | drei Testseiten: schlechte Patientenseite, korrigierter Zwilling, kurzes Merkblatt; Erwartungswerte in `fixtures/README.md` vorab notiert |
| `demo_output/` | generierte Reports, Vorher-Nachher-Vergleich, Failure-Path-Records |
| `screenshots/` | Ausführungsnachweise |
| `workflow_spec.md` | Node-für-Node-Dokumentation |
| `knowledge_base.md` | verifizierte Instrument-Items, WCAG-Scope, Safety-Begriffe, Quellen |
| `decision_log.md` | Designentscheidungen, verworfene Alternativen, korrigierte Behauptungen |
| `build_runbook.md` | reproduzierbare Bau- und Testprozedur |
| `PROJECT_STATUS.md` | Baustand, Übergabenotizen |
| `meta/` | Build-Session-Material inkl. System-Prompt des verwendeten KI-Assistenten |

---

## Bekannte Defekte und offene Punkte

Bewusst dokumentiert, nicht vergessen. Beim Arbeiten berücksichtigen.

- **D-36:** Wird Text eingefügt (kein Markup) *und* ist die AI nicht verfügbar, wird kein Kriterium geprüft — der Score wird trotzdem als 100 ausgegeben. Die Instrument-Subscores geben in dem Fall korrekt „not computable" aus. Die Sicherheit hing nie daran: der Prescreen feuert trotzdem.
- **Regel R4** (Score unter 70) feuert auf dem *kombinierten* Score. Bei drei Läufen mit identischem Input ergab er 42, 72, 65 — R4 feuerte, feuerte nicht, feuerte. Der deterministische Score blieb konstant bei 100.
- **`instrument_items`** wurde entworfen und aus Zeitgründen gestrichen (Node 15; siehe `decision_log.md` D-14, D-20, D-34). Item-Verdicts stehen im Report, sind aber nicht abfragbar.
- **`screening_score_deterministic`** wird berechnet und ausgegeben, hat aber keine Datenbankspalte.
- **Fetch-Failure-Pfad** ist verdrahtet, aber nie als Test ausgeführt.
- **Das Intake-Formular** bestätigt Empfang, nicht Erfolg — n8n antwortet „Form Submitted", bevor der Workflow läuft.
- **Genauigkeit ist ungemessen.** Kein Vergleich gegen menschliche Auditoren.
- **Keine Lauf-Ebene.** `audits` hält eine Zeile pro Inhalt; beim Re-Run werden `dropped_unverified`, `screening_score` und die Subscores überschrieben. Die schlechte Fixture hat `run_count` 6 und genau einen Messwert. Für Phase 2 ist eine Tabelle `audit_runs` beschlossen — eine Zeile pro Ausführung.

**Bestätigter Stand der Datenbank** (geprüft): `postgres_schema_addendum.sql` ist vollständig eingespielt, alle fünf Zusatzspalten existieren. 6 Audits, alle mit `checks_engine` befüllt, 3 davon mit `dropped_unverified > 0`.

**Beobachtung aus den Daten:** Der korrigierte Zwilling steht bei kombiniertem Score 38 (deterministisch 100), die schlechte Fixture bei 0. Der E11-Testlauf steht bei 100, obwohl kein Kriterium geprüft wurde — das ist D-36 in der Praxis.

**Veraltete Dokumentation:** Die Referenz-Upsert-Query am Ende von `postgres_schema.sql` listet 26 Spalten und kennt weder `dropped_unverified` noch `checks_engine` noch `status`. Node 13a schreibt alle drei (D-26). Beim nächsten Anfassen mitziehen.

---

## Aktueller Arbeitsstand

Sprint zur Aufarbeitung der Review-Punkte. Reihenfolge:

1. Repo sauber aufsetzen, Credential-Sweep (Schwerpunkt `screenshots/` und `meta/`)
2. Entwicklungsumgebung aufsetzen: Tag `v1.3-capstone`, Arbeitszweig, Workflows in n8n duplizieren, Datentrennung entscheiden
3. Regressionsbasis unter `tests/golden/` aus den bestehenden Fixtures
4. **Geteilte Validierungs-Subworkflow** — `Validate Output` und `Validate Output2` enthalten dieselbe Logik doppelt. *Erledigt auf `-dev` (12. August, `decision_log.md` D-55): eine Subworkflow `SUB-A_Validate-dev`, zwei Aufrufstellen, D-A und D-H strukturell mit geschlossen. Reparaturpfad-Aufruf im Live-Editor nicht beobachtbar (n8n-Pin-Einschränkung wie D-38) — Lücke offen benannt, nicht verschwiegen. `workflows_export/*.json` (Original) unverändert.*
5. Fetch-Failure-Pfad nachweisen, im Format der bestehenden Failure-Path-Records
6. D-36 beheben
7. Konzeptnotiz `docs/scoring-stability.md`

Danach (Phase 2): `instrument_items` persistieren, Auswertungskorpus, Scoring-Stabilität umsetzen, Kalibrierung.

---

## Verifizierte Referenz (Stand 10.08.2026)

Gegen `workflows_export/*.json`, `code/12_decision_engine.js` und `postgres_schema*.sql` geprüft — nicht aus dem README übernommen.

**Workflows (`name`-Feld, exakt):**

| Workflow | `name` | `id` |
|---|---|---|
| Hauptworkflow | `WF1 - Audit Intake` | `cplV72n5kJnDaP3S` |
| SUB-A | `SUB-A_AI_Analysis` | `4K342U3TtgqWWp6A` |
| WF-Error | `WF-Error` | `fv9YbvAy2rfKC2Ng` |

**Nodes WF1 (20, in Canvas-Reihenfolge):** `On form submission` · `Normalize Input` · `IF: source type` · `Fetch Page` · `Automated Checks` · `Prepare Text` · `Merge` · `Hash + Guard` · `Safety Prescreen` · `Call SUB-A` · `Merge Findings` · `Decision Engine` · `Build Audit Payload` · `Upsert Audit` · `Build Findings Payload` · `Insert Findings` · `If: human review?` · `Flag for Review` · `Generate Report + Statement` · `Save Report`

**Nodes SUB-A (12):** `When Executed by Another Workflow` · `Build Prompt` · `AI Analysis` · `Validate Output` · `Valid?` · `API Error?.` (Punkt ist Teil des Namens) · `Fallback.` (Punkt ist Teil des Namens) · `AI Analysis (repair)` · `Mark Attempt 2` · `Validate Output2` · `Valid 2?` · `Return`

**Nodes WF-Error (3):** `Error Trigger` · `Strip Payload` · `Insert error_log,` (Komma ist Teil des Namens)

**Validierungs-Nodes:** `Validate Output` (erster Durchlauf) und `Validate Output2` (zweiter Durchlauf, nach Repair) — Code byte-identisch (16.235 Zeichen), beide aus `code/A4_validate_output.js` in den Canvas kopiert. n8n-Code-Nodes können keine Sibling-Nodes per `require()` einbinden, daher die Duplikation — Ziel von Sprint-Schritt 4.

**Verdrahtung im Export:** `Call SUB-A` zeigt per `workflowId` hardcodiert auf `4K342U3TtgqWWp6A` (SUB-A_AI_Analysis' eigene ID). `settings.errorWorkflow` von WF1 und SUB-A zeigt auf `fv9YbvAy2rfKC2Ng` (WF-Errors eigene ID). Beides konsistent — das ist der eingereichte Originalzustand, keine Dev-Duplizierung im aktuellen Export.

**Tabellen (4, aus `postgres_schema.sql`):** `audits` · `findings` · `instrument_items` · `error_log`
**Views (2):** `v_review_queue` · `v_audit_summary`

`postgres_schema_addendum.sql` fügt nur Spalten hinzu, keine neuen Tabellen/Views: `audits.dropped_unverified`, `audits.checks_engine`, `findings.original_severity`, `findings.severity_upgraded_by`, `instrument_items.ai_contradiction`. `screening_score_deterministic` existiert nirgends als Spalte. Die Referenz-Upsert-Query am Ende von `postgres_schema.sql` listet 26 Spalten und enthält weder `dropped_unverified` noch `checks_engine` noch `status` (Node 13a schreibt alle drei zusätzlich, siehe D-26).

**R1–R9, Wortlaut aus `code/12_decision_engine.js`:**

```js
R('R1', findings.some((f) => f.severity === 'critical'));
R('R2', j.ai_fallback_used === true || j.ai_status === 'fallback');
R('R3', findings.some((f) => {
  if (f.severity !== 'critical' && f.severity !== 'high') return false;
  const c = Number(f.confidence);
  return (isFinite(c) ? c : 0) < 0.6;
}));
R('R4', screening_score < 70);          // kombinierter Score, nicht der deterministische
R('R5', j.eaa_scope === true);
R('R6', j.ai_disagreement === true);
R('R7', safety);                        // safety_context aus Node 9
R('R8', pemat_understandability !== null && pemat_understandability < 70);
R('R9', r9Trigger);                     // safety && (PEMAT-4 fail || CCI-7 fail)
```

Der R9-Upgrade auf `critical` (läuft vor der Score-Berechnung) matcht zusätzlich auf `wcag_criterion === '3.1.4'` oder `'3.1.3'` — breiter als reine Instrument-Tags (siehe `decision_log.md` D-30).

**Verzeichnisstruktur:** `workflows_export/` enthält vier Dateien, nicht drei (siehe Repository-Tabelle oben). Rest der Struktur deckt sich mit der Repository-Tabelle. `tests/golden/` existiert seit Sprint-Schritt 3 (12. August): Docker-basierter Regressionsrunner mit fixierter AI-Antwort (`./tests/golden/run.sh`) plus `engine_drift.js` (cheerio- vs. Regex-Engine-Vergleich) — siehe `decision_log.md` D-52/D-53.
