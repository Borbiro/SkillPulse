package com.learningtracker.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {

    /** Dashboard alapertelmezett rendezese: legujabb nap elol. */
    @Query(value = """
        SELECT * FROM study_sessions s
        ORDER BY s.date DESC, s.created_at DESC
        """, nativeQuery = true)
    List<StudySession> findAllByOrderByDateDescCreatedAtDesc();

    /** Szurt lista (datumtartomany) a dashboardhoz / statokhoz. */
    @Query(value = """
        SELECT * FROM study_sessions s
        WHERE s.date between :from AND :to
        ORDER BY s.date DESC, s.created_at DESC
        """, nativeQuery = true)
    List<StudySession> findByDateBetweenOrderByDateDescCreatedAtDesc(LocalDate from, LocalDate to);

    /** Osszes tanult perc egy datumtartomanyra (a headerben a mai osszperchez). */
    @Query(value = """
        SELECT COALESCE(SUM(s.duration_minutes), 0)
        FROM study_sessions s
        WHERE s.date BETWEEN :from AND :to
        """, nativeQuery = true)
    long sumMinutesBetween(LocalDate from, LocalDate to);
}
