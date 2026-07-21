package com.learningtracker.quote;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/** Ha ures a quotes tabla, feltoltjuk par motivacios idezettel. */
@Component
public class QuoteSeeder implements CommandLineRunner {

    private final QuoteRepository repo;

    public QuoteSeeder(QuoteRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(String... args) {
        if (repo.count() > 0) return;

        List<String> quotes = List.of(
                "A tudás olyan kincs, amit mindenhová magaddal viszel.",
                "Minden szakértő valaha kezdő volt.",
                "A kis napi haladás nagy eredményekhez vezet.",
                "Nem az számít, milyen lassan haladsz, csak meg ne állj.",
                "A ma megtanult dolog a holnap alapja.",
                "A kitartás legyőzi a tehetséget, ha a tehetség nem kitartó.",
                "Fektess be a tudásodba — a legjobb kamatot fizeti.",
                "A siker apró, ismételt erőfeszítések összege nap mint nap."
        );

        for (String q : quotes) {
            repo.save(new Quote(q));
        }
    }
}