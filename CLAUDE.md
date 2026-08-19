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

*Ursprünglich als Zielzustand von Sprint-Schritt 1/2 formuliert (unmittelbar nach dem Kopieren des Repos, vor dem ersten Commit) — inzwischen umgesetzt, dieser Absatz war seither nicht mehr aktualisiert worden (dieselbe Art Drift, die diese Datei selbst an anderer Stelle als Fehlerklasse benennt). **Erneut gedriftet, jetzt zum zweiten Mal korrigiert (16. August):** dieser Absatz nannte noch `iteration-1-subworkflow-refactor` als aktiven Branch — der wurde an Tag 8 in `main` gemerged, `main` markiert seither den fertigen Phase-1-Stand. Aktuelle Arbeit (Phase 2) läuft auf `iteration-2-claude-code`, von `main` abgezweigt — siehe `git log`/`git branch --show-current` oder `A11yAudit_Fahrplan.md` für den echten aktuellen Stand, nicht diesen Absatz.*

- ~~Tag `v1.3-capstone` soll den eingereichten Stand markieren, sobald der erste Commit steht.~~ Erledigt.
- ~~Arbeit soll auf Zweigen laufen, nicht direkt auf `main`.~~ Erledigt (`iteration-1-subworkflow-refactor` für Phase 1, inzwischen in `main` gemerged; `iteration-2-claude-code` für Phase 2, aktiv).
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
| `postgres_schema.sql`, `postgres_schema_addendum.sql` | Schema — 5 Tabellen (v2.1: `audit_runs` neu, Phase 2 Woche 1a, D-63), 2 Views |
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

- ~~**D-36:** Wird Text eingefügt (kein Markup) *und* ist die AI nicht verfügbar, wird kein Kriterium geprüft — der Score wird trotzdem als 100 ausgegeben.~~ Erledigt 13. August, `decision_log.md` D-59 — `screening_score`/`screening_score_deterministic` sind jetzt `null` (Report zeigt „not computable", wie die Instrument-Subscores schon immer). Die Sicherheit hing nie daran: der Prescreen feuert trotzdem.
- **Regel R4** (Score unter 70) feuert auf dem *kombinierten* Score. Bei drei Läufen mit identischem Input ergab er 42, 72, 65 — R4 feuerte, feuerte nicht, feuerte. Der deterministische Score blieb konstant bei 100.
- **`instrument_items`** wurde entworfen und aus Zeitgründen gestrichen (Node 15; siehe `decision_log.md` D-14, D-20, D-34). Item-Verdicts stehen im Report, sind aber nicht abfragbar.
- ~~**`screening_score_deterministic`** wird berechnet und ausgegeben, hat aber keine Datenbankspalte.~~ Teilweise erledigt 16. August, `decision_log.md` D-63 — Spalte existiert jetzt auf `audit_runs` (genau die Lösung, die `02_Sprintplan.md` für dieses „Future work #3" vorgesehen hatte). `audits` selbst hat sie weiterhin nicht — bewusst so, `audit_runs` ist die richtige Ebene dafür (Lauf-für-Lauf-Vergleich, nicht der aktuelle Stand).
- ~~**Fetch-Failure-Pfad** ist verdrahtet, aber nie als Test ausgeführt.~~ Erledigt 13. August, `decision_log.md` D-57 — vier Fälle im Production-Modus gegen `WF1-dev` bewiesen.
- **Das Intake-Formular** bestätigt Empfang, nicht Erfolg — n8n antwortet „Form Submitted", bevor der Workflow läuft.
- **Genauigkeit ist ungemessen.** Kein Vergleich gegen menschliche Auditoren.
- ~~**Keine Lauf-Ebene.** `audits` hält eine Zeile pro Inhalt; beim Re-Run werden `dropped_unverified`, `screening_score` und die Subscores überschrieben.~~ Erledigt 16. August, `decision_log.md` D-63 — `audit_runs` gebaut, verdrahtet, per echtem Testlauf verifiziert (`run_no: 5`, plausible Scores, `triggered_rules: {R1,R4,R7,R8,R9}`). `ai_input_tokens`/`ai_output_tokens`/`ai_cost_usd` bleiben `NULL` — separate, größere Lücke (SUB-As Output-Contract fehlt dafür ein Feld), bewusst nicht mit dieser Aufgabe geschlossen.

**Bestätigter Stand der Datenbank** (geprüft): `postgres_schema_addendum.sql` ist vollständig eingespielt, alle fünf Zusatzspalten existieren. 6 Audits, alle mit `checks_engine` befüllt, 3 davon mit `dropped_unverified > 0`.

**Beobachtung aus den Daten:** Der korrigierte Zwilling steht bei kombiniertem Score 38 (deterministisch 100), die schlechte Fixture bei 0. Der E11-Testlauf steht bei 100, obwohl kein Kriterium geprüft wurde — das ist D-36 in der Praxis.

~~**Veraltete Dokumentation:** Die Referenz-Upsert-Query am Ende von `postgres_schema.sql` listet 26 Spalten und kennt weder `dropped_unverified` noch `checks_engine` noch `status`. Node 13a schreibt alle drei (D-26). Beim nächsten Anfassen mitziehen.~~ Erledigt 16. August, `decision_log.md` D-63 — beim „nächsten Anfassen" (genau die `audit_runs`-Arbeit) tatsächlich mitgezogen: Referenz-Query korrigiert, jetzt `json_populate_record`-Mechanismus statt der falschen `$1..$26`-Positionsliste, direkt gegen `workflows_export/WF1_Audit_Intake.json` verifiziert statt nochmal geraten.

---

## Aktueller Arbeitsstand

Sprint zur Aufarbeitung der Review-Punkte. Reihenfolge:

1. Repo sauber aufsetzen, Credential-Sweep (Schwerpunkt `screenshots/` und `meta/`)
2. Entwicklungsumgebung aufsetzen: Tag `v1.3-capstone`, Arbeitszweig, Workflows in n8n duplizieren, Datentrennung entscheiden
3. Regressionsbasis unter `tests/golden/` aus den bestehenden Fixtures
4. **Geteilte Validierungs-Subworkflow** — `Validate Output` und `Validate Output2` enthalten dieselbe Logik doppelt. *Erledigt auf `-dev` (12. August, `decision_log.md` D-55): eine Subworkflow `SUB-A_Validate-dev`, zwei Aufrufstellen, D-A und D-H strukturell mit geschlossen. Reparaturpfad-Aufruf im Live-Editor nicht beobachtbar (n8n-Pin-Einschränkung wie D-38) — Lücke offen benannt, nicht verschwiegen. `workflows_export/*.json` (Original) unverändert.*
5. Fetch-Failure-Pfad nachweisen, im Format der bestehenden Failure-Path-Records. *Erledigt (13. August, `decision_log.md` D-57): vier Fälle im Production-Modus gegen `WF1-dev` bewiesen — unroutbare Adresse, nicht auflösbarer Host, HTTP 500, kein verwertbarer Inhalt. Geplanter öffentlicher Testendpunkt zweimal unzuverlässig, auf lokalen Docker-Stub umgestellt, Abweichung dokumentiert statt verschwiegen. `readme.md` aktualisiert.*
6. D-36 beheben. *Erledigt (13. August, `decision_log.md` D-59): `screening_score`/`screening_score_deterministic` sind `null` statt 100, wenn nichts geprüft wurde; R4 explizit gegen `null` abgesichert (analog R8). Isoliert getestet (Docker/Node, 5 Szenarien inkl. Regressionscheck gegen den ursprünglichen Day-4-Handrechnungsfall), `tests/golden` erneut PASS.*
7. Konzeptnotiz `docs/scoring-stability.md`. *Erledigt (13. August, `decision_log.md` D-60): drei Optionen für R4s verbleibende Instabilität gegeneinander abgewogen (Mechanismus, Wirkung, Kosten, Laufzeit, Nachteil, Erfolgsmessung je Option), mit echten Zahlen unterlegt (D-37s 42/72/65-Streuung, echte Node-Timing-Messung: AI-Call = 75s von 75,2s Gesamtlaufzeit). Bewusst keine Empfehlung — Entscheidung offen. `readme.md` synchronisiert (Architekturabschnitt, Future-work-Liste), Autorenzeile bewusst unangetastet.*
8. Onepager als PDF. *Erledigt (13. August): `~/Desktop/a11yaudit-agent/A11yAudit_Onepager.pdf`, aus README destilliert, 1 Seite, außerhalb des Git-Repos (kein technisches Artefakt).*

**Sprint Phase 1 (Sprintplan Tag 1–8) damit vollständig abgeschlossen, `main` und `iteration-1-subworkflow-refactor` gleichauf und beide auf GitHub gepusht (13. August).** Zusätzlich am 13. August behoben, unabhängig von der Sprint-Reihenfolge: `decision_log.md` D-61 — „a deliberate evolution of" (Bezug auf ein früheres, unabhängiges Projekt) in `readme.md`/`capstone_proposal.md` korrigiert; später (D-73, 18. August) ganz entfernt, da A11yAudit für sich steht und kein Vergleich zu einem anderen Projekt in die Doku gehört.

**Phase 2 stattdessen gewählt und läuft aktiv, auf `iteration-2-claude-code` (von `main` abgezweigt, 15. August):**

- Prompt-Injection-Mitigation + adversarialer Test. *Erledigt (15./16. August, `decision_log.md` D-62): `<material>`-Tags + explizite System-Prompt-Anweisung in `A2_build_prompt.js`, plus `code/_prompt_injection_harness.js` — echter Docker-Lauf bestätigt `human_review_required: true` trotz simulierter perfekter AI-Antwort.*
- `audit_runs` — eine Zeile pro Ausführung statt nur pro Inhalt. *Erledigt (16./17. August, `decision_log.md` D-63): Schema, Payload-Builder, Least-Privilege-Postgres-Rolle (`a11yaudit_app`) gebaut und funktional bewiesen, Canvas-Verdrahtung, Ende-zu-Ende mit echtem Formular-Lauf verifiziert (`run_no: 5`, `triggered_rules: {R1,R4,R7,R8,R9}`). `ai_input_tokens`/`ai_output_tokens`/`ai_cost_usd` bewusst noch `NULL` — separates, größeres Follow-up (SUB-As Output-Contract fehlt dafür ein Feld). Die Rolle war zu diesem Zeitpunkt gebaut, aber noch nicht im aktiven Einsatz — siehe D-66 unten.*
- `instrument_items` — Schreibpfad, seit v2.0 nie gebaut. *Erledigt (17. August, `decision_log.md` D-64): Payload-Builder `code/15a_build_instrument_items_payload.js`, dabei `domain`-Spalte erstmals befüllt (seit v2.0 nie von irgendeinem Code gesetzt, jetzt aus `knowledge_base.md`s Item-Bereichen abgeleitet). Canvas-Verdrahtung, Ende-zu-Ende verifiziert (38 Zeilen, beide Instrumente, alle 6 Domains, keine Duplikate).*
- `legally_relevant`-Fix + zwei Doku-Funde. *Erledigt (17. August, `decision_log.md` D-65): `R9` fehlte in der `legally_relevant`-Formel — behoben, an bestehendem Testfall verifiziert. Dabei gefunden: `tests/golden` war seit D-62 nicht re-baselined (jetzt nachgeholt), und `readme.md` behauptete fälschlich „keine Least-Privilege-Rolle", obwohl die (D-63) längst gebaut war — nur nie aktiv geschaltet.*
- Credential-Umstellung auf `a11yaudit_app` — der bei D-65 wiedergefundene, ursprünglich aus der 7-Schritte-Liste verlorene Schritt. *Erledigt (17. August, `decision_log.md` D-66): sechs Postgres-Nodes umgehängt (zwei mehr als ursprünglich gelistet — `Flag for Review`/`Save Report` fehlten). Unter den tatsächlich eingeschränkten Rechten verifiziert: `audit_runs` (kein `UPDATE`-Grant) erhöhte sich durch einen echten Testlauf korrekt von 5 auf 6.*
- Hand-Scoring der zwei Fixtures gegen AI-Verdikt. *Erledigt (17. August, `decision_log.md` D-67): beide Fixtures blind ausgefüllt, gegen `docs/hand-scoring-ai-verdicts.md` verglichen. Kombiniert 35/47 = 74.5 % Übereinstimmung (79.5 % bereinigt); voller Vergleich in `docs/hand-scoring-comparison.md`.*
- Erste reale Seite getestet, Content-Scoping-Bug gefunden und geschlossen. *Erledigt (18. August, `decision_log.md` D-68): `nhs.uk/medicines/paracetamol-for-adults/` als erste der 5–10 realen Seiten eingereicht — Navigation/Breadcrumbs wurden als Artikelinhalt extrahiert, `screening_score: 19`, `page_title` leer. Fix in `05_automated_checks.js`: `$scopeRoot` (`main`/`article`/`[role="main"]`, sonst `<body>` ohne `nav`/`header`/`footer`/`aside`) für die Content-Extraktion, WCAG-Checks bleiben whole-page. Live gegen dieselbe URL re-verifiziert: sauberer `content_text`, echter Dosierungs-Tippfehler auf der Live-Seite gefunden (`250ml/5ml` statt `250mg/5ml`). Gleichentags in einer eigenen strengen Review-Runde zwei weitere echte Fehler gefunden und behoben: der `<main>`-Zweig strippte verschachtelte Navigation nicht (nur der Fallback-Zweig tat das — an einer synthetischen Seite bewiesen und geschlossen), und ein vorbestehender Crash bei `id`-Attributen mit Anführungszeichen im Unlabelled-Input-Check (CSS-Selektor-String-Interpolation) — beide gegen `tests/golden` regressionsfrei verifiziert. `workflow_spec.md` → v2.8.*

- Regex-Fallback-Engine retired. *Erledigt (18. August, `decision_log.md` D-69): `05_automated_checks_regex.js` war seit Tag 1 nie im Einsatz (Umgebungsrisiko, das sie rechtfertigte, bestand nur bis zum Cheerio-Test am selben Tag) und lag nach D-68 drei bekannte Defekte hinter der Produktions-Engine, statt einem. Statt nachzuziehen: Datei plus `engine_drift.js`/`.sh` gelöscht, Referenzen in `05_automated_checks.js`, `readme.md`, `CLAUDE.md`, `meta/SYSTEM_PROMPT.md`, `code/18_generate_report.js` korrigiert. `tests/golden` danach erneut 3/3 PASS.*

- 5–10 reale Seiten abgeschlossen. *Erledigt (18. August, `decision_log.md` D-70): alle 10 Seiten (5 EN/5 DE) durchgelaufen. Unterwegs gefunden: D-68s zwei Review-Pass-Fixes waren nie nach n8n publiziert worden (per DB-Query bestätigt — publizierter Code 5.954 statt 22.196 Zeichen, Paste war abgeschnitten; Republish diesmal per `pbcopy` statt manueller Auswahl); NetDoktor danach live als erster echter Beleg für den Nav-in-`<main>`-Fix (Breadcrumb weg, `word_count` 1614→939). Drei tote/falsche URLs gefunden und korrigiert (CDC, gesundheitsinformation.de, gesund.bund.de). Wiederkehrender Formular-Fehler gefunden: `content_language` blieb bei vier DE-Einreichungen auf `en` stehen. Drei `screening_score: 0`-Ergebnisse per Hand gegen `findings`-Tabelle nachgerechnet, bestätigt kein Bug.*

- Auswertungskorpus, erste mittlere Tranche + systemischer SQL-Bug gefunden und gefixt. *Erledigt (18. August, `decision_log.md` D-71): "50–100" als Zielzahl hinterfragt (keine externe Vorgabe, nur "5–10 vor dem vollen Korpus" war im Review verankert) — Entscheidung für eine mittlere Tranche statt sofort volle Größe. 14 weitere, bewusst diverse Seiten (Charité, Krebshilfe, Herzstiftung u. a. neu dazu) automatisiert über den Formular-Webhook eingereicht (curl statt Klicken, Feldnamen sind intern `field-0`…`field-6`, kein festes `name`-Attribut für die Checkbox). 13/14 sauber, eine deckte einen echten Bug auf: vier von sechs Postgres-Nodes hatten eine Dokumentationszeile mit einem live ausgewerteten `{{ }}`-Ausdruck *innerhalb* eines SQL-Kommentars — n8n wertet Ausdrücke überall im Query-Text aus, auch in `--`-Kommentaren, wodurch ein AI-Finding mit eingebettetem Zeilenumbruch den Kommentar vorzeitig beendet und den Rest als echtes SQL geparst hat. Gefunden, auf allen vier Nodes gefixt (zwei Anläufe nötig — der erste Fix-Text enthielt selbst noch `{{ }}` und brach mit einem neuen, vageren Fehler), am ursprünglichen Fehlerfall verifiziert (0 → 14 Findings). `postgres_schema.sql`s passende Referenzzeile ebenfalls korrigiert. Gesamtstand: 24 reale Seiten verifiziert, kein festes Korpus-Ziel mehr.*

- Auswertungskorpus geschlossen bei 24 Seiten. *Erledigt (18. August, `decision_log.md` D-72): "50–100" war keine externe Vorgabe (nur "5–10 vor dem vollen Korpus" stand im 15.-August-Review, `A11yAudit_Arbeitslog.md:163`), die Zielzahl selbst tauchte erst im Budget-Eintrag vom 16. August auf, ohne dokumentierte Herleitung. Bewusst hier geschlossen statt weiter auf die Zahl hingearbeitet — zwei Tranchen haben bereits vier reale Defekte gefunden und behoben (D-68 Content-Scoping, D-69 Regex-Retirement, D-71 SQL-Comment-Bug), genug Ertrag. **Woche 1b (`5–10 reale Seiten` + `Auswertungskorpus`) damit komplett abgeschlossen.**

Als Nächstes laut Fahrplan: Woche 2 — Scoring-Stabilität und Kalibrierung (`docs/scoring-stability.md`), Minimal-LLM-Eval-Suite. **Repo bleibt privat, bis Phase 2 fertig ist.**

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

**Verzeichnisstruktur:** `workflows_export/` enthält vier Dateien, nicht drei (siehe Repository-Tabelle oben). Rest der Struktur deckt sich mit der Repository-Tabelle. `tests/golden/` existiert seit Sprint-Schritt 3 (12. August): Docker-basierter Regressionsrunner mit fixierter AI-Antwort (`./tests/golden/run.sh`) — siehe `decision_log.md` D-52. Der frühere `engine_drift.js` (cheerio- vs. Regex-Engine-Vergleich, D-53) ist seit 18. August entfernt — die Regex-Fallback-Engine wurde retired (D-69), da das Umgebungsrisiko, das sie rechtfertigte, seit Tag 1 nicht mehr besteht und sie nie eingesetzt wurde.
