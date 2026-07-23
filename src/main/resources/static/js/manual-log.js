"use strict";

import { postSession } from "./ui.js";

// --- Kezi rogzites (uj-elem.html) ---
export function initManualLog() {
  document.getElementById("log-save")?.addEventListener("click", saveSession);
  document.getElementById("log-back")?.addEventListener("click", () => {
    window.location.href = "/naplo.html";
  });
}

async function saveSession() {
  const body = {
    subjectId: Number(document.getElementById("log-subject").value),
    date: document.getElementById("log-date").value || null,
    durationMinutes: Number(document.getElementById("log-duration").value),
    note: document.getElementById("log-note").value || null,
    source: "MANUAL",
  };
  // TODO: validacio (targy kivalasztva? perc > 0?)
  await postSession(body, "form-message");
}
