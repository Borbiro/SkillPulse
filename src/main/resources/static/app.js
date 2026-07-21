"use strict";

// --- Egyszeru API-reteg (azonos origin, nincs CORS) ---
const api = {
  get: (path) => fetch(path).then(r => r.json()),
  post: (path, body) => fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(r => r.json()),
  put: (path, body) => fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(r => r.json()),
  del: (path) => fetch(path, { method: "DELETE" }),
};

// --- Betoltes ---
async function loadSubjects() {
  const subjects = await api.get("/api/subjects");
  const selects = [
    document.getElementById("timer-subject"),
    document.getElementById("log-subject"),
  ].filter(Boolean);

  for (const select of selects) {
    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Válassz tárgyat…";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    for (const s of subjects) {
      const option = document.createElement("option");
      option.value = s.id;
      option.textContent = s.name;
      select.appendChild(option);
    }
  }
}

async function loadSessions() {
  const body = document.getElementById("sessions-body");
  if (!body) return; // a Naplo tabla csak a naplo.html oldalon van jelen
  const sessions = await api.get("/api/sessions");
  body.innerHTML = "";
  for (const s of sessions) {
    const tr = document.createElement("tr");

    const noteShort = s.note && s.note.length > 60 ? s.note.slice(0, 60) + "…" : (s.note ?? "");

    const del = document.createElement("button");
    del.textContent = "Törlés";
    del.addEventListener("click", async () => {
      await api.del(`/api/sessions/${s.id}`);
      await loadSessions();
      await loadStats();
    });

    const actionsTd = document.createElement("td");
    actionsTd.appendChild(del);

    const dateTd = document.createElement("td");
    dateTd.textContent = s.date;
    const subjectTd = document.createElement("td");
    subjectTd.textContent = s.subject?.name ?? "";
    const durationTd = document.createElement("td");
    durationTd.textContent = s.durationMinutes;
    const noteTd = document.createElement("td");
    noteTd.textContent = noteShort;

    tr.append(dateTd, subjectTd, durationTd, noteTd, actionsTd);
    body.appendChild(tr);
  }
}

async function loadStats() {
  const streak = await api.get("/api/stats/streak");
  document.getElementById("streak").textContent = streak.current ?? "–";
  // TODO: summary + daily lekerese, chart kirajzolasa, mai osszperc
}

// --- Uzenet megjelenitese az urlapon ---
function showFormMessage(text, type) {
  const el = document.getElementById("form-message");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("error", "success");
  el.classList.add(type);
  el.hidden = false;
}

// --- Kezi rogzites ---
async function saveSession() {
  const body = {
    subjectId: Number(document.getElementById("log-subject").value),
    date: document.getElementById("log-date").value || null,
    durationMinutes: Number(document.getElementById("log-duration").value),
    note: document.getElementById("log-note").value || null,
    source: "MANUAL",
  };
  // TODO: validacio (targy kivalasztva? perc > 0?)
  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showFormMessage("Mentés sikeres!", "success");
    await loadSessions();
    await loadStats();
  } catch (err) {
    console.error("Mentes sikertelen:", err);
    showFormMessage("A mentés nem sikerült!", "error");
  }
}

// --- Idozito (kliensoldali; menteskor rogzitunk egy kesz session-t) ---
let timerStart = null;   // a jelenleg futo szakasz kezdete (ms), vagy null ha all
let timerElapsedMs = 0;  // a korabbi szakaszokban felhalmozott ido
let timerInterval = null;

function timerTotalMs() {
  return timerElapsedMs + (timerStart ? Date.now() - timerStart : 0);
}

// Gombok allapota a 4 idozito-allapot szerint (a Vissza mindig aktiv)
// idle    -> csak Inditas
// running -> Szunet + Leallitas
// paused  -> Inditas + Leallitas
// stopped -> csak Mentes
function setTimerButtons(state) {
  const states = {
    idle:    { start: false, pause: true,  stop: true,  save: true  },
    running: { start: true,  pause: false, stop: false, save: true  },
    paused:  { start: false, pause: true,  stop: false, save: true  },
    stopped: { start: true,  pause: true,  stop: true,  save: false },
  };
  const s = states[state];
  document.getElementById("timer-start").disabled = s.start;
  document.getElementById("timer-pause").disabled = s.pause;
  document.getElementById("timer-stop").disabled = s.stop;
  document.getElementById("timer-save").disabled = s.save;
}

// Az orat futtato szakasz megallitasa (a felhalmozott ido megmarad)
function haltTimer() {
  if (!timerStart) return;
  timerElapsedMs += Date.now() - timerStart;
  timerStart = null;
  clearInterval(timerInterval);
  timerInterval = null;
}

function startTimer() {
  if (timerStart) return; // mar fut
  timerStart = Date.now();
  timerInterval = setInterval(renderTimer, 1000);
  setTimerButtons("running");
}

// Szunet: megallitja az orat, de a felhalmozott idot megtartja
function pauseTimer() {
  haltTimer();
  setTimerButtons("paused");
}

// Leallitas: veglegesen megallitja az orat, csak a Mentes lesz elerheto
function stopTimer() {
  haltTimer();
  setTimerButtons("stopped");
}

function resetTimer() {
  haltTimer();
  timerElapsedMs = 0;
  renderTimer();
  setTimerButtons("idle");
}

function renderTimer() {
  const secs = Math.floor(timerTotalMs() / 1000);
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  document.getElementById("timer-display").textContent = `${hh}:${mm}:${ss}`;
}

async function saveTimer() {
  haltTimer(); // biztonsag kedveert megallitjuk az orat
  const subjectId = Number(document.getElementById("timer-subject").value);
  if (!subjectId) {
    showFormMessage("Válassz tárgyat!", "error");
    return;
  }
  const minutes = Math.max(1, Math.round(timerElapsedMs / 60000));
  const body = {
    subjectId,
    date: null, // ma
    durationMinutes: minutes,
    note: document.getElementById("timer-note").value || null,
    source: "TIMER",
  };
  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showFormMessage("Mentés sikeres!", "success");
    resetTimer();
    document.getElementById("timer-note").value = "";
    await loadSessions();
    await loadStats();
  } catch (err) {
    console.error("Mentes sikertelen:", err);
    showFormMessage("A mentés nem sikerült!", "error");
  }
}

// --- Menu ---
const menuToggle = document.getElementById("menu-toggle");
const sideMenu = document.getElementById("side-menu");
const menuOverlay = document.getElementById("menu-overlay");

function openMenu() {
  sideMenu.classList.add("open");
  sideMenu.setAttribute("aria-hidden", "false");
  menuToggle.setAttribute("aria-expanded", "true");
  menuOverlay.hidden = false;
}

function closeMenu() {
  sideMenu.classList.remove("open");
  sideMenu.setAttribute("aria-hidden", "true");
  menuToggle.setAttribute("aria-expanded", "false");
  menuOverlay.hidden = true;
}

menuToggle.addEventListener("click", () => {
  if (sideMenu.classList.contains("open")) closeMenu();
  else openMenu();
});
menuOverlay.addEventListener("click", closeMenu);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

// A "Napló" menupont egy kulon oldalra navigal, a tobbi meg nincs implementalva (TODO)
document.querySelectorAll(".menu-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.target === "log") {
      window.location.href = "/naplo.html";
      return;
    }
    if (btn.dataset.target === "timer") {
      window.location.href = "/idozito.html";
      return;
    }
    closeMenu();
  });
});

// --- Bekotesek ---
document.getElementById("new-entry-btn")?.addEventListener("click", () => {
  window.location.href = "/uj-elem.html";
});
document.getElementById("log-back")?.addEventListener("click", () => {
  window.location.href = "/naplo.html";
});
document.getElementById("timer-back")?.addEventListener("click", () => {
  window.location.href = "/naplo.html";
});
document.getElementById("log-save")?.addEventListener("click", saveSession);
document.getElementById("timer-start")?.addEventListener("click", startTimer);
document.getElementById("timer-pause")?.addEventListener("click", pauseTimer);
document.getElementById("timer-stop")?.addEventListener("click", stopTimer);
document.getElementById("timer-save")?.addEventListener("click", saveTimer);

// --- Indulas ---
loadSubjects();
loadSessions();
loadStats();
