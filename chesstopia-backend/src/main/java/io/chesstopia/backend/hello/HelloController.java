package io.chesstopia.backend.hello;

import io.chesstopia.backend.api.HelloApi;
import io.chesstopia.backend.api.model.HelloResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController implements HelloApi {

    @Override
    public ResponseEntity<HelloResponse> getHello() {
        return ResponseEntity.ok(new HelloResponse().message("Hello from Chesstopia!"));
    }
}
