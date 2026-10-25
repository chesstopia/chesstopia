---
type: adr
status: accepted
implementation: complete
updated: 2026-10-25
supersedes: []
verifies:
  - 'e2e/testlauf.ts :: export function szenario'
  - 'e2e/testlauf.ts :: export function gruppe'
  - 'e2e/korpus/__tests__/grenze.test.ts :: const GEPRUEFT'
  - 'e2e/app/spieler.ts :: export interface Spieler'
  - 'e2e/app/spieler.ts :: abgelehnt'
  - 'e2e/playwright.config.ts :: mechanik'
---

# ADR-0030: Schichtung der E2E-Tests

## Status
Accepted

## Context
Die E2E-Tests unter `e2e/` sprachen Playwright an jeder Stelle direkt: `page.locator`, `expect.poll` und `page.mouse` standen mitten in den Specs, Hilfen lagen in einem `support/`-Ordner neben den Specs. Jeder Test kannte damit die Oberfläche bis auf den Selektor und das Playwright-Warteverhalten. Zwei Folgen: Ein Wechsel des Testwerkzeugs hätte jede Datei berührt, und ein Test las sich wie Browser-Steuerung statt wie eine Spielsituation.

Mit CHESS-19 (Einladungslink, zweiter Spieler, Push über `/ws`) kam ein Test dazu, der zwei Spieler mit je eigener Browser-Sitzung braucht. Die Rolle steht im `localStorage`, ein gemeinsamer Kontext genügt nicht. Das verlangte ohnehin einen Begriff für „Spieler" im Testcode.

Ziel ist, nicht stärker als nötig an Playwright gebunden zu sein: Ein Frameworkwechsel soll die Zugriffsschicht und den Runner-Wrapper betreffen, nicht die Tests.

## Considered Options
- **A — Playwright-`test` direkt in den Tests.** Kein Wrapper, kein Aufwand. Verworfen: Die Bindung an Playwright bliebe in jeder Spec, und die Grenze wäre nicht prüfbar.
- **B — Eigener Runner und eigenes Assertion-Modul.** Volle Unabhängigkeit. Verworfen: Reporting, Traces und Parallelisierung müssten nachgebaut werden, ohne dass ein Wechsel absehbar ist.
- **C — Dünner Wrapper um den Playwright-Runner, Erwartungen als fachliche Methoden der Zugriffsschicht.** Gewählt.
- **Tests sprechen direkt mit Seitenobjekten und halten Sitzungen selbst.** Verworfen: Jeder Test müsste Kontexte anlegen und schließen und den Spieler-Begriff selbst nachbilden; die Wartelogik verteilte sich.
- **Volles Screenplay-Muster.** Verworfen: mehr Abstraktion (Akteure, Fähigkeiten, Aufgaben), als die Tests brauchen.

## Decision
Die E2E-Tests liegen in drei Schichten, von unten nach oben:

```
modell/            reines TypeScript, keine Abhängigkeit
app/               Zugriffsschicht — einzige Schicht mit Playwright
tests/, korpus/    Testschicht — nur modell/, app/, testlauf.ts
```

**`modell/`** trägt die Fachbegriffe in deutschen Bezeichnern nach [docs/context.md](../context.md): Farbe, Feld, Figur, Zug, Stellung, Zuganzeige, Partie. Die Übersetzung von `data-piece` und Oberflächentexten in diese Typen liegt ausschließlich in `app/`. Das Partieergebnis bleibt Text, so wie die Oberfläche ihn zeigt; ein eigener Ergebnistyp würde die Beschriftungen des Frontends doppelt pflegen.

**`app/`** ist die Zugriffsschicht. Oberste Ebene ist die Fassade `Spieler` mit eigener Browser-Sitzung; darunter Seiten und Komponenten, die Tests bei Bedarf direkt erreichen. Über ihre Schnittstelle gehen nur Typen aus `modell/` und Objekte aus `app/` — keine `Page`, kein `Locator`, kein `BrowserContext`. Fachliche Erwartungen (`erwarteStellung`, `erwarteZuganzeige`, …) sind Methoden hier; gewartet wird ausschließlich in `app/`, kein Test enthält ein explizites Warten.

**Warteverhalten.**
- `starteNeuePartie` und `trittBei` kehren erst zurück, wenn das Brett steht und das STOMP-Abo besteht.
- `ziehe` ist dreiteilig: warten, bis der Spieler am Zug ist; Zeigergeste; warten, bis der Zug angenommen ist. Erscheint stattdessen ein Fehler, scheitert `ziehe` sofort mit `<farbe>: Zug <von>-<nach> abgelehnt: <text>`. Eine Ablehnung, deren Text einem bereits sichtbaren Fehler gleicht, fällt erst beim Timeout auf; das steht im JSDoc.
- `versucheZug` führt nur die Geste aus und nimmt nichts über den Ausgang an. Wer absichtlich außer der Reihe oder gegen eine Sperre zieht, nimmt dieses.
- Fehlermeldungen tragen die Farbe des Spielers.

**`testlauf.ts`** ist der dünne Runner-Wrapper und neben `app/` die einzige Stelle, die `@playwright/test` importiert. Er exportiert `gruppe`, `pruefung` (ohne Browser), `szenario` (mit Fixture `neuerSpieler`) und `expect`, Letzteres nur für reine Werte in den Mechanik-Tests. Die Fixture schließt alle angelegten Sitzungen nach `use`, auch bei rotem Test. Die Playwright-Projekte bleiben; `mechanik` sammelt `modell/__tests__` und `korpus/__tests__`.

**Grenzwächter.** `korpus/__tests__/grenze.test.ts` durchsucht `tests/`, `korpus/` und `modell/` nach Importen von `@playwright/test` — auch nach reinen Seiteneffekt-Importen — und schlägt mit Datei und Zeile fehl. Erlaubt sind `app/**` und `testlauf.ts`. Die Schichtung ist damit ein Test, keine Absprache.

Der Korpus ([ADR-0029](0029-datei-getriebener-e2e-korpus.md)) läuft mit zwei Spielern über dieselbe Zugriffsschicht; das `.case`-Format und `e2e/testcases/` bleiben unverändert.

## Consequences
- Eine neue Spec importiert nie `@playwright/test`. Fehlt eine Fähigkeit, wächst `app/`, nicht die Spec. Wer die Grenze umgeht, sieht den Grenzwächter rot werden.
- Mehr Indirektion beim Debuggen. Die Fehlermeldungen müssen deshalb Spieler und fachliche Erwartung nennen; Playwright-Traces bleiben unverändert verfügbar.
- `ziehe` wartet auf das Zugrecht. Das ist gewollt, macht aber absichtliches Ziehen außer der Reihe zu einem `versucheZug`.
- Ein Wechsel des Testwerkzeugs betrifft `app/` und `testlauf.ts`. Die Tests bleiben, soweit die neue Welt dieselben Begriffe liefert; ein Wechsel des Runners ist nicht geplant und nicht vorbereitet über das Genannte hinaus.
- `expect` bleibt Playwrights, mit Jest-kompatibler API; ein Wechsel etwa zu Vitest wäre dort ein Import-Tausch.
- Nicht Gegenstand: weitere Browser-Projekte, Änderungen an Frontend, Backend oder CI.
