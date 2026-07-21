package com.learningtracker.settings;

import jakarta.persistence.*;

/** Egyszemelyes app -> egyetlen beallitas-sor (id = 1). */
@Entity
@Table(name = "settings")
public class Settings {

    @Id
    private Long id = 1L;

    /** Opcionalis napi kuszob (perc), amitol a nap "teljesitett" a streakben. */
    private Integer dailyGoalMinutes;

    public Long getId() { return id; }

    public Integer getDailyGoalMinutes() { return dailyGoalMinutes; }
    public void setDailyGoalMinutes(Integer dailyGoalMinutes) { this.dailyGoalMinutes = dailyGoalMinutes; }
}
