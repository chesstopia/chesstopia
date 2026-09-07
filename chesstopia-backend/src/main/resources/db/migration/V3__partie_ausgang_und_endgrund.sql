-- CHESS-9: Partie-Ausgang und Endgrund.
-- status wechselt von {ONGOING, COMPLETED} auf {ONGOING, WHITE_WON, BLACK_WON, DRAW}.
-- Zum Migrationszeitpunkt existieren keine beendeten Partien; ein etwaiges COMPLETED
-- wird zum neutralsten Ersatz DRAW.
UPDATE partie SET status = 'DRAW' WHERE status = 'COMPLETED';

ALTER TABLE partie ADD COLUMN end_reason VARCHAR(24);
