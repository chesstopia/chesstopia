package io.chesstopia.backend.error;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Fängt ausschließlich die Ausnahmen ab, die Spring nicht selbst aufbereitet.
 *
 * <p>{@code spring.mvc.problemdetails.enabled} steht auf {@code true}; damit
 * registriert Spring Boot einen {@code ProblemDetailsExceptionHandler} mit
 * {@code @Order(0)}, der diesen einfachen Advice ({@code LOWEST_PRECEDENCE})
 * überstimmt. Ein Handler für eine Ausnahme aus dessen Zuständigkeit — etwa
 * {@code MethodArgumentNotValidException}, {@code TypeMismatchException},
 * {@code HttpMessageNotReadableException} oder {@code NoResourceFoundException}
 * — feuert hier nie und ist toter Code, der Absichten vortäuscht. Wer die
 * Texte dieser Fälle besitzen will, ordnet den Advice bewusst darüber; die
 * Mischung aus beidem ist der Zustand, den es hier nicht mehr gibt.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Die Ressource gibt es nicht — 404, kein Logging. Ein Tippfehler in einer
    // ID ist kein Serverproblem.
    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFound(NotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        // 4xx — kein Logging, kein Stack Trace an den Client
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex) {
        // 5xx — ERROR-Logging mit vollem Stack Trace serverseitig
        log.error("Unexpected server error", ex);
        return ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
}
