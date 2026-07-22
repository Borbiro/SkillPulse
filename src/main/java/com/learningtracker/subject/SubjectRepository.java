package com.learningtracker.subject;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {

    @Query(value = """
        SELECT * FROM subjects s
        WHERE s.archived = false
        ORDER BY s.name ASC
       """, nativeQuery = true)
    List<Subject> findAllByArchivedFalseOrderByNameAsc();
}
