---
type: adr
status: accepted
implementation: complete
updated: 2026-08-09
supersedes: []
verifies:
  - 'gradle/check-docs.gradle.kts :: partially-superseded'
---

# ADR-0018: Vierter Statuswert `partially-superseded` für ADRs

## Status
Accepted

## Context

Das Statusvokabular für ADRs kannte drei Werte: `accepted`, `superseded`, `draft`. Es unterstellt, dass eine Entscheidung ganz gilt oder gar nicht mehr.

Beim Nachrüsten des Frontmatters für die drei ADRs aus PR #2 traf das zum ersten Mal nicht zu. ADR-0009 (CI-Pipeline auf Bitbucket) und ADR-0010 (Deployment-Infrastruktur) sind durch ADR-0011 (Migration nach GitHub Actions) **teilweise** abgelöst: Die Plattform und die Job-Reihenfolge gelten nicht mehr, die Begründungen zu Komponenten-Trennung, Build-Cache statt Artefakt-Passing und getrennten Compose-Stacks gelten weiter. Beide ADRs sagen das in ihrem eigenen `## Status`-Abschnitt seit dem Tag, an dem sie geschrieben wurden.

Für diesen Zustand gab es keinen Wert. `accepted` behauptet zu viel, `superseded` zu wenig — und wer `superseded` liest, hört auf zu lesen.

## Considered Options

- **Fußnote im Register** — so lief es zunächst. Die Einschränkung steht dann in Fließtext statt im Frontmatter, ist nicht maschinell auswertbar und überlebt den geplanten Schritt nicht, das Register aus dem Frontmatter zu erzeugen.
- **`superseded` setzen** — falsch. Drei tragende Begründungen aus 0009 und 0010 gelten unverändert; als abgelöst markiert liest sie niemand mehr.
- **Bei `accepted` bleiben** — in die andere Richtung falsch. Bitbucket und die Infra-Box gibt es nicht mehr; wer das ADR als Beschreibung liest, baut gegen Totes.
- **Eigenes Feld `superseded-by` neben dem Status** — zwei Felder für einen Zustand, und die Gegenrichtung steht bereits im `supersedes` des ablösenden ADR.

## Decision

Das Vokabular für `type: adr` bekommt einen vierten Wert: `partially-superseded`.

Er bedeutet: Ein Teil der Entscheidung gilt weiter, ein anderer nicht. **Welcher Teil, steht im `## Status`-Abschnitt des ADR** — ohne diesen Satz sagt der Wert nichts. Das ablösende ADR nennt die teilweise abgelösten Nummern wie gehabt in seinem `supersedes`.

## Consequences

- Regel 3 in `checkDocs` akzeptiert den Wert; `CLAUDE.md` und das Skill `/adr` führen ihn.
- Ein ADR mit diesem Status trägt die Pflicht, im Status-Abschnitt beide Hälften zu benennen. Der Wert ersetzt die Erklärung nicht, er verweist auf sie.
- Der Statuswert ist damit nicht mehr allein aus dem Frontmatter verständlich. Das ist der Preis für die Genauigkeit und der Grund, warum es beim vierten Wert bleibt: Ein fünfter Zwischenzustand gehört in den Text, nicht ins Vokabular.
