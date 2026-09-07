---
type: adr
status: accepted
implementation: complete
updated: 2026-09-07
supersedes: []
verifies:
  - 'e2e/playwright.config.ts :: mechanik'
  - 'e2e/corpus/runner.ts :: runCase'
  - 'e2e/testcases/remis/patt.case :: banner      = Remis (Patt)'
  - 'build.gradle.kts :: --project=mechanik'
---

# ADR-0024: Datei-getriebener E2E-Korpus

## Status
Accepted

## Context
[ADR-0019](0019-teststrategie.md) macht Ebene 4 für jedes Feature zur Pflicht, das Frontend und Backend zugleich berührt. Gebaut waren vier handgeschriebene Specs; abgedeckt war davon der legale Zug, der clientseitig abgelehnte Zug und ein Schachmatt. Nicht abgedeckt: Rochade, en passant, Umwandlung, der zweite Mattausgang, jeder Remisgrund und der Fehlerpfad der Oberfläche.

Jedes weitere Szenario als eigene Spec zu schreiben, hätte den immer gleichen Rumpf vervielfacht — Partie anlegen, Zugfolge ziehen, Brett prüfen — und die Schachsituation zwischen Playwright-Aufrufen versteckt. Für die Engine ist dieselbe Frage in [ADR-0022](0022-datei-getriebener-engine-testkorpus.md) bereits beantwortet: Schachsituationen sind Daten, kein Code, und ein ASCII-Brett ist auf einen Blick lesbar.

Die Randbedingungen unterscheiden sich aber an zwei Stellen von der Engine. Erstens: Eine E2E-Situation lässt sich nicht aufsetzen. Es gibt keinen Endpunkt, der eine Stellung setzt, und [ADR-0020](0020-hexagonale-architektur-und-notationsfreie-domaene.md) schließt FEN aus. Zweitens: Die Prüfung sieht nicht die Engine-Stellung, sondern die gerenderte Oberfläche.

## Considered Options
- **Datei-getriebener Korpus, Zugfolge statt Ausgangsbrett, kein Codegen** — gewählt.
- **Weiter handgeschriebene Specs je Szenario** — verworfen. Neun Szenarien wären neun Kopien desselben Rumpfes; die Schachsituation läge in Playwright-Aufrufen statt in einer lesbaren Zeile, und der Aufwand je weiterem Fall bliebe konstant hoch statt auf eine Datei zu fallen.
- **Codegen wie in der Engine** — verworfen. Der Codegen dort existiert, weil `commonTest` in KMP weder Laufzeit-Dateizugriff noch parametrisierte Tests hat. Node hat beides. Ein Generat einzuführen, das keinen Zwang bedient, kostet einen Sync-Schritt, der vergessen werden kann. Die Analogie zur Engine ist die zum **Ergebnis** — eine Reportzeile je Datei —, nicht die zum Mechanismus.
- **Ein Test-Endpunkt, der eine Stellung setzt** — verworfen. Produktivcode, den nur der Test braucht, und eine zweite Art, eine Partie in einen Zustand zu bringen, die dann selbst geprüft werden müsste.
- **Die volle Engine-Grammatik übernehmen** (zwei Bretter, `ruleset`, Metazeile mit `castling`/`ep`/`hm`/`fm`) — verworfen. Verglichen wird die gerenderte Oberfläche, und die zeigt diese Felder nicht. Eine Erwartung, die mehr behauptet als die Prüfung sehen kann, ist eine Einladung zur Drift.
- **Vitest für die Prüfmechanik** (Parser, Brettleser, Driftwächter) — verworfen. Neue Abhängigkeit im `e2e`-Paket, zweite Konfiguration, zusätzlicher CI-Schritt — für einen Nutzen, den ein zweites Playwright-Projekt ohne all das bringt.
- **Eine zweite Browserspalte in CI** — verworfen. Verdoppelt die Laufzeit des Jobs für eine Fundklasse, die bisher keinen einzigen Befund geliefert hat. Firefox und WebKit bleiben konfiguriert und lokal aufrufbar.

## Decision
Ebene-4-Abdeckung wird von einem datei-getriebenen Korpus getragen. Eine Datei `e2e/testcases/<kategorie>/<name>.case` hält genau eine Schachsituation und ergibt genau eine Zeile im Testreport.

Eine Datei besteht aus Kopfzeilen `schlüssel = wert` und einem `BOARD`-Block mit acht Reihenzeilen. `moves` ist die Zugfolge **von der Startstellung**; der Block ist die erwartete Stellung danach. `turn` oder `banner` — genau eines von beiden — sagt, was die Oberfläche danach anzeigt; `error` fordert eine Fehlermeldung, `locked` eine zweite Geste, die wirkungslos bleiben muss.

Der Läufer spielt die Zugfolge als echte Zeigergesten, liest das gerenderte Brett in einer einzigen Auswertung im Browser und vergleicht es als **Text**: Ein Zeilendiff zweier ASCII-Bretter ist lesbar, ein Objektdump nicht.

Das Brettformat ist eine echte Teilmenge der Engine-Grammatik aus ADR-0022. Ein Driftwächter hält die Behauptung fest, indem er den Brettblock einer echten Engine-`.case` mit dem TypeScript-Brettleser liest.

Die Prüfmechanik selbst — Brettleser, Parser, Driftwächter — läuft als eigenes, browserloses Playwright-Projekt `mechanik` und in CI mit.

Was keine Schachsituation ist, bleibt eine handgeschriebene Spec: die verweigerte Zeigergeste auf eine fremde Figur und der Netzfehlerzweig. Der Smoke aus ADR-0019 bleibt unangetastet — die Deploy-Teilmenge darf nicht von Korpusmechanik abhängen.

## Consequences
Ein weiteres Szenario kostet eine Datei. Es gibt keinen Generierungsschritt und keine Registrierung, die vergessen werden kann.

Aufnahmekriterium für eine weitere Datei: eine Schachsituation, deren Ergebnis am Brett oder am Banner sichtbar ist und die kein tieferer Test schärfer prüft. Wo eine tiefere Ebene dieselbe Aussage schärfer trifft, entsteht keine Datei.

**Ausdrücklich nicht auf Ebene 4:** Die 50-Züge-Regel und ungenügendes Material — beide erfordern Zugfolgen, deren Kosten in keinem Verhältnis zum Zugewinn stehen; sie sind auf Ebene 1 im Engine-Korpus abgedeckt, ihr Bannertext auf Ebene 2. Ebenso die serverseitige Ablehnung eines illegalen Zuges: Der Hook prüft jeden Zug vor dem Request gegen die Engine, ein illegaler Zug erreicht das Backend nie. Um diesen Pfad auf Ebene 4 zu erzwingen, müsste die Client-Prüfung abgeschaltet werden — der Test prüfte dann eine Anwendung, die es nicht gibt. Diese Ablehnung bleibt auf Ebene 3. Ebene 4 prüft stattdessen den Netzfehlerzweig, den keine tiefere Ebene erreicht.

**Laufzeitbudget für den `e2e`-Job: 240 s Obergrenze, 210 s Alarmschwelle.** Der weitaus größte Teil ist Rüstzeit, nicht Prüfzeit. Wird die Alarmschwelle gerissen, ist das zu melden, nicht stillschweigend das Budget anzuheben.

Der Preis des gemeinsamen Playwright-Projekts: Die Mechaniktests fahren die `webServer`-Einträge mit hoch, obwohl sie weder Browser noch Backend brauchen. Bewusst in Kauf genommen — die Alternative wäre eine zweite Werkzeugkette.

Die Zugfolgen sind von Hand verifiziert. Schlägt eine fehl, ist zuerst die Folge zu prüfen: Die Schachregeln sind auf Ebene 1 abgedeckt und nicht Gegenstand dieser Ebene.
