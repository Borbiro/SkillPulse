package com.learningtracker.session;

import com.learningtracker.subject.Subject;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/** Egy tanulasi alkalom: targy + idotartam egy adott napon. */
@Entity
@Table(name = "study_sessions")
public class StudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    /** Ehhez a naphoz szamit (visszamenoleg is allithato). */
    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private int durationMinutes;

    /** Szabad szoveges megjegyzes; kitoltese nem kotelezo. */
    @Column(columnDefinition = "text")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionSource source;

    /** A rogzites idopontja (nem azonos a 'date'-tel visszamenoleges bevitelnel). */
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected StudySession() { }

    public Long getId() { return id; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public SessionSource getSource() { return source; }
    public void setSource(SessionSource source) { this.source = source; }

    public Instant getCreatedAt() { return createdAt; }
}
