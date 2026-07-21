package com.learningtracker.quote;

import jakarta.persistence.*;

/** Egy motivacios idezet, amit a kezdolapon veletlenszeruen felugratunk. */
@Entity
@Table(name = "quotes")
public class Quote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String text;

    protected Quote() { }

    public Quote(String text) {
        this.text = text;
    }

    public Long getId() { return id; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}