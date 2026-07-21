package com.learningtracker.subject;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {

    List<Subject> findAllByArchivedFalseOrderByNameAsc();
}
