# Tanulás-követő webapp — Specifikáció

Egyszerű, **egyszemélyes** tanulás-követő alkalmazás. Backend: **Java Spring Boot**.

## 1. Áttekintés

Tanulási **session-öket** naplózol: *mivel foglalkoztál* + *hány perc/óra*. A rögzítés kétféleképp megy: beépített **időzítővel** vagy **kézzel**. A tárgyakat egy általad karbantartott **katalógusból** választod. A fő motiváció a **napi streak** (tanultam-e ma) és a **statisztika**. Emlékeztetőre nincs szükség.

## 2. Adatmodell (Spring Boot entitások)

Három entitás + egy származtatott (nem tárolt) összesítő réteg.

### Subject — a tárgy-katalógus („kódtár")

| Mező | Típus | Megjegyzés |
|------|-------|-----------|
| `id` | Long | PK |
| `name` | String | egyedi |
| `archived` | boolean | rejtsd el a régit törlés nélkül |
| `createdAt` | Instant | |

*Később:* `color` (grafikonokhoz).

### StudySession — egy tanulási alkalom

| Mező | Típus | Megjegyzés |
|------|-------|-----------|
| `id` | Long | PK |
| `subjectId` | Long | FK → Subject |
| `date` | LocalDate | ehhez a naphoz számít |
| `durationMinutes` | int | |
| `note` | String (text) | megjegyzés — MVP-mező, kitöltése nem kötelező |
| `source` | enum | `TIMER` / `MANUAL` |
| `createdAt` | Instant | rögzítés időpontja |

Az időzítő a fronton fut; leállításkor egy **kész** session-t POST-olsz. Szerveroldali „futó óra" állapotra nincs szükség az MVP-ben.

### Settings — egy sor (mert egyszemélyes)

| Mező | Típus | Megjegyzés |
|------|-------|-----------|
| `dailyGoalMinutes` | Integer | opcionális küszöb — ennyi kell, hogy a nap „teljesített" legyen |

A **streak** és a napi/tárgyankénti összesítés **nem tárolt** mező, hanem a session-ökből számolt érték.

## 3. Dashboard (fő nézet)

A kezdőképernyő az **összes session időrendi listája**, alapértelmezés szerint a **session dátuma szerint, legújabb elöl**.

- Minden sor: dátum, tárgy, időtartam, megjegyzés (rövidítve).
- Sorból közvetlenül szerkeszthető / törölhető.
- A lista fölött fejlécként: aktuális **streak** és a **napi összóra**, hogy egy képernyőn látszódjon a lényeg.
- Mivel visszamenőleg is lehet naplózni, a „mikor tanultál" (`date`) és a „mikor rögzítetted" (`createdAt`) eltérhet — a dashboard a `date` szerint rendez, de a `createdAt` szerinti rendezés is választható legyen.

## 4. Funkciók — MVP

- Tárgy-katalógus kezelése: felvétel, átnevezés, archiválás
- Session naplózása kézzel: tárgy + dátum + időtartam + megjegyzés
- Időzítő: start/stop → leállításkor session jön létre
- **Dashboard**: az összes session dátum szerint rendezett listája, szerkesztéssel/törléssel
- Session-lista szűrése (dátum, tárgy)
- Napi **streak** kijelzése (egymást követő napok, amikor tanultál)
- Alap **statisztika**: összóra, tárgyankénti bontás, napi/heti óra idővonalon
- Napi óracél beállítása (opcionális küszöb a streakhez)

## 5. Funkciók — Később

- Heti/havi célok, tárgyankénti célok
- Címkék
- Naptár-hőtérkép (GitHub-stílusú) a streakhez; leghosszabb streak külön kiemelve
- Tárgyszínek, ikonok
- CSV / JSON export
- Jegyzetekhez linkek / erőforrások csatolása
- Bejelentkezés / többfelhasználós mód / felhő-szinkron
- Emlékeztetők (ha később mégis kellene)

## 6. REST végpontok (MVP)

```
GET/POST        /api/subjects
PUT/DELETE      /api/subjects/{id}

GET             /api/sessions?from=&to=&subjectId=&sort=date,desc
POST            /api/sessions           # törzs: subjectId, date, durationMinutes, note, source
PUT/DELETE      /api/sessions/{id}

GET             /api/stats/summary?from=&to=   # összperc + tárgyankénti bontás
GET             /api/stats/daily?from=&to=     # perc/nap (grafikonhoz + streakhez)
GET             /api/stats/streak              # jelenlegi + leghosszabb streak

GET/PUT         /api/settings                  # dailyGoalMinutes
```

## 7. Technikai megjegyzések

- **Stack:** Spring Boot + Spring Data JPA.
- **Adatbázis:** dev-hez H2, éleshez Postgres.
- A `stats` végpontokat érdemes **natív SQL / JPQL aggregációval** megírni (`GROUP BY subject`, `SUM(durationMinutes)`), nem Java-ban összegezni — így valós SQL-en gyakorolsz.
- Az időzítő kliensoldali; csak a kész session kerül a szerverre.

## 8. Nyitott pontok (a véglegesítéshez)

1. **Frontend:** szerveroldali (Thymeleaf) vagy külön SPA (pl. React)? Ez dönti el, hogy a REST réteg teljesen kell-e, vagy elég MVC-controller.
2. **A nap határa a streakhez:** helyi éjfél a vágópont? (Fix időzóna, mert egyszemélyes.)
3. **Visszamenőleges naplózás:** feltételezés szerint engedélyezett (a kézi bevitel ezt sugallja).
