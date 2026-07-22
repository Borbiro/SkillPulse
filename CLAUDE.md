# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> A projekt kódja, kommentjei és dokumentációja magyarul íródnak. Tartsd meg ezt a nyelvet minden új kódban, kommentben és felhasználói szövegben.

## Áttekintés

Egyszemélyes **tanulás-követő** webalkalmazás (belső neve `learning-tracker`). Tanulási
session-öket naplózol (tárgy + időtartam egy adott napon) időzítővel vagy kézzel; a fő
cél a napi **streak** és a statisztika. A teljes spec a `SPEC.MD`-ben, a jelenlegi állapot
és a TODO-k a `README.md`-ben.

Stack: **Spring Boot 3.4 (Java 21) + Spring Data JPA + PostgreSQL**, a frontend **vanilla
HTML/JS**, statikus fájlként azonos originről kiszolgálva (nincs CORS, nincs build lépés).

## Gyakori parancsok

```bash
# Futtatás (dev) — előbb legyen élő Postgres, lásd lentebb
mvn spring-boot:run

# Build (futtatható JAR a target/-ba)
mvn clean package

# Összes teszt
mvn test

# Egyetlen teszt osztály / metódus
mvn test -Dtest=LearningTrackerApplicationTests
mvn test -Dtest=LearningTrackerApplicationTests#contextLoads
```

Az app a <http://localhost:8080> címen fut; a séma az első indításkor jön létre
(`spring.jpa.hibernate.ddl-auto=update`).

### Adatbázis

A `contextLoads` teszt is **élő Postgres kapcsolatot igényel** (nincs H2 test-profil, bár
a SPEC ezt javasolja jövőbeli lépésként). Beállítás `application.properties`-ben vagy
környezeti változóval:

```bash
export DB_USER=postgres
export DB_PASSWORD=postgres
```

Fontos: a JDBC URL **5435-ös porton** várja a Postgrest (nem az alap 5432-n) — lásd
`spring.datasource.url` az `application.properties`-ben. A `learning_tracker` adatbázist
kézzel kell létrehozni (`CREATE DATABASE learning_tracker;`).

## Architektúra

**Package-per-feature** felépítés a `com.learningtracker` alatt. Minden feature egy csomag,
és jellemzően ugyanazt a hármas mintát követi: `Entity` (JPA) + `Repository`
(`JpaRepository`) + `@RestController` (`/api/...`).

- **`subject/`** — Tárgy-katalógus (`Subject`). Archiválható törlés helyett (`archived`).
- **`session/`** — `StudySession` (a `Subject`-re `@ManyToOne`) + `SessionSource` enum
  (`TIMER` / `MANUAL`). A dashboard-lista `date DESC, created_at DESC` szerint rendez.
- **`settings/`** — Egyetlen soros `Settings` (napi óracél, `dailyGoalMinutes`).
- **`stats/`** — Származtatott, **nem tárolt** aggregációk (`summary` / `daily` / `streak`).
  **Jelenleg placeholder** (üres/nulla választ ad); ezek megírása a fő nyitott munka.
- **`quote/`** — Motivációs idézetek; `QuoteSeeder` (`CommandLineRunner`) tölti fel üres
  táblánál. A kezdőlap a `/api/quotes/random` végpontot hívja.

### Fontos konvenciók

- **Natív SQL a repository-kban.** A meglévő lekérdezések `@Query(nativeQuery = true)`-t
  használnak (pl. `StudySessionRepository`, `QuoteRepository` `ORDER BY RANDOM()`). A
  `stats` aggregációkat is **SQL-ben** (`GROUP BY` / `SUM(duration_minutes)`) kell megírni,
  nem Java-ban összegezve — ez a projekt kimondott célja (SQL-gyakorlás). A táblanevek
  snake_case-esek (`study_sessions`, `quotes`, `subjects`).
- **Bemeneti DTO record-ok.** A controllerek `record`-ot fogadnak `@RequestBody`-ként
  (pl. `SessionRequest`, `QuoteRequest`), nem közvetlenül az entitást. A `stats` válaszai
  is record DTO-k. A többi végpont viszont **jelenleg az entitást adja vissza** — a
  válasz-DTO-k bevezetése nyitott TODO.
- **Hibakezelés** `ResponseStatusException`-nel (`HttpStatus.NOT_FOUND` / `BAD_REQUEST`).

### Frontend

Több különálló statikus HTML oldal a `src/main/resources/static/`-ban
(`index.html`, `naplo.html`, `idozito.html`, `uj-elem.html`), közös `app.js` + `style.css`.
Nincs router és nincs build — a navigáció sima `window.location.href`. Az `app.js` egyetlen
fájl mindegyik oldalt kiszolgálja: a függvények **defenzíven ellenőrzik az elemek létét**
(pl. `if (!body) return;`), mert nem minden elem szerepel minden oldalon.

Az **időzítő teljesen kliensoldali** (`app.js`-ben start/pause/stop/save állapotgép); a
szerver csak a leállításkor POST-olt **kész** session-t látja (`source: "TIMER"`) —
nincs szerveroldali „futó óra" állapot.