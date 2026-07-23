# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> The project's code, comments and documentation are written in Hungarian. Keep this language in all new code, comments and user-facing text.

## Overview

A single-user **learning tracker** web application (internal name `learning-tracker`). You log
learning sessions (subject + duration on a given day) with a timer or manually; the main
goal is the daily **streak** and the statistics. The full spec is in `SPEC.MD`, the current state
and the TODOs are in `README.md`.

Stack: **Spring Boot 3.4 (Java 21) + Spring Data JPA + PostgreSQL**, the frontend is **vanilla
HTML/JS**, served as static files from the same origin (no CORS, no build step).

## Common commands

```bash
# Run (dev) — first have a live Postgres, see below
mvn spring-boot:run

# Build (runnable JAR into target/)
mvn clean package

# All tests
mvn test

# A single test class / method
mvn test -Dtest=LearningTrackerApplicationTests
mvn test -Dtest=LearningTrackerApplicationTests#contextLoads
```

The app runs at <http://localhost:8080>; the schema is created on first startup
(`spring.jpa.hibernate.ddl-auto=update`).

### Database

The `contextLoads` test **also requires a live Postgres connection** (there is no H2 test profile,
although the SPEC suggests this as a future step). Configure it in `application.properties` or with
an environment variable:

```bash
export DB_USER=postgres
export DB_PASSWORD=postgres
```

Important: the JDBC URL expects Postgres on **port 5435** (not the default 5432) — see
`spring.datasource.url` in `application.properties`. The `learning_tracker` database must be
created manually (`CREATE DATABASE learning_tracker;`).

## Architecture

**Package-per-feature** layout under `com.learningtracker`. Each feature is a package,
and typically follows the same triple pattern: `Entity` (JPA) + `Repository`
(`JpaRepository`) + `@RestController` (`/api/...`).

- **`subject/`** — Subject catalog (`Subject`). Archivable instead of deletion (`archived`).
- **`session/`** — `StudySession` (`@ManyToOne` to `Subject`) + `SessionSource` enum
  (`TIMER` / `MANUAL`). The dashboard list sorts by `date DESC, created_at DESC`.
- **`settings/`** — Single-row `Settings` (daily hour goal, `dailyGoalMinutes`).
- **`stats/`** — Derived, **non-stored** aggregations (`summary` / `daily` / `streak`).
  **Currently a placeholder** (returns empty/zero); writing these is the main open work.
- **`quote/`** — Motivational quotes; `QuoteSeeder` (`CommandLineRunner`) populates it when the
  table is empty. The home page calls the `/api/quotes/random` endpoint.

### Important conventions

- **Native SQL in the repositories.** The existing queries use `@Query(nativeQuery = true)`
  (e.g. `StudySessionRepository`, `QuoteRepository` `ORDER BY RANDOM()`). The
  `stats` aggregations should also be written **in SQL** (`GROUP BY` / `SUM(duration_minutes)`),
  not summed in Java — this is the project's stated goal (SQL practice). Table names are
  snake_case (`study_sessions`, `quotes`, `subjects`).
- **Input DTO records.** The controllers accept a `record` as `@RequestBody`
  (e.g. `SessionRequest`, `QuoteRequest`), not the entity directly. The `stats` responses
  are also record DTOs. The other endpoints, however, **currently return the entity** — introducing
  response DTOs is an open TODO.
- **Error handling** with `ResponseStatusException` (`HttpStatus.NOT_FOUND` / `BAD_REQUEST`).

### Frontend

Several separate static HTML pages in `src/main/resources/static/`
(`index.html`, `naplo.html`, `idozito.html`, `uj-elem.html`, …), plus a shared `style.css`.
No router and no build — navigation is plain `window.location.href`.

The JS is split into **native ES modules** under `static/js/` (no bundler; the browser loads
them directly). Each page loads a single entry point via `<script type="module"
src="/js/pages/<page>.js">`, which imports only the feature modules it needs. Shared modules
live in `js/`: `api.js` (fetch layer), `ui.js` (`showFormMessage`, `mountFragment`,
`bindOverlayDismiss`, `iconButton`, `postSession`), `chrome.js` (`initChrome` = menu + header
stats), and feature modules (`sessions.js`, `timer.js`, `kodtar-elem.js`, …). Because a module
only runs on the page that imports it, defensive `if (!el) return;` guards are kept only where
presence is genuinely conditional (header stats, fragment mount points).

The **timer is entirely client-side** (a start/pause/stop/save state machine in `js/timer.js`); the
server only sees the **finished** session POSTed on stop (`source: "TIMER"`) —
there is no server-side "running clock" state.