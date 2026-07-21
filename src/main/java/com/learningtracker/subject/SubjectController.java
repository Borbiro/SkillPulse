package com.learningtracker.subject;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectRepository repo;

    public SubjectController(SubjectRepository repo) {
        this.repo = repo;
    }

    /** Alapbol csak az aktiv (nem archivalt) targyakat adja vissza. */
    @GetMapping
    public List<Subject> list(@RequestParam(defaultValue = "false") boolean includeArchived) {
        return includeArchived ? repo.findAll() : repo.findAllByArchivedFalseOrderByNameAsc();
    }

    @PostMapping
    public Subject create(@RequestBody SubjectRequest body) {
        return repo.save(new Subject(body.name()));
    }

    @PutMapping("/{id}")
    public Subject update(@PathVariable Long id, @RequestBody SubjectRequest body) {
        Subject s = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        s.setName(body.name());
        if (body.archived() != null) s.setArchived(body.archived());
        return repo.save(s);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        // TODO: dontsd el, hogy kemeny torles vagy inkabb archivalas legyen
        //       ha vannak hozza tartozo session-ok.
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** Egyszeru bemeneti DTO. */
    public record SubjectRequest(String name, Boolean archived) { }
}
