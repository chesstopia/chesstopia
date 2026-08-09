package io.chesstopia.backend.counter;

import io.chesstopia.backend.api.CounterApi;
import io.chesstopia.backend.api.model.CounterResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CounterController implements CounterApi {

    private final CounterService counterService;

    public CounterController(CounterService counterService) {
        this.counterService = counterService;
    }

    @Override
    public ResponseEntity<CounterResponse> incrementCounter() {
        return ResponseEntity.ok(new CounterResponse(counterService.increment()));
    }
}
