"use strict";

import { showFormMessage, postSession } from "./ui.js";
import { loadStats } from "./stats.js";

// --- Idozito (kliensoldali; menteskor rogzitunk egy kesz session-t) ---
let timerStart = null;   // a jelenleg futo szakasz kezdete (ms), vagy null ha all
let timerElapsedMs = 0;  // a korabbi szakaszokban felhalmozott ido
let timerInterval = null;

export function initTimer() {
  document.getElementById("timer-start")?.addEventListener("click", startTimer);
  document.getElementById("timer-pause")?.addEventListener("click", pauseTimer);
  document.getElementById("timer-stop")?.addEventListener("click", stopTimer);
  document.getElementById("timer-save")?.addEventListener("click", saveTimer);
  document.getElementById("timer-back")?.addEventListener("click", () => {
    window.location.href = "/naplo.html";
  });
}

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
    showFormMessage("form-message", "Válassz tárgyat!", "error");
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
  const ok = await postSession(body, "form-message");
  if (!ok) return;
  resetTimer();
  document.getElementById("timer-note").value = "";
  await loadStats(); // a headerbeli "Ma" perc frissitese
}
