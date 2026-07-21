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
  // TODO: feltolteni a #timer-subject es #log-subject select-eket
  console.log("subjects", subjects);
}

async function loadSessions() {
  const sessions = await api.get("/api/sessions");
  const body = document.getElementById("sessions-body");
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
  await api.post("/api/sessions", body);
  await loadSessions();
  await loadStats();
}

// --- Idozito (kliensoldali; leallitaskor mentunk egy kesz session-t) ---
let timerStart = null;
let timerInterval = null;

function startTimer() {
  timerStart = Date.now();
  timerInterval = setInterval(renderTimer, 1000);
  document.getElementById("timer-start").disabled = true;
  document.getElementById("timer-stop").disabled = false;
}

function renderTimer() {
  const secs = Math.floor((Date.now() - timerStart) / 1000);
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  document.getElementById("timer-display").textContent = `${hh}:${mm}:${ss}`;
}

async function stopTimer() {
  clearInterval(timerInterval);
  const minutes = Math.max(1, Math.round((Date.now() - timerStart) / 60000));
  const body = {
    subjectId: Number(document.getElementById("timer-subject").value),
    date: null, // ma
    durationMinutes: minutes,
    note: null,
    source: "TIMER",
  };
  // TODO: validacio + a display nullazasa
  await api.post("/api/sessions", body);
  document.getElementById("timer-start").disabled = false;
  document.getElementById("timer-stop").disabled = true;
  await loadSessions();
  await loadStats();
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
// TODO: menu-item kattintasra a megfelelo nezet megjelenitese (egyelore nincs implementalva)

// --- Bekotesek ---
document.getElementById("log-save").addEventListener("click", saveSession);
document.getElementById("timer-start").addEventListener("click", startTimer);
document.getElementById("timer-stop").addEventListener("click", stopTimer);

// --- Indulas ---
loadSubjects();
loadSessions();
loadStats();
