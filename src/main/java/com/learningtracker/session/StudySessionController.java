package com.learningtracker.session;

import com.learningtracker.subject.Subject;
import com.learningtracker.subject.SubjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class StudySessionController {

    private final StudySessionRepository sessions;
    private final SubjectRepository subjects;

    public StudySessionController(StudySessionRepository sessions, SubjectRepository subjects) {
        this.sessions = sessions;
        this.subjects = subjects;
    }

    /** Dashboard-lista. Datumtartomany opcionalis; alapbol datum szerint csokkeno. */
    @GetMapping
    public List<StudySession> list(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        if (from != null && to != null) {
            return sessions.findByDateBetweenOrderByDateDescCreatedAtDesc(from, to);
        }
        return sessions.findAllByOrderByDateDescCreatedAtDesc();
    }

    @PostMapping
    public StudySession create(@RequestBody SessionRequest body) {
        StudySession s = new StudySession();
        apply(s, body);
        return sessions.save(s);
    }

    @PutMapping("/{id}")
    public StudySession update(@PathVariable Long id, @RequestBody SessionRequest body) {
        StudySession s = sessions.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        apply(s, body);
        return sessions.save(s);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        sessions.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void apply(StudySession s, SessionRequest body) {
        Subject subject = subjects.findById(body.subjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ismeretlen subjectId"));
        s.setSubject(subject);
        s.setDate(body.date() != null ? body.date() : LocalDate.now());
        s.setDurationMinutes(body.durationMinutes());
        s.setNote(body.note());
        s.setSource(body.source() != null ? body.source() : SessionSource.MANUAL);
    }

    public record SessionRequest(
            Long subjectId,
            LocalDate date,
            int durationMinutes,
            String note,
            SessionSource source) { }
}
