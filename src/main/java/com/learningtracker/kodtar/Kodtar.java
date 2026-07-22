package com.learningtracker.kodtar;

import jakarta.persistence.*;

/** Egy kodtar-bejegyzes: egy egyszeru torzstabla (pl. Tantargyak) leiroja. Id + Name. */
@Entity
@Table(name = "kodtarak")
public class Kodtar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    protected Kodtar() { }

    public Kodtar(String name) {
        this.name = name;
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}