package io.chesstopia.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import io.zonky.test.db.AutoConfigureEmbeddedDatabase;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase
class ChessTopiaApplicationTests {

    @Test
    void contextLoads() {
    }
}
