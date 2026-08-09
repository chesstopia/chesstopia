---
type: adr
status: accepted
implementation: complete
updated: 2026-08-09
supersedes: []
verifies:
  - 'gradle/check-docs.gradle.kts :: Regel 10'
  - 'gradle/check-docs.gradle.kts :: application-prod.yml'
  - 'gradle/check-docs.gradle.kts :: ANSIBLE_VAULT'
---

# ADR-0017: Produktionskonfiguration im Repo — verboten ist der Wert, nicht die Datei

## Status
Accepted

## Context

Verbot 6 lautete: „Keine Secrets im Repo. `application-prod.yml` existiert hier nicht und wird nicht angelegt." Es verbot eine **Datei** und stellvertretend damit einen Wert.

Der Pipeline-Branch legt genau diese Datei an und entfernt zugleich die Zeile aus `.gitignore`, die sie verhindern sollte. Der Inhalt bricht das Verbot dem Wortlaut nach und erfüllt es dem Sinn nach vollständig: Jeder Zugangsdatenwert ist ein Platzhalter (`${POSTGRES_PASSWORD}`), gesetzt aus der Umgebung des Containers. Was tatsächlich in der Datei steht, ist Nicht-Geheimes — Datenquellen-URL, Log-Level, `show-sql: false`.

Dieselbe Frage stellt sich ein zweites Mal in `infra/`: Ansible braucht seine Produktionswerte im Repo, hält sie aber AES256-verschlüsselt in `group_vars/prod/vault.yml`.

Ein Verbot, das der eigene Branch bricht, ohne dass etwas rot wird, ist keine Regel, sondern eine Meinung. Geprüft wurde bis hierher nichts: `checkDocs` hatte für Verbot 6 keine Regel.

## Considered Options

- **Datei streichen, alles über Umgebungsvariablen** — Spring kann jede Eigenschaft aus der Umgebung lesen, also ginge es. Dann wandern aber auch die harmlosen Einstellungen (Log-Level, `show-sql`) in die Compose-Datei bzw. in den Deploy-Workflow. Das Produktionsprofil hätte keinen Ort mehr, an dem man es am Stück liest und reviewt, und die Trennung „was ist geheim" wäre gerade dort aufgehoben, wo sie zählt.
- **Datei dulden, Verbot unverändert lassen** — die billigste Variante und die schlechteste: Der Wortlaut bliebe falsch, und der nächste Literalwert an einer Secret-Stelle fällt niemandem auf. Genau so ist diese Abweichung entstanden.
- **Datei behalten, Wert prüfen** — gewählt.

## Decision

Produktionskonfiguration ist versioniert. Verboten ist der **Wert** an einer Secret-Stelle, nicht die Datei.

Zulässig ist an einer solchen Stelle ausschließlich ein Verweis nach außen: `${VAR}` (Umgebung, auch `${{ secrets.X }}` in Workflows), `{{ var }}` (Ansible) oder `!vault`. Verschlüsselte Ansible-Vault-Dateien sind als Ganzes ausgenommen — erkennbar an ihrer ersten Zeile.

`checkDocs` erzwingt das als **Regel 10**. Ihr Prüfbereich ist Produktionskonfiguration: alles unter `infra/` und `.github/workflows/` sowie jede Datei mit „prod" im Namen.

## Consequences

- Die Zeile `application-prod.yml` in `.gitignore` entfällt. Wer die Datei künftig anlegt, tut das absichtlich und unter Regel 10.
- Ein `vault.yml`, das versehentlich unverschlüsselt eincheckt, verliert seine Ausnahme mit der ersten Zeile und wird geprüft wie jede andere Datei — der Fund fällt beim Build an, nicht beim Leak.
- **Entwicklungskonfiguration ist bewusst nicht im Prüfbereich.** `application.yml` und `docker-compose.yml` tragen Klartext-Zugangsdaten gegen `localhost`; sie zu prüfen hieße, eine Ausnahmeliste zu führen, und eine Ausnahmeliste verrottet. Der Preis: Ein Produktionswert, der in der Entwicklungsdatei landet, wird nicht gefangen.
- Regel 10 kennt keine Semantik. Sie erkennt Secret-Stellen am Schlüsselnamen (`password`, `secret`, `token`, `api-key`, `private-key`, `credential`). Ein Geheimnis unter einem harmlosen Namen entgeht ihr.
