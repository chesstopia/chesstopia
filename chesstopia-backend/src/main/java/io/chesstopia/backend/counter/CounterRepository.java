package io.chesstopia.backend.counter;

import org.springframework.data.jpa.repository.JpaRepository;

interface CounterRepository extends JpaRepository<Counter, Long> {}
