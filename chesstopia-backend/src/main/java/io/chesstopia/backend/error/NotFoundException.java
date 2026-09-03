package io.chesstopia.backend.error;

/**
 * Die angeforderte Ressource existiert nicht.
 *
 * Bewusst ohne {@code @ResponseStatus}: Der Statuscode entsteht an einer
 * Stelle, im {@link GlobalExceptionHandler}, damit jeder Fehler dieselbe
 * RFC-7807-Form bekommt.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
