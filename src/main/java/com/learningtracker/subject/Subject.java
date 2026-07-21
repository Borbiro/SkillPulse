package com.learningtracker.subject;

import jakarta.persistence.*;
import java.time.Instant;

/** Egy tantargy/tema a katalogusban. Session-ok erre hivatkoznak. */
@Entity
@Table(name = "subjects")
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    /** Archivalt targyat elrejtjuk a valasztokbol torles nelkul. */
    @Column(nullable = false)
    private boolean archived = false;

    // Kesobb: private String color;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Subject() { }

    public Subject(String name) {
        this.name = name;
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }

    public Instant getCreatedAt() { return createdAt; }
}
