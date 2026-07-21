package com.learningtracker.quote;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/quotes")
public class QuoteController {

    private final QuoteRepository repo;

    public QuoteController(QuoteRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Quote> list() {
        return repo.findAll();
    }

    /** Veletlen idezet — ezt hivja a kezdolap a felugro ablakhoz. */
    @GetMapping("/random")
    public Quote random() {
        return repo.findRandom()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nincs idezet"));
    }

    @PostMapping
    public Quote create(@RequestBody QuoteRequest body) {
        return repo.save(new Quote(body.text()));
    }

    /** Egyszeru bemeneti DTO. */
    public record QuoteRequest(String text) { }
}