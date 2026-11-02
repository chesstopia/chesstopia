-- CHESS-29: Schachzustand der Partie, parallel zu status.
-- Keine Datenreparatur: Bestehende Partien bekommen NO_CHECK und tragen den
-- echten Wert ab ihrem nächsten Zug.
ALTER TABLE partie ADD COLUMN check_state VARCHAR(16) NOT NULL DEFAULT 'NO_CHECK';
