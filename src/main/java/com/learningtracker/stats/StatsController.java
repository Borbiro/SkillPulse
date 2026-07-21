package com.learningtracker.stats;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Statisztika-vegpontok. A vazban ures/placeholder valaszt adnak,
 * hogy a frontend mar tudja hivni oket. Az aggregalo lekerdezeseket
 * neked kell megirni (jo terep a SQL GROUP BY / SUM gyakorlasahoz).
 */
@RestController
@RequestMapping("/api/stats")
public class StatsController {

    /** Osszperc + targyankenti bontas egy idotartomanyra. */
    @GetMapping("/summary")
    public Summary summary(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        // TODO: SUM(duration_minutes) + GROUP BY subject
        return new Summary(0, List.of());
    }

    /** Perc/nap – grafikonhoz es a streak szamitasahoz. */
    @GetMapping("/daily")
    public List<DailyMinutes> daily(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        // TODO: GROUP BY date, SUM(duration_minutes)
        return List.of();
    }

    /** Jelenlegi + leghosszabb streak (napi jelenlet alapjan). */
    @GetMapping("/streak")
    public Streak streak() {
        // TODO: egymast koveto napok, amikor volt session
        //       (ha van dailyGoalMinutes, akkor a kuszobot elero napok).
        return new Streak(0, 0);
    }

    // --- Valasz-DTO-k ---

    public record Summary(long totalMinutes, List<SubjectMinutes> perSubject) { }

    public record SubjectMinutes(Long subjectId, String subjectName, long minutes) { }

    public record DailyMinutes(LocalDate date, long minutes) { }

    public record Streak(int current, int longest) { }
}
