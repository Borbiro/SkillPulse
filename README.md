# Learning Tracker

A single-user learning tracker. **Spring Boot + PostgreSQL + vanilla HTML/JS**, in a single JAR
(the frontend served as static files from the same origin — no CORS).

## Prerequisites

- Java 21
- Maven 3.9+
- PostgreSQL

## Getting started

1. Create the database:
   ```sql
   CREATE DATABASE learning_tracker;
   ```
2. Provide the connection (or edit `application.properties`):
   ```bash
   export DB_USER=postgres
   export DB_PASSWORD=postgres
   ```
   > Note: the JDBC URL expects Postgres on **port 5435** (not the default 5432) — see
   > `spring.datasource.url` in `application.properties`.
3. Run it:
   ```bash
   mvn spring-boot:run
   ```
4. Open: <http://localhost:8080>

> The schema is created on first startup (`spring.jpa.hibernate.ddl-auto=update`).
> For production it is worth switching to Flyway/Liquibase migrations and setting it to `validate`.

## Structure

```
src/main/java/com/learningtracker/
├── LearningTrackerApplication.java
├── subject/    Subject entity, repo, REST controller (CRUD done)
├── session/    StudySession + SessionSource, repo, REST controller (CRUD done)
├── settings/   Settings (daily hour goal), repo, controller (done)
├── stats/      StatsController — summary/daily/streak (TODO: SQL aggregation)
└── quote/      Quote + QuoteSeeder, repo, REST controller (motivational quotes, done)
src/main/resources/
├── application.properties
└── static/     index.html, naplo.html, idozito.html, uj-elem.html, app.js, style.css
```

## What's done and what's TODO

**Done (wired up, running):**
- Subject catalog CRUD
- Session CRUD, dashboard list sorted by date, with a note field
- Settings (daily hour goal)
- Motivational quotes: `/api/quotes/random`, seeded on an empty table (`QuoteSeeder`); shown on the home page
- Frontend skeleton with all screens and wired-up `fetch` calls

**TODO (for you):**
- `stats/StatsController`: the aggregating queries for `summary` / `daily` / `streak`
  (a good playground for practicing SQL `GROUP BY` / `SUM` — see the pattern in the repo)
- Frontend rendering: at the `// TODO` markers (populating selects, list and
  chart rendering, today's total minutes)
- Validation, error handling, DTOs for the responses (currently returns the entity)

## Open decisions (from SPEC.md)

- The day boundary for the streak (local midnight / fixed timezone)
- Deleting a subject: hard delete or archive when it has sessions attached