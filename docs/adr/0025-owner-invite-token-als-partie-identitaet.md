---
type: adr
status: accepted
implementation: complete
updated: 2026-09-08
supersedes: []
verifies:
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/game/domain/Game.java :: roleOf'
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/game/application/GameService.java :: game.roleOf(playerToken)'
---

# ADR-0025: Owner-/Invite-Token als Partie-Identität ohne Login

## Status
Accepted

## Context
Es existiert noch kein Login und keine Nutzerverwaltung ([ADR-0015](0015-security-von-tag-eins.md)). Trotzdem muss eine Partie zwei Parteien unterscheiden können: die Person, die sie angelegt hat (Weiß), und die Person, die eingeladen wird (Schwarz). Die eingeladene Partei darf sich durch bloßes Editieren der URL keine Rechte der Ersteller-Partei verschaffen können — ohne dass dafür Accounts erfunden werden.

## Considered Options
- **Ein einzelner Token für beide Rollen** — verworfen. Ein Token kann nicht gleichzeitig zwei widersprüchliche Transportanforderungen erfüllen: Er darf im Ersteller-Fall nie in eine URL gelangen, muss aber im Einladungs-Fall genau dort stehen, damit der Link funktioniert.
- **Seat-Claiming — first-to-open-the-link beansprucht den Schwarz-Platz** — verworfen. Race-condition-anfällig (zwei gleichzeitige Öffner) und unnötig: Ein dauerhafter, im Link enthaltener Token leistet dasselbe, ohne den Wettlauf, und passt zum bestehenden, noch ungebauten Domänenbegriff **Direkteinladung** — jede Person mit dem Link kann beitreten.
- **Serverseitige Session/Cookie, die die Ersteller-Partei markiert** — verworfen. Cookie-Scoping pro Partie ist umständlich, und ein solches Setup bringt genau das Cross-Origin-Problem zurück, das [ADR-0015](0015-security-von-tag-eins.md) bewusst zurückgestellt hat.

## Decision
Jede Partie erhält bei ihrer Erstellung zwei zufällige UUID-Tokens, die danach nie neu ausgestellt werden: `ownerToken` für Weiß (die erstellende Partei) und `inviteToken` für Schwarz (die eingeladene Partei).

Der `ownerToken` verlässt die Erstellungs-Antwort nie in eine URL — er bleibt beim Frontend, das ihn lokal hält. Der `inviteToken` ist dagegen bewusst Teil des teilbaren Einladungslinks.

`Game.roleOf(token)` löst einen vorgelegten Token auf eine Farbe auf. `GameService.play` lehnt einen Zug ab, sobald die aufgelöste Farbe nicht mit der Partei übereinstimmt, die laut Stellung am Zug ist — der Token ist damit nicht nur Identität, sondern zugleich die Autorisierungsgrundlage für Züge.

## Consequences
- Eine Partie ist für jede Partei so lange erreichbar, wie ihr jeweiliger Token bekannt ist — es gibt keine serverseitige Session, die ablaufen könnte.
- **Bekannte Einschränkung, akzeptiert statt gelöst:** Geht der `localStorage` der Ersteller-Partei verloren, bevor der Invite-Link geteilt wurde, ist der Link unwiederbringlich — es gibt ohne Login keinen Re-Fetch-Pfad, über den der Owner-Token noch einmal beschafft werden könnte.
- Sobald echte `Nutzer`/Login existiert, wird dieses Token-Modell durch echte Pro-Account-Autorisierung abgelöst statt ergänzt — dieses ADR bekommt dann ein `Superseded by` in seinem `## Status`-Abschnitt.
