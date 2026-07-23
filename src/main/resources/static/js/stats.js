"use strict";

import { api } from "./api.js";

// --- Header statisztika: streak + mai osszperc ---
export async function loadStats() {
  const streakEl = document.getElementById("streak");
  const todayEl = document.getElementById("today-total");
  if (!streakEl && !todayEl) return; // header nelkuli oldalon nincs mit frissiteni

  const streak = await api.get("/api/stats/streak");
  if (streakEl) streakEl.textContent = streak.current ?? "–";

  // Mai osszperc a headerbe (a szerver a mai datum szerint osszegez).
  const today = await api.get("/api/stats/today");
  if (todayEl) todayEl.textContent = today.totalMinutes ?? "–";
  // TODO: summary + daily lekerese, chart kirajzolasa
}
