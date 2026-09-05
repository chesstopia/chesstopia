---
name: tests
description: Schreibt die Tests zu einem gerade gebauten Feature — Ebenenwahl nach ADR-0019, Randfallkatalog der Schachdomäne, Gegenprobe gegen Mutation. Verwenden, wenn ein Feature fertig ist und abgesichert werden soll.
---

# Tests zu einem Feature schreiben

Kein Subagent, bewusst. Welcher Randfall zählt, steht in dem Gespräch, in dem
das Feature entstanden ist — ein kalt startender Agent leitet alles aus dem
Code ab und schreibt damit Tests, die die Implementierung nachzeichnen statt
sie zu prüfen ([ADR-0016](../../../docs/adr/0016-agenten-topologie.md)).

**Wo geprüft wird, entscheidet [ADR-0019](../../../docs/adr/0019-teststrategie.md).
Was geprüft wird, entscheidest du.** Dieses Skill liefert dafür die Mechanik
und ein Gedächtnis, keine Vollständigkeitsgarantie.

## 1. Ebene wählen

| Ebene | Wohin | Womit |
|---|---|---|
| 1 Unit | neben die Datei: `foo.test.ts`, `commonTest/`, `src/test/java/` | Vitest · `kotlin.test` · JUnit |
| 2 Komponente | neben die Komponente: `Chessboard.test.tsx` | Vitest (jsdom) + Testing Library |
| 3 Integration | `chesstopia-backend/src/test/java/…` | `WebTestClient` + Zonky |
| 4 E2E · Smoke | **noch nicht gebaut, aber fällig** — der Auslöser ist eingetreten | Playwright |

Ein Feature, das Frontend und Backend zugleich berührt, braucht Ebene 4. Solange
sie fehlt, wird das **benannt und nicht ersatzweise auf Ebene 3 nachgestellt** —
ein Integrationstest, der so tut, als sei er ein Durchstich, verdeckt genau die
Naht, um die es geht.

**Der Auslöser aus [ADR-0019](../../../docs/adr/0019-teststrategie.md) ist am
9. August 2026 mit dem Merge von PR #2 eingetreten**; `.github/workflows/ci.yml`
und die Compose-Dateien liegen auf `main`. Playwright ist damit kein Wartestand
mehr, sondern Rückstand — hier ist nicht länger zu warten, sondern zu bauen.

**Nicht getestet wird:** generierter Code (`openapi-client/src/`,
`build/generated/openapi/` — Verbot 1), Framework-Verhalten, und Zusicherungen,
die der Typprüfer schon gibt.

## 2. Randfälle durchgehen

Die Domäne liefert die Liste; sie ist der Grund, warum dieses Skill existiert.
Zutreffendes prüfen, Nichtzutreffendes übergehen — **die Liste ist kein Beweis
von Vollständigkeit.** Begriffe nach [docs/context.md](../../../docs/context.md).

**FEN und Stellung**
Ziffern sind Leerfelder, keine Figuren · leeres Brett · Teilstellung · Reihenfolge
(`board[0]` ist Reihe 8, Schwarz oben) · fehlende Rochaderechte (`-`) · fehlendes
En-passant-Feld (`-`) · Halbzug- und Vollzugzähler · syntaktisch kaputte FEN.

**Zugregeln** — sobald `RuleSet` legale Züge erzeugt
En passant nur unmittelbar nach dem Doppelschritt · Rochade nicht aus, durch
oder in ein Schach, nicht mit bewegtem König oder Turm · Unterverwandlung nach
Turm, Läufer, Springer · Umwandlung auf der letzten Reihe · gefesselte Figur ·
Zug, der den eigenen König im Schach lässt. Der ausführbare Katalog liegt
inzwischen in `chess-engine/testcases/`
([ADR-0022](../../../docs/adr/0022-datei-getriebener-engine-testkorpus.md)) —
eine neue Schachsituation wird eine neue `.case`-Datei, eine Verzweigung im
Regelcode ein gezielter Unit-Test daneben.

**Partieende**
Matt gegen Patt · 50-Züge-Regel · dreifache Stellungswiederholung · ungenügendes
Material.

**RuleSet**
Jede `Variant` einzeln · `enPassantEnabled: false` · `castlingEnabled: false` ·
die Kombination aus Variante und abgeschaltetem Toggle.

**Allgemein**
Leer, eins, viele · Grenzen 0 / 1 / Maximum · der Fehlerpfad, nicht nur der
Erfolgspfad · ein geworfener Nicht-`Error` aus der Netzwerkschicht.

## 3. Schreiben

**Frontend.** `defineConfig` kommt in der Vitest-Konfiguration aus
`vitest/config`, nicht aus `vite`. Vitest läuft hier **ohne** `globals: true` —
`describe`/`it`/`expect` werden importiert, und das Aufräumen der Testing
Library hängt an `src/test/setup.ts`. `vi.mock` wird über die Importe gehoben;
eine Referenz, die die Fabrik benutzt, gehört in `vi.hoisted`, sonst steht sie
in der temporalen Totzone.

Die Brettkomponenten tragen **keine ARIA-Rollen und keine Test-IDs**; abgefragt
wird über den gerenderten Inhalt. Wer eine Rolle braucht, ändert die Komponente
absichtlich und begründet — nicht im Vorbeigehen aus Testbequemlichkeit.

**Backend.** Kontexttests gegen die Datenbank brauchen
`@AutoConfigureEmbeddedDatabase`
([ADR-0012](../../../docs/adr/0012-embedded-postgres-fuer-tests.md)) — ohne die
Annotation läuft der Test gegen die echte Datenbank.

**Engine.** `kotlin.test` in `commonTest`, damit der Test auf beiden Zielen
läuft. Die vorhandenen Tests behaupten `NotImplementedError`; wer eine Funktion
implementiert, ersetzt den zugehörigen Platzhaltertest, statt einen zweiten
danebenzustellen. Der `getLegalMoves`-Platzhaltertest bleibt bestehen, die von
`validateMove`/`applyMove` sind ersetzt. Eine Perft-Abweichung ist immer ein
Zugerzeugungs-Fehler, nie eine falsche Erwartung.

## 4. Gegenprobe

**Ein grüner Test beweist nichts, solange er nicht einmal rot war.** Nach dem
Schreiben: die geprüfte Stelle im Produktivcode kaputtmachen, Tests laufen
lassen, Änderung zurücknehmen.

```
git checkout -- <datei>    # danach, immer
```

Fällt kein Test um, prüft der Test die Implementierung nicht, sondern sich
selbst. Dann wird er umgeschrieben oder gelöscht — nicht behalten, weil er
grün ist.

## 5. Ausführen

```
pnpm --filter chesstopia-frontend test
./gradlew :chesstopia-backend:test
./gradlew buildAll
```

## Was das Skript schon erzwingt

`checkDocs` bricht als **Regel 11** ab, wenn zu einem `*Controller.java` keine
`*IT.java`/`*Test.java` existiert oder zu einem Hook keine `*.test.ts`. Mehr
kann ein Skript nicht: Dass die Datei existiert, ist prüfbar — dass sie etwas
prüft, ist es nicht. Genau dafür gibt es die Gegenprobe in Schritt 4.

## Abbruch

Es gilt das Kriterium aus ADR-0019: **Eine Ebene, die über drei Läufe hinweg
keinen echten Befund geliefert hat, wird gestrichen — nicht optimiert.**
