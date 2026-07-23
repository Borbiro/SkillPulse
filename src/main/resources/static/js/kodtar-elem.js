"use strict";

import { api } from "./api.js";
import { mountFragment, bindOverlayDismiss } from "./ui.js";

// Az eppen megnyitott kodtar; a gombok innen tudjak, melyik torzstablat kell modositani.
let currentKodtar = null;

// --- Kodtar elem oldal osszerakasa (kodtar-elem.html) ---
export async function initKodtarElem() {
  await mountFragment("modal-mount", "/uj-tantargy-modal.html", initSubjectModal);
  await mountFragment("confirm-mount", "/megerosites-modal.html", initConfirmModal);
  wireActions();
  await loadKodtarElem();
}

/**
 * Az adott kodtar rekordjait tolti be. A "Tantárgyak" kodtar a subjects tablaval
 * van osszekotve, igy annak adatait jelenitjuk meg (Nev + Allapot: Aktiv / Inaktiv).
 */
async function loadKodtarElem() {
  const body = document.getElementById("kodtar-elem-body");
  if (!body) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const titleEl = document.getElementById("kodtar-elem-title");

  // A kodtar nevet a listabol keressuk ki (nincs kulon GET /{id} vegpont).
  const kodtarak = await api.get("/api/kodtarak");
  const kodtar = kodtarak.find(k => String(k.id) === String(id));
  currentKodtar = kodtar ?? null;
  if (titleEl && kodtar) titleEl.textContent = kodtar.name;

  body.innerHTML = "";

  // Egyelore csak a "Tantárgyak" kodtarhoz tartozik adatforras (subjects tabla).
  if (kodtar && kodtar.name === "Tantárgyak") {
    const subjects = await api.get("/api/subjects?includeArchived=true");
    for (const s of subjects) {
      const tr = document.createElement("tr");

      const selectTd = document.createElement("td");
      selectTd.className = "select-col";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "kodtar-rekord";
      radio.value = s.id;
      radio.setAttribute("aria-label", "Rekord kivalasztasa");
      selectTd.appendChild(radio);

      const nameTd = document.createElement("td");
      nameTd.textContent = s.name;

      const statusTd = document.createElement("td");
      statusTd.textContent = s.archived ? "Inaktív" : "Aktív";
      if (s.archived) statusTd.className = "muted";

      tr.append(selectTd, nameTd, statusTd);
      body.appendChild(tr);
    }
  }
}

// --- A kodtar-elem gombok kozos ellenorzesei ---

// Igaz, ha az aktualis kodtar a "Tantárgyak" (csak ehhez van adatforras).
function requireTantargyKodtar() {
  if (!currentKodtar || currentKodtar.name !== "Tantárgyak") {
    alert("Ehhez a kódtárhoz még nincs bekötve adatforrás.");
    return false;
  }
  return true;
}

// A kivalasztott sor adatai (id, nev, allapot) vagy null, ha nincs kivalasztva.
// A selectPrompt a "nincs kivalasztva" figyelmeztetes vegere kerul.
function selectedRow(selectPrompt) {
  const selected = document.querySelector('input[name="kodtar-rekord"]:checked');
  if (!selected) {
    alert(`Előbb válassz ki egy rekordot ${selectPrompt}.`);
    return null;
  }
  // Sor-cella sorrend: kivalaszto, nev, allapot.
  const row = selected.closest("tr");
  return {
    id: selected.value,
    name: row?.children[1]?.textContent ?? "",
    status: row?.children[2]?.textContent ?? "",
  };
}

// Deaktivalas/aktivalas: kozos folyamat, csak a szovegek es a cel-allapot ter el.
// opts: { archived, selectPrompt, alreadyStatus, alreadyMsg, confirm(nev), okLabel, failMsg }
async function setArchived(opts) {
  if (!requireTantargyKodtar()) return;
  const row = selectedRow(opts.selectPrompt);
  if (!row) return;
  if (row.status === opts.alreadyStatus) {
    alert(opts.alreadyMsg);
    return;
  }
  const ok = await confirmModal({ message: opts.confirm(row.name), okLabel: opts.okLabel });
  if (!ok) return;

  // A nevet is elkuldjuk, mert a PUT feltetel nelkul felulirja azt.
  const res = await api.put(`/api/subjects/${row.id}`, { name: row.name, archived: opts.archived });
  if (res && res.id) {
    await loadKodtarElem(); // tabla frissitese
  } else {
    alert(opts.failMsg);
  }
}

function wireActions() {
  document.getElementById("kodtar-elem-back")?.addEventListener("click", () => {
    window.location.href = "/kodtar.html";
  });

  // Uj rekord: a kozeppontban felugro tantargy-modallal.
  document.getElementById("kodtar-add-btn")?.addEventListener("click", () => {
    if (!requireTantargyKodtar()) return;
    openSubjectModal();
  });

  // Kivalasztott rekord modositasa ugyanabban a modalban (edit mod).
  document.getElementById("kodtar-edit-btn")?.addEventListener("click", () => {
    if (!requireTantargyKodtar()) return;
    const row = selectedRow("a módosításhoz");
    if (!row) return;
    openSubjectModal({ mode: "edit", id: row.id, name: row.name });
  });

  // Deaktivalas (archived = true) / aktivalas (archived = false).
  document.getElementById("kodtar-deactivate-btn")?.addEventListener("click", () => {
    setArchived({
      archived: true,
      selectPrompt: "a deaktiváláshoz",
      alreadyStatus: "Inaktív",
      alreadyMsg: "Ez a tantárgy már inaktív.",
      confirm: (name) => `Biztosan deaktiválod a(z) „${name}" tantárgyat?`,
      okLabel: "Deaktiválás",
      failMsg: "A deaktiválás nem sikerült.",
    });
  });
  document.getElementById("kodtar-activate-btn")?.addEventListener("click", () => {
    setArchived({
      archived: false,
      selectPrompt: "az aktiváláshoz",
      alreadyStatus: "Aktív",
      alreadyMsg: "Ez a tantárgy már aktív.",
      confirm: (name) => `Biztosan aktiválod a(z) „${name}" tantárgyat?`,
      okLabel: "Aktiválás",
      failMsg: "Az aktiválás nem sikerült.",
    });
  });
}

// --- Uj/szerkeszto tantargy modal (kulon uj-tantargy-modal.html fragmentbol) ---
// A modal aktualis allapota: "add" = uj tantargy, "edit" = meglevo modositasa.
let subjectModalMode = "add";
let subjectModalId = null;

function initSubjectModal() {
  const overlay = document.getElementById("modal-overlay");
  if (!overlay) return;

  document.getElementById("modal-cancel")?.addEventListener("click", closeSubjectModal);
  document.getElementById("modal-save")?.addEventListener("click", submitSubjectModal);
  bindOverlayDismiss(overlay, closeSubjectModal);

  // Enter a mezoben = mentes.
  document.getElementById("modal-subject-name")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitSubjectModal();
  });
}

/**
 * A kozos modal megnyitasa. Parameterek nelkul "add" (uj tantargy) modban nyit;
 * { mode: "edit", id, name } eseten a meglevo tantargyat toltodik be szerkesztesre.
 */
function openSubjectModal(opts = {}) {
  const overlay = document.getElementById("modal-overlay");
  if (!overlay) return;
  const input = document.getElementById("modal-subject-name");
  const msg = document.getElementById("modal-message");
  const title = document.getElementById("modal-title");
  const saveBtn = document.getElementById("modal-save");

  subjectModalMode = opts.mode === "edit" ? "edit" : "add";
  subjectModalId = subjectModalMode === "edit" ? opts.id : null;

  if (title) title.textContent = subjectModalMode === "edit" ? "Tantárgy módosítása" : "Új tantárgy";
  if (saveBtn) saveBtn.textContent = subjectModalMode === "edit" ? "Mentés" : "Hozzáadás";
  if (input) input.value = opts.name ?? "";
  if (msg) msg.hidden = true;

  overlay.hidden = false;
  input?.focus();
  input?.select();
}

function closeSubjectModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.hidden = true;
}

async function submitSubjectModal() {
  const input = document.getElementById("modal-subject-name");
  const msg = document.getElementById("modal-message");
  const name = (input?.value ?? "").trim();
  if (!name) {
    if (msg) { msg.textContent = "Adj meg egy nevet!"; msg.hidden = false; }
    input?.focus();
    return;
  }

  // Uj felvetel (POST) vagy meglevo modositasa (PUT) a mod alapjan.
  const res = subjectModalMode === "edit"
    ? await api.put(`/api/subjects/${subjectModalId}`, { name })
    : await api.post("/api/subjects", { name });

  if (res && res.id) {
    closeSubjectModal();
    await loadKodtarElem(); // tabla frissitese
  } else if (msg) {
    msg.textContent = subjectModalMode === "edit"
      ? "A módosítás nem sikerült (talán már létezik ilyen név)."
      : "A tantárgy létrehozása nem sikerült (talán már létezik ilyen név).";
    msg.hidden = false;
  }
}

// --- Megerosito modal (kulon megerosites-modal.html fragmentbol) ---
let confirmResolve = null; // az eppen nyitott megerosites Promise-anak feloldoja

function initConfirmModal() {
  const overlay = document.getElementById("confirm-overlay");
  if (!overlay) return;

  document.getElementById("confirm-cancel")?.addEventListener("click", () => settleConfirm(false));
  document.getElementById("confirm-ok")?.addEventListener("click", () => settleConfirm(true));
  bindOverlayDismiss(overlay, () => settleConfirm(false));
}

/**
 * Megerosito modal megnyitasa. Promise-t ad vissza: true = megerositve, false = megse.
 * opts: { message, okLabel }
 */
function confirmModal(opts = {}) {
  const overlay = document.getElementById("confirm-overlay");
  const msg = document.getElementById("confirm-message");
  const okBtn = document.getElementById("confirm-ok");
  if (!overlay) return Promise.resolve(false);

  if (msg) msg.textContent = opts.message ?? "Biztosan folytatod?";
  if (okBtn) okBtn.textContent = opts.okLabel ?? "Igen";

  overlay.hidden = false;
  okBtn?.focus();
  return new Promise((resolve) => { confirmResolve = resolve; });
}

function settleConfirm(result) {
  const overlay = document.getElementById("confirm-overlay");
  if (overlay) overlay.hidden = true;
  if (confirmResolve) {
    confirmResolve(result);
    confirmResolve = null;
  }
}
