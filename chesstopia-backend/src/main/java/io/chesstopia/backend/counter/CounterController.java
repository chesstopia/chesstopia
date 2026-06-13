package io.chesstopia.backend.counter;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/counter")
class CounterController {

    private final CounterRepository counterRepository;

    CounterController(CounterRepository counterRepository) {
        this.counterRepository = counterRepository;
    }

    record CounterResponse(int value) {}

    @GetMapping
    @Transactional
    ResponseEntity<CounterResponse> increment() {
        Counter counter = counterRepository.findById(1L)
            .orElseThrow(() -> new IllegalStateException("Counter not initialized"));
        counter.setValue(counter.getValue() + 1);
        return ResponseEntity.ok(new CounterResponse(counter.getValue()));
    }
}
