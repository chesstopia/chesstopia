---
type: module
name: {{title}}
status: active
updated: {{date:YYYY-MM-DD}}
adrs: []
verifies: []
---

# Titel

## Zweck

Zwei bis drei Sätze. Wofür existiert dieses Modul, und was wäre ohne es doppelt vorhanden.

## Gehört hierher

## Gehört NICHT hierher

Der wertvollste Abschnitt. Was hier fälschlich landen würde, wo es stattdessen hingehört, und mit Link auf das ADR, das es entschieden hat.

## Invarianten

Regeln, gegen die eine Änderung verstoßen kann. Nummeriert, damit man sie zitieren kann.

## Einstiegspunkte

Die zwei bis vier Dateien, die man zuerst liest.

## Wellenwirkung

„Eine Änderung an X erzwingt Y." Der wichtigste Abschnitt in einem Monorepo mit generierten Nahtstellen.

## Abhängigkeiten

## Zugehörige Entscheidungen

<!--
Invarianten statt Inventar. Was sich durch Hinzufügen einer Datei ändert,
gehört nicht hierher — Aufzählungen existierender Klassen und Packages
sind nach dem nächsten Feature falsch. Regeln überleben.
Ausnahme: die Einstiegspunkte, dort stehen bewusst konkrete Pfade.

Kein "implementation:"-Feld. Das gilt nur für ADRs: Ein Moduldokument
beschreibt ein Modul, das existiert. "Kann noch nicht alles, was hier
steht" ist Drift, kein Metadatum.

Das Warum steht im ADR und wird verlinkt, nicht wiederholt.
-->
