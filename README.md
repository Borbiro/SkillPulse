# Tanulás-követő

Egyszemélyes tanulás-követő. **Spring Boot + PostgreSQL + vanilla HTML/JS**, egyetlen JAR-ban
(a frontend statikus fájlként, azonos originről — nincs CORS).

## Előfeltételek

- Java 21
- Maven 3.9+
- PostgreSQL

## Indítás

1. Hozd létre az adatbázist:
   ```sql
   CREATE DATABASE learning_tracker;
   ```
2. Add meg a kapcsolatot (vagy szerkeszd az `application.properties`-t):
   ```bash
   export DB_USER=postgres
   export DB_PASSWORD=postgres
   ```
3. Futtasd:
   ```bash
   mvn spring-boot:run
   ```
4. Nyisd meg: <http://localhost:8080>

> A séma az első indításkor létrejön (`spring.jpa.hibernate.ddl-auto=update`).
> Éles használatra érdemes Flyway/Liquibase migrációra váltani és `validate`-re állítani.

## Szerkezet

```
src/main/java/com/learningtracker/
├── LearningTrackerApplication.java
├── subject/    Subject entitás, repo, REST controller (CRUD kész)
├── session/    StudySession + SessionSource, repo, REST controller (CRUD kész)
├── settings/   Settings (napi óracél), repo, controller (kész)
└── stats/      StatsController — summary/daily/streak (TODO: SQL aggregáció)
src/main/resources/
├── application.properties
└── static/     index.html, app.js, style.css  (frontend-váz)
```

## Mi kész és mi a TODO

**Kész (bekötve, fut):**
- Tárgy-katalógus CRUD
- Session CRUD, dashboard-lista dátum szerint rendezve, megjegyzés mezővel
- Beállítások (napi óracél)
- Frontend-váz az összes képernyővel és bekötött `fetch` hívásokkal

**TODO (neked):**
- `stats/StatsController`: a `summary` / `daily` / `streak` aggregáló lekérdezései
  (jó terep a SQL `GROUP BY` / `SUM` gyakorlásához — lásd a repo-ban a mintát)
- Frontend renderelés: a `// TODO` jelölt helyeken (select-ek feltöltése, lista- és
  chart-kirajzolás, mai összperc)
- Validáció, hibakezelés, DTO-k a válaszoknál (jelenleg entitást ad vissza)

## Nyitott döntések (a SPEC.md-ből)

- A nap határa a streakhez (helyi éjfél / fix időzóna)
- Tárgy törlése: kemény törlés vagy archiválás, ha vannak hozzá session-ök
