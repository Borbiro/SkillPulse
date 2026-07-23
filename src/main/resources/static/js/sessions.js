"use strict";

import { api } from "./api.js";
import { loadStats } from "./stats.js";
import { mountFragment, bindOverlayDismiss, iconButton } from "./ui.js";

const EYE_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const TRASH_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

// --- Naplo oldal: alkalom-lista + szerkeszto modal ---
export async function initNaplo() {
  await mountFragment("session-modal-mount", "/alkalom-modal.html", initSessionModal);
  document.getElementById("new-entry-btn")?.addEventListener("click", () => {
    window.location.href = "/uj-elem.html";
  });
  await loadSessions();
}

async function loadSessions() {
  const body = document.getElementById("sessions-body");
  if (!body) return;
  const sessions = await api.get("/api/sessions");
  body.innerHTML = "";
  for (const s of sessions) {
    const tr = document.createElement("tr");

    const noteShort = s.note && s.note.length > 60 ? s.note.slice(0, 60) + "…" : (s.note ?? "");

    const view = iconButton(EYE_SVG, "Megtekintés", () => openSessionModal(s));
    const del = iconButton(TRASH_SVG, "Törlés", async () => {
      await api.del(`/api/sessions/${s.id}`);
      await loadSessions();
      await loadStats();
    });

    const actionsTd = document.createElement("td");
    actionsTd.append(view, del);

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

// --- Alkalom szerkeszto modal (kulon alkalom-modal.html fragmentbol) ---
// A naplo "Megtekintés" gombja nyitja meg, az adott alkalom adataival feltoltve.
let sessionEditId = null;      // az eppen szerkesztett alkalom azonositoja
let sessionEditSource = null;  // az eredeti forras (TIMER/MANUAL), hogy a PUT ne irja felul
let sessionModalMode = "view"; // "view" = csak megtekintes, "edit" = szerkesztheto

function initSessionModal() {
  const overlay = document.getElementById("session-edit-overlay");
  if (!overlay) return;

  document.getElementById("session-edit-cancel")?.addEventListener("click", closeSessionModal);
  document.getElementById("session-edit-save")?.addEventListener("click", onSessionModalPrimary);
  bindOverlayDismiss(overlay, closeSessionModal);
}

/** Megnyitja a szerkeszto modalt a kapott alkalom adataival feltoltve. */
async function openSessionModal(session) {
  const overlay = document.getElementById("session-edit-overlay");
  if (!overlay) return;

  const subjectSelect = document.getElementById("session-edit-subject");
  const msg = document.getElementById("session-edit-message");

  sessionEditId = session.id;
  sessionEditSource = session.source ?? "MANUAL";

  // A tantargy-valaszto feltoltese a katalogusbol (archivaltakkal egyutt, hogy a
  // jelenlegi tantargy akkor is szerepeljen, ha kozben archivaltak).
  const subjects = await api.get("/api/subjects?includeArchived=true");
  subjectSelect.innerHTML = "";
  for (const s of subjects) {
    const option = document.createElement("option");
    option.value = s.id;
    option.textContent = s.name;
    subjectSelect.appendChild(option);
  }
  if (session.subject?.id != null) subjectSelect.value = String(session.subject.id);

  document.getElementById("session-edit-date").value = session.date ?? "";
  document.getElementById("session-edit-minutes").value = session.durationMinutes ?? "";
  document.getElementById("session-edit-note").value = session.note ?? "";
  if (msg) msg.hidden = true;

  setSessionModalMode("view"); // megnyitaskor minden mezo csak olvashato
  overlay.hidden = false;
}

function closeSessionModal() {
  const overlay = document.getElementById("session-edit-overlay");
  if (overlay) overlay.hidden = true;
  sessionEditId = null;
}

/**
 * A mezok szerkeszthetosegenek es a fogomb feliratanak beallitasa.
 * "view"  -> minden mezo csak olvashato, a gomb "Szerkesztés".
 * "edit"  -> Datum / Perc / Megjegyzes szerkesztheto (a tantargy sosem), a gomb "Mentés".
 */
function setSessionModalMode(mode) {
  sessionModalMode = mode;
  const editable = mode === "edit";

  // A tantargy nem modosithato, ezert mindig letiltva marad.
  document.getElementById("session-edit-subject").disabled = true;
  document.getElementById("session-edit-date").disabled = !editable;
  document.getElementById("session-edit-minutes").disabled = !editable;
  document.getElementById("session-edit-note").disabled = !editable;

  const primary = document.getElementById("session-edit-save");
  if (primary) primary.textContent = editable ? "Mentés" : "Szerkesztés";
}

// Uzenet megjelenitese a modalban (type: "success" vagy "error").
function showSessionModalMessage(text, type) {
  const msg = document.getElementById("session-edit-message");
  if (!msg) return;
  msg.textContent = text;
  msg.classList.remove("error", "success");
  msg.classList.add(type);
  msg.hidden = false;
}

// A fogomb ketfele viselkedese a mod szerint: megtekintesbol szerkesztesbe valt,
// szerkesztesben pedig ment.
function onSessionModalPrimary() {
  if (sessionModalMode === "view") {
    const msg = document.getElementById("session-edit-message");
    if (msg) msg.hidden = true;
    setSessionModalMode("edit");
    document.getElementById("session-edit-date").focus();
  } else {
    submitSessionModal();
  }
}

async function submitSessionModal() {
  const subjectId = Number(document.getElementById("session-edit-subject").value);
  const date = document.getElementById("session-edit-date").value || null;
  const minutes = Number(document.getElementById("session-edit-minutes").value);
  const note = document.getElementById("session-edit-note").value.trim() || null;

  if (!subjectId) { showSessionModalMessage("Válassz tárgyat!", "error"); return; }
  if (!Number.isFinite(minutes) || minutes <= 0) {
    showSessionModalMessage("A perc legyen 0-nál nagyobb!", "error");
    return;
  }

  // Az eredeti forrast visszakuldjuk, mert a PUT feltetel nelkul felulirja azt.
  const res = await api.put(`/api/sessions/${sessionEditId}`, {
    subjectId,
    date,
    durationMinutes: minutes,
    note,
    source: sessionEditSource,
  });

  if (res && res.id) {
    await loadSessions();
    await loadStats();
    setSessionModalMode("view"); // sikeres mentes utan vissza megtekintes modba
    showSessionModalMessage("Sikeres szerkesztés!", "success");
  } else {
    showSessionModalMessage("A módosítás nem sikerült.", "error");
  }
}
