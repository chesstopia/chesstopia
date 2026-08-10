---
type: lesson
status: draft
updated: 2026-08-10
verifies:
  - 'chesstopia-frontend/src/lib/fen.ts :: export function parseFenBoard'
  - 'chesstopia-frontend/src/hooks/useBoardState.ts :: useState'
  - 'chesstopia-frontend/src/components/board/Chessboard.tsx :: board.flatMap'
  - 'chesstopia-frontend/vite.config.ts :: environment: "jsdom"'
---

# Wenn die Anzeige zur Wahrheit wird

## Das Problem

Eine Schachstellung passt in eine Zeile Text. Auf dem Bildschirm sind es vierundsechzig Felder. Dazwischen liegt eine Frage, die harmlos aussieht und es nicht ist: **Wem gehört die Wahrheit?**

Der naheliegende Weg ist, die Felder einmal zu bauen und danach zu pflegen. Ein Zug wird gespielt, also wird ein Feld geleert und ein anderes gefüllt. Das funktioniert, solange es einen Zug gibt. Bei der Rochade sind es vier Felder, bei En passant drei — davon eines, das niemand angefasst hat. Wer eine der Anwendungen vergisst, hat eine Anzeige, die eine Stellung zeigt, die nie gespielt wurde. Und der Fehler liegt nicht dort, wo er sichtbar wird, sondern in dem Zug davor, den niemand mehr findet.

Das eigentliche Problem ist damit nicht die Anzeige. Es ist, dass es **zwei** Stellungen gibt: die gespielte und die gezeigte. Zwei Wahrheiten, die auseinanderlaufen können — und keine Instanz, die den Moment bemerkt, in dem es passiert.

Man kann diesen Zerfall nicht wegtesten und nicht wegprüfen. Man kann ihm nur die Voraussetzung nehmen: **die zweite Wahrheit abschaffen.** Alles, was in dieser Lektion folgt, ist eine Antwort auf diese eine Bewegung — die Anzeige hört auf, ein Speicher zu sein, und wird eine Ableitung.

## Die Leiter

Fünf Sprossen, jede lauffähig, jede mit genau einer neuen Sache. Die sechste ist der Projektcode.

| Stufe | Neu dazu | Datei |
|---|---|---|
| 1 | Aus einer Zeichenkette wird eine Liste von Feldern — reine Funktion, keine Anzeige | [stufe-1.test.ts](../../learn-examples/03-frontend/stufe-1.test.ts) |
| 2 | Aus der Liste werden acht Reihen — die nullte ist die achte des Bretts | [stufe-2.test.ts](../../learn-examples/03-frontend/stufe-2.test.ts) |
| 3 | Aus dem Brett entstehen Knoten im Dokument — von Hand | [stufe-3.test.ts](../../learn-examples/03-frontend/stufe-3.test.ts) |
| 4 | Dieselben Knoten als *Beschreibung* statt als Anweisungsfolge | [stufe-4.test.tsx](../../learn-examples/03-frontend/stufe-4.test.tsx) |
| 5 | Die Stellung ändert sich, ohne dass jemand einen Knoten anfasst | [stufe-5.test.tsx](../../learn-examples/03-frontend/stufe-5.test.tsx) |
| 6 | **Projektcode** | [fen.ts](../../chesstopia-frontend/src/lib/fen.ts) · [useBoardState.ts](../../chesstopia-frontend/src/hooks/useBoardState.ts) · [Chessboard.tsx](../../chesstopia-frontend/src/components/board/Chessboard.tsx) |

`./gradlew pnpmLearnExamplesTest` lässt alle fünf laufen. Sie sind zum Kaputtmachen da: Eine Sprosse, die man nie geändert hat, hat man gelesen und nicht verstanden.

**Sprosse 1 und 2 — es gibt noch keine Anzeige.** Die Zeichenkette wird zu Feldern, die Felder zu Reihen. Eine Ziffer in der Zeichenkette ist keine Figur, sondern eine Anzahl leerer Felder — das ist die einzige Regel, die man kennen muss. Neu in Sprosse 2 ist allein die Reihenfolge: Die Notation beginnt oben, also ist die *nullte* Reihe die *achte* des Bretts. Wer das verwechselt, sieht ein gespiegeltes Brett und keinen Fehler.

**Sprosse 3 — hier beginnt das Dokument.** Was der Browser anzeigt, ist ein Baum aus Knoten; `document.createElement` erzeugt einen, `appendChild` hängt ihn ein. Aus vierundsechzig Feldern werden vierundsechzig Knoten, in einer Schleife, von Hand. Der dritte Test in der Datei ist der wichtige: Er spielt einen Zug — und führt nur die eine Hälfte aus. Die Figur ist angekommen und steht gleichzeitig noch dort, wo sie herkam. Nichts hat es gemeldet, denn es gibt niemanden, der es melden könnte. Das ist das Problem aus dem ersten Abschnitt, in acht Zeilen ausführbar.

**Sprosse 4 — dieselben Knoten, andere Grammatik.** Sprosse 3 sagt, *was zu tun ist*: erzeugen, füllen, anhängen. Sprosse 4 sagt nur noch, *wie es aussehen soll*. Das Ergebnis ist Knoten für Knoten dasselbe — und der Unterschied ist trotzdem der ganze Punkt: Wer die Knoten gebaut hat, kann sie auch ersetzen. Der letzte Test zeigt eine andere Stellung, ohne dass irgendwo ein Knoten angefasst wird. Es wurde etwas anderes *beschrieben*, der Rest ist Ableitung.

**Sprosse 5 — die Beschreibung braucht eine Quelle.** Eine feste Stellung zu beschreiben genügt nicht; sie soll sich ändern dürfen. `useState` gibt der Beschreibung einen Wert, der zwischen zwei Durchläufen überlebt — und macht damit die Knoten endgültig zur Folge statt zum Speicher. Der Test drückt einen Knopf und prüft beide Felder: das geräumte und das besetzte. Vergessen kann man hier nichts, weil es nichts zu tun gibt.

**Sprosse 6 — dieselben drei Rollen, im echten Code.** [fen.ts](../../chesstopia-frontend/src/lib/fen.ts) ist Sprosse 1 und 2: Umwandlung, rein, ohne Anzeige. [useBoardState.ts](../../chesstopia-frontend/src/hooks/useBoardState.ts) ist Sprosse 5: der Zustand — hier zusätzlich befüllt aus dem Backend, mit `loading` und `error` daneben. [Chessboard.tsx](../../chesstopia-frontend/src/components/board/Chessboard.tsx) ist Sprosse 4: die Beschreibung, aus der Knoten werden. Was in diesen Dateien sonst noch steht — Feldfarben, Rahmenmaße, die Aufteilung in `Square` und `Piece` — gehört nicht zum Lernziel dieser Lektion und wird hier nicht erklärt. **Die Leiter endet, wenn das Lernziel erschöpft ist, nicht, wenn die Datei erschöpft ist.**

### Und die Testebene, die fehlt

Die fünf Sprossen laufen unter jsdom — einer Nachbildung der Dokumentschnittstelle in Node, ohne Fenster, ohne Layout, ohne Schriftrendering. Das genügt für alles, was diese Lektion behauptet: Knoten entstehen, Knoten tragen Inhalt, eine Änderung am Zustand schlägt bis zum Knoten durch.

Es genügt für nichts, was ein Auge sieht. jsdom rechnet kein Layout aus; ein Brett, das im Browser übereinandergestapelt oder außerhalb des Bildschirms landet, ist unter jsdom vollkommen grün. Die Lücke ist keine Nachlässigkeit, sie ist eine benannte offene Ebene: [ADR-0019](../adr/0019-teststrategie.md) beschreibt vier Testebenen, und die vierte — echter Browser, echte Anwendung — **ist noch nicht gebaut**. Ihr Auslöser ist eingetreten; die Ebene ist damit Rückstand und nicht mehr planmäßige Lücke.

Wer das nicht weiß, liest eine grüne Pipeline als „die Oberfläche funktioniert". Sie sagt: *die Ableitung stimmt.* Das ist etwas anderes.

## Warum nicht anders

**Für die Rahmenwahl gibt es kein ADR — und das ist ein Befund dieser Lektion, kein Versäumnis ihres Autors.** Die Entscheidung für React ist nirgends im Repo als Entscheidung festgehalten. [ADR-0014](../adr/0014-minimaler-dependency-kern.md) begründet Sparsamkeit bei Abhängigkeiten, [ADR-0019](../adr/0019-teststrategie.md) begründet die Testebenen — die Wahl des Rahmens selbst ist nie aufgeschrieben worden. Diese Lektion kann sie deshalb nicht verlinken; sie kann nur sagen, gegen welche Alternativen sie steht.

- **Knoten von Hand pflegen** — die Ausgangslage aus Sprosse 3. Kostet keine Bibliothek und verschiebt die gesamte Sorgfalt auf den Menschen: Jeder Sonderfall der Spielregeln muss zusätzlich als Anzeigeoperation gedacht werden. Genau da entsteht die zweite Wahrheit.
- **Alles bei jeder Änderung neu bauen, ohne Abgleich** — löst die Richtigkeit und tauscht sie gegen Kosten: Der Baum wird vollständig verworfen, Auswahl und Eingabefokus gehen mit. Bei vierundsechzig Feldern wäre es tragbar; die Rechnung kippt, sobald die Darstellung wächst.
- **Gerichteter Fluss mit Abgleich** — der gewählte Weg. Beschrieben wird das Ergebnis, verglichen wird gegen den vorigen Stand, angefasst wird nur die Differenz. Man bezahlt einen Vergleich und kauft dafür die Unmöglichkeit, eine Änderung zu vergessen.

Für die Tests ist die Wahl dagegen begründet: [ADR-0019](../adr/0019-teststrategie.md) macht Ebene 2 — Komponenten und Hooks gegen ein Dokument — zur Pflicht, weil die Naht zwischen reiner Funktion und Darstellung hier die interessante ist. Ein Fehler an dieser Naht ist in `fen.ts` nicht sichtbar.

## Was davon überall gilt

Der Kern ist keine Bibliothek, sondern eine Richtung: **Zustand fließt in eine Darstellung, nie zurück.** Wo die Darstellung selbst zum Speicher wird, gibt es zwei Wahrheiten und keine Instanz, die ihren Zerfall bemerkt.

Der Satz gilt weit über Oberflächen hinaus. Ein Zwischenspeicher, der nebenher gepflegt wird statt aus seiner Quelle abgeleitet, hat dasselbe Problem. Eine denormalisierte Spalte, die bei jedem Schreibvorgang „mitgezogen" wird, ebenso. Eine Zahl in einem Dokument, die jemand von Hand aktuell hält — auch. Es ist immer dieselbe Gestalt: **eine Kopie, deren Pflege an Disziplin hängt statt an einem Mechanismus.**

Und die Rechnung wird nicht dann fällig, wenn man die Kopie einführt, sondern wenn jemand die **nächste** Operation dazuschreibt: Die vergessene Zeile steht nie in dem Code, der die Kopie angelegt hat, sondern in dem, der Monate später eine weitere Art hinzufügt, den Bestand zu ändern. Deshalb sieht Fortschreiben beim Einführen immer billig aus.

Die Gegenrichtung ist ebenfalls immer dieselbe: Ableiten kostet Rechenzeit, Fortschreiben kostet Richtigkeit. Wer ableitet, bezahlt bei jedem Durchlauf; wer fortschreibt, bezahlt einmal — und dann jedes Mal, wenn jemand einen Fall vergisst. Die erste Rechnung ist sichtbar und begrenzt, die zweite unsichtbar und offen. Deshalb ist Ableiten die Voreinstellung und Fortschreiben die Ausnahme, die man begründen muss.

### Transfer

- **Woran erkenne ich das Problem anderswo?** Immer dort, wo ein zweiter Ort dieselbe Information hält und *fortgeschrieben* statt *neu abgeleitet* wird. Der Verdacht ist begründet, sobald eine Änderung an einer Stelle eine Anweisung an einer zweiten nach sich zieht.
- **Welche Alternativen gehören zur selben Problemklasse?** Die Kopie von Hand pflegen · die Kopie bei jeder Änderung vollständig verwerfen · die Kopie ableiten und nur die Differenz anwenden. Drei Punkte auf einer Achse zwischen Aufwand und Verlässlichkeit, keine drei Meinungen.
- **Welche Randbedingung müsste sich ändern, damit ich anders entscheide?** Wenn das Ableiten teurer wird als der Abgleich — bei sehr großen Darstellungen, bei teurer Berechnung, bei Datenmengen, die nicht in den Speicher passen. Dann wird Fortschreiben wieder vertretbar, aber nur mit einer Instanz, die den Zerfall bemerkt.

**Aufgabe.** Nimm eine Aufgabenliste — Titel und ein Häkchen, mehr nicht — und schreibe sie zweimal in einer einzigen Datei, in reinem TypeScript, ohne Oberfläche: einmal so, dass „erledigt" den angezeigten Zähler *mitpflegt*, und einmal so, dass der Zähler bei jedem Lesen aus der Liste *abgeleitet* wird. Dann füge eine zweite Operation hinzu — „alle erledigen" —, aber nur in der abgeleiteten Fassung. **Fertig, wenn** du sagen kannst, welche Zeile in der fortgeschriebenen Fassung du hättest zusätzlich schreiben müssen, und was passiert wäre, wenn du sie vergisst.

Kein Projekt, keine Abhängigkeit, kein Buildskript: eine Datei in einem Kratzverzeichnis. Wenn dafür ein Gerüst nötig scheint, ist die Aufgabe zu groß geschnitten und wird kleiner geschnitten. Und sie braucht weder React noch ein Dokument — wenn doch, war das Werkzeug der Lerngegenstand und nicht das Verfahren.

### Selbsttest

- Warum ist eine Anzeige, die man fortschreibt, schwerer richtig zu halten als eine, die man neu ableitet — und woran genau scheitert sie?
- Was kostet der Abgleich zwischen zwei Beschreibungen, und wogegen ist dieser Preis eingetauscht?
- Warum kann eine nachgebildete Dokumentumgebung nicht beantworten, ob etwas im Browser funktioniert?

## Weiter

- [Lernpfad](index.md) — die übrigen Lektionen
- [ADR-0019](../adr/0019-teststrategie.md) — die vier Testebenen und der Auslöser für die vierte
- [ADR-0014](../adr/0014-minimaler-dependency-kern.md) — warum der Abhängigkeitskern klein bleibt
