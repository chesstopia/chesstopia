---
type: adr
status: draft
implementation: partial
updated: 2026-08-10
supersedes: []
verifies:
  - 'gradle/check-docs.gradle.kts :: "lesson" to'
  - 'pnpm-workspace.yaml :: learn-examples'
---

# ADR-0020: Lernmaterial als eigene Gattung — `docs/learn/`, Komplexitätsleiter, Lernnachweis

## Status
Draft

Bewusst `draft` und nicht `accepted`. Eine Gattung festzuschreiben, von der noch kein Exemplar existiert, ist Vorratsbau — der Zug, den dieses Projekt sonst vermeidet. Solange die Entscheidung nicht gefallen ist, greift das Append-only-Verbot aus [CLAUDE.md](../../CLAUDE.md) nicht; der Körper darf sich noch an dem korrigieren, was das Schreiben der ersten Lektionen zutage fördert. `accepted` wird er, wenn die Form sich getragen hat.

## Context

Der Code dieses Repos ist überwiegend agentisch entstanden. Das verschiebt, wo Verstehen wegbleiben kann: nicht beim Tippen — es gibt kaum welches —, sondern in dem Sprung von *Problem* über *Agent* zu *funktionierendem Code*, an dessen Ende sich Verstehen einstellt, das keines ist. Der Code läuft, das Review war in Ordnung, die Entscheidung ist begründet, und trotzdem ist nichts davon abrufbar, sobald der Agent nicht dabei ist.

Die vorhandenen Gattungen schließen diese Lücke nicht, und sollen es auch nicht. Ein ADR erklärt eine Entscheidung **von innen**: warum *hier*, *damals*, unter *diesen* Zwängen. Es erklärt nie, *was* Kotlin Multiplatform ist. Eine Notiz hält fest, wie etwas konkret eingerichtet ist. Beide setzen voraus, was hier fehlt: das Feld, in dem die Entscheidung überhaupt lesbar wird.

Der Leser ist der Autor selbst, nachträglich. Er weiß bereits, *was* der Code tut — er hat ihn abgenommen. Offen ist: Zu welcher Problemklasse gehört dieses Verfahren, welche Alternativen gibt es darin, woran erkenne ich beim nächsten Mal, dass ich anders wählen muss, und was davon gilt außerhalb von Chesstopia.

Dagegen steht die Türschwelle aus CLAUDE.md. Sie ist gebaut für Wissen, das *nicht* redundant sein darf, und Lehrmaterial ist absichtlich redundant: Es erklärt, was der Code zeigt, für jemanden, der die Sprache des Codes noch nicht liest. Ohne eine ausdrückliche Entscheidung gäbe es zwei Auswege, und beide sind schlecht — die Türschwelle per Ordnergrenze umgehen, oder das Material gar nicht schreiben.

## Considered Options

- **`learn/` außerhalb von `docs/`, Vault-Wurzel auf Repo-Ebene** — löst die Türschwelle durch Umgehung statt durch Entscheidung und kostet einen Vault-Umbau. Abgelehnt: Eine Regel, der man durch Ordnerwahl entkommt, ist keine.
- **Lektionen als `notes/`** — `note` heißt „herausgefunden", nicht „erklärt". Der Typ trüge die Gattung falsch, und die Pflichtabschnitte ließen sich nicht prüfen, ohne alle Notizen mitzutreffen.
- **Gar nichts persistieren** — die Lücke ist real und wiederkehrend; sie fällt unter Türschwellenpunkt 3 (unnötige Recherche) und 5 (bereits getroffene Entscheidung erneut treffen).
- **Agent statt Skill für das Schreiben** — Bedingung 4 aus [ADR-0016](0016-agenten-topologie.md) (profitiert von Isolation) fällt: Das Urteil, was eine Lektion braucht, fällt beim Schreiben, im selben Gespräch.
- **Beispiele nur als Markdown-Blöcke** — ein Beispiel, das nie gelaufen ist, ist ein Bild von einem Beispiel. Leiterregel 3 wäre eine Behauptung.
- **Beispiele in den Testbereichen der Produktionsmodule** — vermischt Lehrmaterial mit der Absicherung des Produkts; ein didaktisch absichtlich naives Beispiel sähe aus wie eine Prüfung.
- **Markdown-Renderer im Portal** — eine neue Build-Abhängigkeit für eine Sicht, die Obsidian und GitHub bereits liefern.
- **Alle Bilder als Raster** — nicht diffbar, Beschriftung nur durch Neugenerierung korrigierbar, `verifies` greift nicht.
- **Gar keine Bilder** — nimmt der einzigen Missverständnissorte, die Prosa nicht bedient (räumlich, zeitlich), ihre Antwort.
- **Bilder in CI erzeugen** — ein bezahlter, nicht deterministischer Netzaufruf pro Pull Request.
- **Bildagent** statt Skill-Entscheidung — dieselbe Ablehnung wie oben, Bedingung 4 fällt.
- **Punkte, XP, Abzeichen, Fortschrittsbalken** — verschieben die Frage von „habe ich es verstanden" auf „wie komme ich weiter", und der Leser ist derselbe, der die Punkte vergibt.
- **Fortschrittsstand je Lektion, Häkchenlisten im Dokument** — Leserzustand in einer versionierten Datei; ein Commit pro Lesesitzung, beim zweiten Leser falsch.
- **Kompetenzbaum als eigene Datei** — Bestand, driftet mit jeder neuen Lektion. Als *erzeugte* Sicht bleibt er möglich.
- **Freischaltlogik zwischen Lektionen** — setzt eine Reihenfolge voraus, die es zwischen den beiden Spuren ausdrücklich nicht gibt.

Aus dem letzten Block ist genau ein Element übernommen: die **Transferaufgabe**. Sie ist als einzige keine Mechanik, sondern ein Absatz.

## Decision

Lernmaterial wird eine eigene Gattung: Dokumenttyp `lesson`, abgelegt unter `docs/learn/`, im Vault und in `checkDocs`.

**Die Ausnahme von der Türschwelle wird ausdrücklich gewährt — und sie bekommt eine Grenze, sonst frisst sie die Regel.** Eine Lektion ist zulässig, solange sie ein **Verfahren** erklärt. Beschreibt sie den **Bestand** — welche Dateien es gibt, welche Endpunkte existieren —, fällt sie zurück unter die Türschwelle.

**Die Grenze hat zwei Hälften, und die zweite ist die wichtigere.** Nur verboten formuliert, treibt sie den Text ins Gegenteil: Wer keinen Bezeichner mehr nennen darf, schreibt eine Karte ohne Straßennamen. Sie veraltet nie und navigiert niemanden. Deshalb gilt: **Anker ja, Inventar nein.** Ein Anker ist ein benannter Ort — eine Datei, eine Klasse, eine Regel —, verlinkt und per `verifies` gebunden. Ein Inventar ist eine Aufzählung, die Vollständigkeit behauptet. Der Unterschied ist nachprüfbar und braucht keine Definitionsdebatte:

> **Wird der Satz *falsch*, wenn eine Datei dazukommt — oder nur unvollständig?**

„`fen.ts` verwandelt die Zeichenkette in Felder" bleibt richtig, egal wie das Repo wächst. „Es gibt drei Controller" ist am Tag danach falsch. Die oberste Sprosse darf und soll deshalb ihre Dateien nennen; sie ist die Brücke, die die Abstraktion sonst schuldig bleibt.

**Der Schreibtest kommt vor der Grenze.** Formal zu prüfen — „ist dieser Satz Bestand?" — verleitet dazu, die Definition zu verfeinern statt den Text zu verbessern. Entschieden wird praktisch, an einer Frage: *Funktioniert diese Erklärung in sechs Monaten noch als Erklärung des Problems, wenn Chesstopia sich strukturell verändert hat?* Nein heißt Bestand und wird umgeschrieben. Die formale Fassung bleibt Rückfall für den Streitfall, sie ist nicht die Arbeitsanweisung.

**Struktur wird über die Ebene erklärt, nicht über Weglassen.** Der Auftrag verlangt die Ordnerstruktur, die Bestandsgrenze verbietet sie — ein Verzeichnisbaum *ist* Bestand. Die Lektion erklärt deshalb die **Schnittführung, nicht den Inhalt der Schnitte**: warum die Modulgrenze entlang Sprache und Zielplattform läuft, warum `chess-engine` ein eigener Build ist und kein Unterverzeichnis, warum das Backend nach Feature schneidet statt nach Schicht. Die Modulnamen dürfen fallen, gebunden per `verifies`. Kein Dateibaum, keine Klassenliste.

**Die Arbeitsteilung gegen Doppelung:** Ein ADR blickt von innen auf die Entscheidung, eine Lektion von außen auf das Feld. Eine Lektion wiederholt keine ADR-Begründung; sie verlinkt sie und liefert den Kontext, in dem sie lesbar wird. **Ein ADR ist dabei ausdrücklich keine Voraussetzung für eine Lektion** — es gibt Verfahren im Repo, deren Wahl nie als Entscheidung festgehalten wurde. Findet eine Lektion so eine Lücke, ist das ihr Nebenertrag, nicht ihr Mangel.

**Fünf Abschnitte, feste Reihenfolge:** `## Das Problem` (ohne die Technologie zu nennen) · `## Die Leiter` · `## Warum nicht anders` · `## Was davon überall gilt` · `## Weiter`. Der vierte ist der Grund, warum das Weiterbildung ist und nicht Projektdokumentation; ohne ihn ist eine Lektion unvollständig. Der Grundsatz über allem: **Eine Lektion beginnt beim Problem, nicht beim Werkzeug.** Erst wenn klar ist, was ohne diese Technik schiefgeht, wird sie benannt.

**Die Leiterregeln:**

1. **Eine neue Sache pro Sprosse, benannt.** Braucht die Nennung ein „und", ist die Sprosse zu groß und wird geteilt. Die Stufenzahl ergibt sich daraus; eine feste Vorgabe erzeugt Füllmaterial.
2. **Die Sprache ist die des Ziels.** Sonst landet die Leiter nicht.
3. **Jede geschriebene Sprosse läuft.** Sie ist ein Test, er ist grün, er lässt sich ändern und wieder laufen lassen.
4. **Die oberste Sprosse zeigt den Lerngegenstand im Projektcode — verlinkt, nie kopiert.** Projektcode in ein Dokument zu kopieren erzeugt genau den Zustand, gegen den `verifies` im ganzen Repo gebaut ist. Und sie reicht **nur so weit, wie das Lernziel reicht**: Die Leiter endet, wenn das Lernziel erschöpft ist, nicht, wenn die Datei erschöpft ist. Was daneben in der Datei steht, wird in einem Satz benannt und nicht erklärt.

**Für Spur B — die Arbeit am System — wird Regel 3 ersetzt, nicht gestrichen.** Es gibt keinen Test, der ein Vorgehen grün macht. Dort ist jede Sprosse ein **realer Schritt aus der Geschichte dieses Repos**; nachprüfbar bleibt sie, weil Historie der einzige Bezug hier ist, der gar nicht driften kann.

**Der Lernnachweis gehört in die Gattung, nicht daneben.** Eine Lektion, die beim Lesen einleuchtet, ist damit nicht abrufbar — und Abrufbarkeit ist der ganze Zweck, wenn das Wissen im *nächsten* Projekt gebraucht wird. Vier Stufen: **Verstehen** (die Leiter) · **Nachbauen** (eine Sprosse ändern) · **Erklären** (`### Selbsttest`) · **Übertragen** (`### Transfer` und seine Aufgabe). Beide Blöcke stehen **innerhalb** von `## Was davon überall gilt`; ein sechster Abschnitt wäre Aufbau ohne Zuwachs.

`### Selbsttest`: **höchstens drei Fragen, ohne Antworten.** Die Antwort ist die Lektion; steht sie darunter, wird aus Abruf ein Nachschlagen. Jede Frage unterliegt der Sechs-Monats-Frage wie jeder andere Satz — „nenne die drei Controller" ist Bestand in Fragenform. **Sein erster Nutznießer ist der Text, nicht das Gedächtnis:** Wer drei Fragen formulieren muss, die aus dem eigenen Text heraus beantwortbar sind und nicht durch Nachschlagen einer Zeile, merkt beim Formulieren, welchen Begriff die Lektion nur *erwähnt* statt erklärt hat. Den zeitlichen Abstand liefert die Reihenfolge, nicht ein Terminplan: **Bevor die nächste Lektion geschrieben wird, werden die Selbsttestfragen der vorigen mit geschlossener Datei beantwortet.**

`### Transfer`: drei feste Fragen — woran erkenne ich das Problem anderswo, welche Alternativen gehören zur selben Problemklasse, welche Randbedingung müsste sich ändern — **und höchstens eine Aufgabe.** Sie ist das einzige Element, das die vierte Stufe **erzeugt**, statt sie zu behaupten, und sie kostet keine Mechanik: ein Absatz, keine Datei, kein Zustand. Vier Regeln halten sie klein:

1. **Der Gegenstand ist fremd.** Eine Aufgabe im eigenen Repo prüft die Erinnerung an den eigenen Code, nicht den Transfer.
2. **Sie nennt ihr Abbruchkriterium.** „Fertig, wenn …" steht in der Aufgabe selbst. Ohne diesen Satz wächst sie zum Nebenprojekt.
3. **Sie ist nicht Pflicht.** Wo keine trägt, steht keine — eine erzwungene Aufgabe wird mit einer erfundenen gefüllt.
4. **Sie kostet kein Gerüst.** „Fremd" meint den **Gegenstand**, nicht die **Infrastruktur**: Todos statt Brett, nicht ein neues Projekt statt des vorhandenen. Der Deckel ist derselbe wie bei einer Sprosse: **eine Datei, kein Setup, das es noch nicht gibt.** Verlangt eine Aufgabe mehr, ist die Aufgabe falsch geschnitten und wird kleiner geschnitten; das Setup wird nicht gebaut. Gemacht wird sie in einem Kratzverzeichnis, nie in `learn-examples/` — dort liegen Sprossen, die der Build bei jedem Lauf prüft, und eine einmal gemachte Übung ist keine Sprosse. Ins Repo kommt von ihr ausschließlich der Befund.

Daraus fällt eine Gegenprobe ab, die schärfer ist als die Regel: **Braucht die Transferaufgabe das Werkzeug der Lektion, war das Werkzeug der Lerngegenstand.** Und dieselbe Probe von außen: Lässt sich für eine Lektion überhaupt keine Aufgabe formulieren, die außerhalb dieses Repos ausführbar ist, erklärt sie ein Werkzeug und kein Verfahren.

**In einer Lektion steht nie der Zustand ihres Lesers.** Kein Häkchen, kein „erledigt", kein Punktestand. Das wäre versioniertes Persönliches, das bei jedem Lesen einen Commit erzeugt und beim zweiten Leser falsch ist. Der Lernstand wird nicht gespeichert, er wird an der Aufgabe sichtbar.

**Die Wissensbasis ist kanonisch, jede Aufbereitung ist erzeugt und wegwerfbar.** `docs/` und die Sprossen sind die Quelle; Portal, Graph, jede Übersicht ist eine Projektion darauf, liegt unter `build/` und darf ersatzlos verschwinden.

**Bilder.** Die Entscheidung fällt an der Art des Missverständnisses, nicht am Wunsch nach Auflockerung: räumlich und zeitlich → erzeugtes Bild · strukturell → Mermaid · argumentativ → Prosa. **Die Trennlinie ist der Bezeichner:** Sobald ein Bild Namen aus dem Code trägt, ist es strukturell und gehört als Mermaid ins Dokument. Zwei Regeln sind nicht verhandelbar — **die Lektion ist ohne das Bild vollständig** (also ist der Alt-Text echte Prosa, nicht „Diagramm"), und **kein Bild zeigt Bestand** (`verifies` kann ein PNG nicht durchsuchen; ein Bild der aktuellen Ordnerstruktur driftet unsichtbar und für immer). Gegenprobe: *Lässt sich das Bild in einem Satz beschreiben, ohne Information zu verlieren? Dann schreib den Satz.* Die Bilderzeugung läuft **nie in CI und nie in `buildAll`** — bezahlt, nicht deterministisch, netzabhängig. Das Bild und sein Prompt-Sidecar werden committet; ein Diffusionsergebnis ist nicht reproduzierbar und fällt deshalb nicht unter Verbot 1. **Das Lernsystem hängt an keinem Bildmodell:** Welches Modell aus einem Prompt ein PNG macht, weiß nur das Erzeugungsskript. Nach außen sind es zwei Dateien in `docs/_assets/`.

**Die Beispiele leben in `learn-examples/` auf Repo-Ebene, nicht unter `docs/`.** Ein pnpm-Paket bringt ein lokales `node_modules/` mit; läge es im Vault, wäre der Obsidian-Graph nach dem ersten `pnpm install` unbrauchbar. **Das Paket pflegt keine eigenen Abhängigkeiten:** Es teilt sich die Versionen des Frontends über den Katalog in `pnpm-workspace.yaml`. Bricht eine Sprosse an einer Version, ist die Sprosse falsch, nicht die Version — eine gepinnte Version oder eine Kompatibilitätsschicht erzeugt genau die zweite Codebasis, die hier niemand will. **Eine gebrochene Sprosse ist ein Befund, keine Reparaturaufgabe:** Ist der *Begriff* weg, verschwinden Sprosse und gegebenenfalls die Lektion; ist nur das *Idiom* weitergewandert, wird die Sprosse neu geschrieben — der rote Build zeigt dann an, dass das Projekt seine Schreibweise geändert hat, während die Lektion noch die alte lehrt. Nimmt die Reibung überhand, ist die Antwort **weniger ausgeführte Leitern**, nicht ein eingefrorenes Beispielpaket.

**Die Selbstbegrenzung des Lernsystems, als prüfbare Regel.** Ein Lernsystem, das größer wird als sein Gegenstand, bringt seinem Autor bei, wie man Lernsysteme baut — nicht, wie man Software baut. Das wäre das Scheitern des Vorhabens bei laufendem Betrieb, und es passiert nicht durch eine falsche Entscheidung, sondern durch zwanzig plausible. Die Bremse:

> **Keine neue Mechanik ohne ein Exemplar, das ohne sie gescheitert ist.**

Nicht „könnte nützlich sein", sondern: eine konkrete Lektion war ohne sie nicht schreibbar. Gilt für Skript, Regel, Task und Agent gleichermaßen — und macht die Reihenfolge (erst eine Lektion, dann das Gerüst) zur Bedingung statt zur Vorliebe.

**Der Auslöser für einen `lesson-scout`-Agenten ist benannt und noch nicht eingetreten.** Ob ein Merge eine Lektion fällig macht, heißt entscheiden, ob ein neues Verfahren entstanden ist, ob es erklärungsbedürftig ist, ob es nicht bloß eine Variante von etwas Erklärtem ist, und ob es allgemein genug ist. Diese Kriterien gibt es noch nicht — sie entstehen aus realen Fällen. Der Auslöser lautet: *sobald mindestens fünf Lektionen nachträglich aus Merges entstanden sind und aus diesen Fällen ein benennbares Erkennungsmuster vorliegt.* Bis dahin ist das Nachziehen von Hand nicht Rückstand, sondern die Datenerhebung, ohne die der Agent nicht gebaut werden kann. Muster wie die drei Schwellenagenten in [ADR-0016](0016-agenten-topologie.md).

**Für Spur B gilt die Bestandsgrenze verschärft**, weil sie dort am ehesten reißt:

> **Ändert sich eine Regel in CLAUDE.md, muss die Lektion unverändert gültig bleiben. Muss sie angefasst werden, stand Bestand darin.**

`## Weiter` ist davon ausgenommen: **verlinken ja, beschreiben nein.** Ein Link auf die nächste Lektion ist Navigation, driftet nicht und wird von Regel 2 in `checkDocs` gefangen. Eine Aufzählung, welche Lektionen es gibt und wie sie aufgebaut sind, ist Bestand und bleibt draußen. Und der Test, der Spur B von Werkzeugarchäologie trennt, ist der Leser: **Eine Lektion aus Spur B muss für jemanden tragen, der Obsidian nie öffnet, nie ein ADR in diesem Format schreibt und `checkDocs` nie ausführt.** Das Werkzeug ist zulässig als *Fall*, nie als *Gegenstand*.

**Abbruchkriterium.** Eine Lektion, die drei Änderungen an ihrem Gegenstand überlebt hat, ohne angefasst zu werden, wird **gelöscht — nicht gepflegt**. Für Bilder gilt es mit: Ein Bild, das beim Überarbeiten seiner Lektion nicht mehr passt, wird gelöscht, nicht neu generiert, bis es passt.

## Consequences

**`checkDocs` bekommt drei Änderungen und trägt die Gattung danach mit.** Der Typ `lesson` kostet eine Zeile in `statusByType`; Regel 2 (tote Links), 3 (Frontmatter), 5 (`verifies`) und 6 (Erreichbarkeit) greifen ab sofort auf Lektionen, ohne dass eine Zeile dafür geschrieben wurde. Dazu ein Pflichtabschnittsblock parallel zu Regel 4 und die Fence-Ausnahme in Regel 2.

**Die Fence-Ausnahme ist ein bezahlter Preis, kein Gewinn.** Regel 2 lief bisher über den ganzen Dateitext. Eine Lektion, die die Linkkonvention dieses Repos erklärt, zeigt ein Beispiel wie `[ADR-0006](0006-build-orchestration.md)` in einem Codeblock; der Pfad löst gegen `docs/learn/` auf, existiert dort nicht, Build rot — ausgerechnet die Lektionen über Dokumentation könnten ihren eigenen Gegenstand nicht zeigen. Die Regel prüfte dort etwas, das sie nicht meint. Ab jetzt gilt: **Ein echter toter Link in einem Fence bleibt ungesehen.** Hinnehmbar, weil ihn niemand klicken kann.

**Der Pflichtabschnittsblock sichert nur die halbe Sache, und das ist die entscheidende Hälfte.** Ob die drei Selbsttestfragen etwas taugen, kann kein Skript entscheiden. Dass der Abschnitt nicht *schweigend* entfällt, schon — und von allen Blöcken einer Lektion kostet er beim Schreiben am meisten, fällt also als erster weg. `### Transfer` steht bewusst **nicht** in der Liste: Seine drei Fragen dürfen in Prosa beantwortet sein, und eine Überschrift zu erzwingen, die eine leere Zeile erfüllt, prüft nichts.

**`learn-examples/` ist eine zweite Codebasis im Repo, und sie wird bei jedem Build ausgeführt.** Das ist der Preis für Leiterregel 3. Sie hängt am `frontend`-Job der Pipeline statt an einem eigenen: ein zusätzlicher Runner samt JDK-Setup für eine Handvoll Vitest-Läufe lohnt nicht.

**Der Katalog in `pnpm-workspace.yaml` ist neu und bindet auch das Frontend.** Damit die Sprossen keine eigenen Versionen pflegen, mussten die betroffenen Einträge des Frontends auf `catalog:` umgestellt werden. Die Kopplung ist gewollt und ist der Mechanismus der Regel: Eine Versionsangabe, die nur in einem Dokument steht, driftet; eine, die der Paketmanager erzwingt, nicht. Wer künftig eine dieser Versionen anhebt, hebt sie für beide.

**`docs/` überschreitet mit dieser Gattung dreißig Dateien und zieht damit den `doc-auditor`-Auslöser aus [ADR-0016](0016-agenten-topologie.md).** Der Auslöser wird hiermit **auf Dokumente unter Türschwelle-Regime verengt**, nicht als eingetreten vermerkt. Begründung: Er zählte Dateien als Stellvertreter für Driftfläche, und diese Gleichung stimmt für Lektionen nicht. Eine Lektion, die Bestand beschreibt, ist nach diesem ADR bereits verboten — driftet also gar nicht erst; eine, die ein Verfahren erklärt, hat keine Quelle, gegen die ein Auditor sie abgleichen könnte. Der Auslöser feuerte hier auf ein Wachstum, das er nicht meint. Er bleibt für `docs/adr/`, `docs/notes/` und `docs/modules/` unverändert in Kraft.

**Kotlin- und Java-Leitern gibt es zunächst nicht.** Die Lektionen zu Build, Backend und Betrieb tragen ihre Leiter als Markdown — und die Lektion sagt an der Stelle, dass diese Stufen nicht ausgeführt werden. Kein stiller Unterschied zwischen geprüften und ungeprüften Beispielen. **Auslöser für `learn-examples-jvm` als Gradle-Subprojekt: sobald die Markdown-Leiter zur Backend-Lektion einmal geschrieben ist und beim Lesen nicht trägt.**

**Manche Leitern haben gar keine Sprache, und für sie gilt Regel 3 nicht.** Der Fall ist beim Schreiben der Architektur- und der Betriebslektion aufgetreten und war hier nicht vorgesehen: Ist der Gegenstand ein *Schnitt* oder ein *Betriebszustand*, gibt es nichts aufzurufen — eine Sprosse ist dann ein Zustand des Systems, kein Test. Das ist etwas anderes als der Markdown-Ersatz oben, der eine Sprache hätte und sie nur noch nicht ausführt, und etwas anderes als der Spur-B-Ersatz, der auf Repo-Historie zurückgreift. Zulässig ist es unter derselben Bedingung wie dort: **Die Lektion sagt es an der Stelle.** Wo eine Stufe einem Ort im Repo entspricht, wird der Ort verlinkt und per `verifies` gebunden — nachprüfbar ist dann der Ort, nicht die Stufe.

**Die Sprossen werden im Editor gelesen, nicht in Obsidian.** Obsidian rendert kein TypeScript. Für Code ist der Editor die richtige Umgebung, aber es ist ein Bruch im Lesefluss, und er wird hier benannt statt weggeredet.

**Was diese Entscheidung künftiger Arbeit verbietet:** keine Fortschrittsverwaltung, keine Punkte, keine Freischaltlogik, kein Leserzustand in einer versionierten Datei. Kein Bild, das einen Bezeichner aus dem Code trägt. Kein Bildaufruf in CI oder `buildAll`. Keine zweite Versionsliste in `learn-examples/`. Und keine neue Mechanik, solange kein Exemplar ohne sie gescheitert ist.
