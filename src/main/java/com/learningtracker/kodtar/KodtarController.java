package com.learningtracker.kodtar;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/kodtarak")
public class KodtarController {

    private final KodtarRepository repo;

    public KodtarController(KodtarRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Kodtar> list() {
        return repo.findAllOrderByNameAsc();
    }

    @PostMapping
    public Kodtar create(@RequestBody KodtarRequest body) {
        return repo.save(new Kodtar(body.name()));
    }

    @PutMapping("/{id}")
    public Kodtar update(@PathVariable Long id, @RequestBody KodtarRequest body) {
        Kodtar k = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        k.setName(body.name());
        return repo.save(k);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** Egyszeru bemeneti DTO. */
    public record KodtarRequest(String name) { }
}