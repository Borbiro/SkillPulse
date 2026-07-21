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


    // TODO(stats): itt jonnek majd a kezzel irt aggregalo lekerdezesek, pl.:
    //
//     @Query(value = """
//         SELECT s.subject_id, SUM(s.duration_minutes)
//         FROM study_sessions s
//         WHERE s.date BETWEEN :from AND :to
//         GROUP BY s.subject_id
//         """, nativeQuery = true)
//     List<Object[]> minutesPerSubject(LocalDate from, LocalDate to);
    //
    // Ez jo terep a SQL GROUP BY / SUM gyakorlasahoz.
}
