package io.chesstopia.backend.counter;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/counter")
class CounterController {

    private final CounterService counterService;

    CounterController(CounterService counterService) {
        this.counterService = counterService;
    }

    record CounterResponse(int value) {}

    @GetMapping
    ResponseEntity<CounterResponse> increment() {
        return ResponseEntity.ok(new CounterResponse(counterService.increment()));
    }
}
