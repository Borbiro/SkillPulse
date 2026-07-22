# Learning Tracker webapp — Specification

A simple, **single-user** learning tracker application. Backend: **Java Spring Boot**.

## 1. Overview

You log learning **sessions**: *what you worked on* + *how many minutes/hours*. Recording works two ways: with a built-in **timer** or **manually**. You pick subjects from a **catalog** you maintain yourself. The main motivation is the **daily streak** (did I study today) and the **statistics**. No reminders are needed.

## 2. Data model (Spring Boot entities)

Three entities + a derived (non-stored) aggregation layer.

### Subject — the subject catalog ("code library")

| Field | Type | Note |
|------|-------|-----------|
| `id` | Long | PK |
| `name` | String | unique |
| `archived` | boolean | hide old ones without deleting |
| `createdAt` | Instant | |

*Later:* `color` (for charts).

### StudySession — a single learning occasion

| Field | Type | Note |
|------|-------|-----------|
| `id` | Long | PK |
| `subjectId` | Long | FK → Subject |
| `date` | LocalDate | counts toward this day |
| `durationMinutes` | int | |
| `note` | String (text) | note — MVP field, optional to fill in |
| `source` | enum | `TIMER` / `MANUAL` |
| `createdAt` | Instant | time of recording |

The timer runs on the frontend; when stopped you POST a **finished** session. No server-side "running clock" state is needed in the MVP.

### Settings — a single row (because it's single-user)

| Field | Type | Note |
|------|-------|-----------|
| `dailyGoalMinutes` | Integer | optional threshold — this much is required for a day to count as "achieved" |

The **streak** and the per-day/per-subject aggregation are **not stored** fields, but values computed from the sessions.

### Quote — motivational quotes (added during implementation)

| Field | Type | Note |
|------|-------|-----------|
| `id` | Long | PK |
| `text` | String (text) | the quote |

A small extra beyond the original spec: the home page shows a random quote. A `QuoteSeeder` (`CommandLineRunner`) populates the table when it is empty.

## 3. Dashboard (main view)

The home screen is the **chronological list of all sessions**, by default **sorted by session date, newest first**.

- Each row: date, subject, duration, note (abbreviated).
- Editable / deletable directly from the row.
- Above the list, as a header: current **streak** and the **daily total hours**, so the essentials are visible on one screen.
- Since you can also log retroactively, "when you studied" (`date`) and "when you recorded it" (`createdAt`) may differ — the dashboard sorts by `date`, but sorting by `createdAt` should also be selectable.

## 4. Features — MVP

- Managing the subject catalog: adding, renaming, archiving
- Logging a session manually: subject + date + duration + note
- Timer: start/stop → a session is created on stop
- **Dashboard**: the list of all sessions sorted by date, with edit/delete
- Filtering the session list (date, subject)
- Displaying the daily **streak** (consecutive days you studied)
- Basic **statistics**: total hours, per-subject breakdown, daily/weekly hours on a timeline
- Setting a daily hour goal (optional threshold for the streak)

## 5. Features — Later

- Weekly/monthly goals, per-subject goals
- Tags
- Calendar heatmap (GitHub-style) for the streak; longest streak highlighted separately
- Subject colors, icons
- CSV / JSON export
- Attaching links / resources to notes
- Login / multi-user mode / cloud sync
- Reminders (if they turn out to be needed after all)

## 6. REST endpoints (MVP)

```
GET/POST        /api/subjects
PUT/DELETE      /api/subjects/{id}

GET             /api/sessions?from=&to=&subjectId=&sort=date,desc
POST            /api/sessions           # body: subjectId, date, durationMinutes, note, source
PUT/DELETE      /api/sessions/{id}

GET             /api/stats/summary?from=&to=   # total minutes + per-subject breakdown
GET             /api/stats/daily?from=&to=     # minutes/day (for chart + streak)
GET             /api/stats/streak              # current + longest streak

GET/PUT         /api/settings                  # dailyGoalMinutes

GET/POST        /api/quotes                    # added during implementation
GET             /api/quotes/random             # random quote for the home page
```

## 7. Technical notes

- **Stack:** Spring Boot + Spring Data JPA.
- **Database:** currently Postgres for both dev and production (on port 5435); an H2 test profile is a future step (not yet implemented — even the `contextLoads` test requires a live Postgres).
- The `stats` endpoints are best written with **native SQL / JPQL aggregation** (`GROUP BY subject`, `SUM(durationMinutes)`), not summed in Java — this way you practice on real SQL.
- The timer is client-side; only the finished session reaches the server.

## 8. Open items (to finalize)

1. **Frontend:** server-side (Thymeleaf) or a separate SPA (e.g. React)? This decides whether the REST layer is fully needed or an MVC controller is enough.
2. **The day boundary for the streak:** is local midnight the cut-off point? (Fixed timezone, since it's single-user.)
3. **Retroactive logging:** assumed to be allowed (manual entry implies this).