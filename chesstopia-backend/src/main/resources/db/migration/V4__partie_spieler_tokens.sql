-- CHESS-19: Ersteller-/Einladungs-Token für Partien ohne Login (ADR-0015).
-- Zum Migrationszeitpunkt existieren nur Dev-Partien ohne Token; ein Default
-- deckt trotzdem jede bestehende Zeile ab, statt die Migration auf "Tabelle
-- ist leer" zu verlassen (Muster aus V3).
ALTER TABLE partie
    ADD COLUMN owner_token  UUID NOT NULL DEFAULT gen_random_uuid(),
    ADD COLUMN invite_token UUID NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE partie ALTER COLUMN owner_token DROP DEFAULT;
ALTER TABLE partie ALTER COLUMN invite_token DROP DEFAULT;
