package com.learningtracker.kodtar;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/** Ha ures a kodtarak tabla, feltoltjuk az alap torzstablakkal. */
@Component
public class KodtarSeeder implements CommandLineRunner {

    private final KodtarRepository repo;

    public KodtarSeeder(KodtarRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(String... args) {
        if (repo.count() > 0) return;

        List<String> nevek = List.of(
                "Tantárgyak"
        );

        for (String nev : nevek) {
            repo.save(new Kodtar(nev));
        }
    }
}