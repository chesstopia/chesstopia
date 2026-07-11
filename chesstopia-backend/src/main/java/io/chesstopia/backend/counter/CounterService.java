package io.chesstopia.backend.counter;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class CounterService {

    private final CounterRepository counterRepository;

    CounterService(CounterRepository counterRepository) {
        this.counterRepository = counterRepository;
    }

    @Transactional
    public int increment() {
        Counter counter = counterRepository.findById(1L)
                .orElseThrow(() -> new IllegalStateException("Counter not initialized"));
        counter.setValue(counter.getValue() + 1);
        return counter.getValue();
    }
}
