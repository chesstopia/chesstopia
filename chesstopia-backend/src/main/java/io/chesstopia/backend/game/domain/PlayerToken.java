package io.chesstopia.backend.game.domain;

import java.util.UUID;

public record PlayerToken(UUID value) {
    public static PlayerToken newToken() {
        return new PlayerToken(UUID.randomUUID());
    }
}
