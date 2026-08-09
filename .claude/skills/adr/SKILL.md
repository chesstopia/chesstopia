---
name: adr
description: Legt ein Architecture Decision Record unter docs/adr/ an und trägt es ins Register ein. Verwenden, wenn im Gespräch eine Architekturentscheidung gefallen ist, die festgehalten werden soll.
---

# ADR anlegen

Kein Subagent, bewusst. Die Begründung und die verworfenen Alternativen sind
gerade in diesem Gespräch entstanden — ein kalt startender Agent müsste sie neu
erfinden. Du schreibst das ADR selbst; dieser Ablauf sorgt nur dafür, dass die
Konventionen eingehalten werden.

## Vorher prüfen

**Ist es überhaupt ein ADR?** Nur wenn etwas *entschieden* wurde und mindestens
eine Alternative verworfen. Wurde etwas *herausgefunden*, gehört es als Notiz
nach `docs/notes/`. Eine zweite Entscheidungsablage neben `docs/adr/` gibt es
nicht.

**Die nächste freie Nummer** — und zwar nicht nur gegen `docs/adr/`, sondern
gegen alle Branches:

```
ls docs/adr/
git ls-remote --heads origin
for b in $(git branch -r --format='%(refname:short)'); do git ls-tree --name-only "$b" docs/adr/ 2>/dev/null; done | sort -u
```

Doppelte Nummern sind in diesem Repo schon zweimal entstanden — einmal
innerhalb eines Branches, einmal zwischen zweien. `checkDocs` fängt den ersten
Fall sofort, den zweiten erst beim Merge.

**Eine Lücke in der Nummernfolge ist kein freier Platz.** `docs/adr/` springt
derzeit von 0008 auf 0012; 0009–0011 sind für `CHESS-8-Initial-pipeline`
reserviert und in [docs/adr/index.md](../../../docs/adr/index.md) begründet.
Wer eine Lücke füllt, ohne sie geprüft zu haben, erzeugt genau die Kollision,
die der Branch-Durchlauf oben verhindern soll. Die nächste Nummer ist immer die
höchste vergebene **plus eins** — über alle Branches, nie die kleinste freie.

## Anlegen

Dateiname `NNNN-kurzer-titel-in-kebab-case.md`, Vorlage
`docs/_templates/adr.md`. Die Platzhalter `{{date:YYYY-MM-DD}}` werden durch
das echte Datum ersetzt, nicht übernommen.

Frontmatter:

- `status` — `accepted` · `superseded` · `partially-superseded` · `draft`.
  `partially-superseded` heißt: ein Teil der Entscheidung gilt weiter. **Welcher,
  gehört in den `## Status`-Abschnitt** — ohne diesen Satz sagt der Wert nichts
  ([ADR-0018](../../../docs/adr/0018-status-partially-superseded.md)).
- `implementation` — `planned` · `partial` · `complete`. **Das ist eine andere
  Frage als der Status.** Ein frisch entschiedenes, ungebautes ADR ist
  `accepted` + `planned`. Ohne dieses Feld liest man das ADR als Beschreibung
  des Systems.
- `verifies` — flache Strings im Format `'pfad :: erwarteter wert'`. **Pflicht,
  sobald der Text eine Zahl oder einen Bezeichner aus dem Code nennt.** Nur
  Substring-Suche; ein `#`-Selektor im Pfad ist ein Fehler, kein stiller
  Durchlauf.

Körper: `## Status`, `## Context`, `## Considered Options`, `## Decision`,
`## Consequences`. Die vier ohne *Considered Options* sind Pflicht und werden
geprüft — aber ein ADR ohne verworfene Alternativen begründet nichts.

`## Context` beschreibt den Zustand **zum Entscheidungszeitpunkt**, nicht den
heutigen. Aktiv, kein Konjunktiv. `## Consequences` nennt auch das
Unangenehme und was künftige Arbeit dadurch nicht mehr tun darf.

## Danach

1. Zeile in `docs/adr/index.md` eintragen — Nummer, Titel, Status, Umsetzung.
   Bei einer Einschränkung eine Fußnote, wie es 0015 und 0016 vormachen.
2. Wenn das ADR ein bestehendes ablöst: im alten ADR unter `## Status` eine
   Zeile `Superseded by [ADR-NNNN](NNNN-….md)` ergänzen und dessen
   Frontmatter auf `status: superseded` setzen. **Der Körper des alten ADR
   wird nicht angefasst** — er ist die Begründung, die damals galt.
3. Links sind relative Markdown-Links. Keine Wikilinks.
4. `./gradlew checkDocs`

Neue ADR und Registereintrag gehören in **denselben** Commit.
