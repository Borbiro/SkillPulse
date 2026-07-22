package com.learningtracker.kodtar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface KodtarRepository extends JpaRepository<Kodtar, Long> {

    @Query(value = """
        SELECT * FROM kodtarak k
        ORDER BY k.name ASC
       """, nativeQuery = true)
    List<Kodtar> findAllOrderByNameAsc();
}