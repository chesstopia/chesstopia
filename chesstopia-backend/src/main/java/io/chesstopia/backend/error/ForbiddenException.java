package io.chesstopia.backend.error;

/**
 * Kein gültiges Spieler-Token für diese Aktion, oder die aufgelöste Farbe ist
 * nicht am Zug.
 *
 * Bewusst ohne {@code @ResponseStatus} — der Statuscode entsteht zentral im
 * {@link GlobalExceptionHandler}, wie bei {@link NotFoundException}.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
