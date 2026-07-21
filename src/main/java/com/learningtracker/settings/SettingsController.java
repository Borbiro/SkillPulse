package com.learningtracker.settings;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsRepository repo;

    public SettingsController(SettingsRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public Settings get() {
        return repo.findById(1L).orElseGet(() -> repo.save(new Settings()));
    }

    @PutMapping
    public Settings update(@RequestBody Settings body) {
        Settings s = repo.findById(1L).orElseGet(Settings::new);
        s.setDailyGoalMinutes(body.getDailyGoalMinutes());
        return repo.save(s);
    }
}
