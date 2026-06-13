package io.chesstopia.backend.counter;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "counter")
class Counter {

    @Id
    private Long id;

    private int value;

    protected Counter() {}

    public Long getId() { return id; }

    public int getValue() { return value; }

    public void setValue(int value) { this.value = value; }
}
