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

    const view = document.createElement("button");
    view.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    view.title = "Megtekintés";
    view.setAttribute("aria-label", "Megtekintés");
    view.style.display = "inline-flex";
    view.style.alignItems = "center";
    view.style.justifyContent = "center";
    view.style.marginRight = "8px";
    view.addEventListener("click", () => openSessionModal(s));

    const del = document.createElement("button");
    del.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
    del.title = "Törlés";
    del.setAttribute("aria-label", "Törlés");
    del.style.display = "inline-flex";
    del.style.alignItems = "center";
    del.style.justifyContent = "center";
    del.addEventListener("click", async () => {
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

async function loadKodtarak() {
  const body = document.getElementById("kodtar-body");
  if (!body) return; // a Kodtar tabla csak a kodtar.html oldalon van jelen
  const kodtarak = await api.get("/api/kodtarak");
  body.innerHTML = "";
  for (const k of kodtarak) {
    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.textContent = k.name;

    const open = document.createElement("button");
    open.textContent = "Kódtár megnyitása";
    open.className = "btn-primary";
    open.addEventListener("click", () => {
      window.location.href = `/kodtar-elem.html?id=${k.id}`;
    });

    const actionsTd = document.createElement("td");
    actionsTd.appendChild(open);

    tr.append(nameTd, actionsTd);
    body.appendChild(tr);
  }
}

// Az eppen megnyitott kodtar (a kodtar-elem.html oldalon), a gombok innen tudjak,
// melyik torzstablat kell modositani.
let currentKodtar = null;

/**
 * Kodtar elem oldal: az adott kodtar rekordjait tolti be.
 * A "Tantárgyak" kodtar a subjects tablaval van osszekotve, igy annak
 * adatait jelenitjuk meg (Nev + Allapot: Aktiv / Inaktiv az archived alapjan).
 */
async function loadKodtarElem() {
  const body = document.getElementById("kodtar-elem-body");
  if (!body) return; // csak a kodtar-elem.html oldalon van jelen

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

async function loadStats() {
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

// --- Uj tantargy modal (kulon uj-tantargy-modal.html fragmentbol) ---
async function loadSubjectModal() {
  const mount = document.getElementById("modal-mount");
  if (!mount) return; // csak a kodtar-elem.html oldalon van jelen
  const html = await fetch("/uj-tantargy-modal.html").then(r => r.text());
  mount.innerHTML = html;
  initSubjectModal();
}

function initSubjectModal() {
  const overlay = document.getElementById("modal-overlay");
  if (!overlay) return;

  document.getElementById("modal-cancel")?.addEventListener("click", closeSubjectModal);
  document.getElementById("modal-save")?.addEventListener("click", submitSubjectModal);

  // Hatterre kattintva bezar; a kartyan belulre kattintva nem.
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSubjectModal();
  });
  // Enter a mezoben = mentes, Escape = bezaras.
  document.getElementById("modal-subject-name")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitSubjectModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closeSubjectModal();
  });
}

// A modal aktualis allapota: "add" = uj tantargy, "edit" = meglevo modositasa.
let subjectModalMode = "add";
let subjectModalId = null;

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

async function loadConfirmModal() {
  const mount = document.getElementById("confirm-mount");
  if (!mount) return; // csak a kodtar-elem.html oldalon van jelen
  const html = await fetch("/megerosites-modal.html").then(r => r.text());
  mount.innerHTML = html;
  initConfirmModal();
}

function initConfirmModal() {
  const overlay = document.getElementById("confirm-overlay");
  if (!overlay) return;

  document.getElementById("confirm-cancel")?.addEventListener("click", () => settleConfirm(false));
  document.getElementById("confirm-ok")?.addEventListener("click", () => settleConfirm(true));

  // Hatterre kattintva = Megse; a kartyan belulre kattintva nem.
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) settleConfirm(false);
  });
  document.addEventListener("keydown", (e) => {
    if (!overlay.hidden && e.key === "Escape") settleConfirm(false);
  });
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

// --- Alkalom szerkeszto modal (kulon alkalom-modal.html fragmentbol) ---
// A naplo "Megtekintés" gombja nyitja meg, az adott alkalom adataival feltoltve.
let sessionEditId = null;      // az eppen szerkesztett alkalom azonositoja
let sessionEditSource = null;  // az eredeti forras (TIMER/MANUAL), hogy a PUT ne irja felul
let sessionModalMode = "view"; // "view" = csak megtekintes, "edit" = szerkesztheto

async function loadSessionModal() {
  const mount = document.getElementById("session-modal-mount");
  if (!mount) return; // csak a naplo.html oldalon van jelen
  const html = await fetch("/alkalom-modal.html").then(r => r.text());
  mount.innerHTML = html;
  initSessionModal();
}

function initSessionModal() {
  const overlay = document.getElementById("session-edit-overlay");
  if (!overlay) return;

  document.getElementById("session-edit-cancel")?.addEventListener("click", closeSessionModal);
  document.getElementById("session-edit-save")?.addEventListener("click", onSessionModalPrimary);

  // Hatterre kattintva bezar; a kartyan belulre kattintva nem.
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSessionModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closeSessionModal();
  });
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

// --- Menu (kozos menu.html fragmentbol toltve minden oldalon) ---
async function loadMenu() {
  const mount = document.getElementById("menu-mount");
  if (!mount) return; // minden oldalon van, de vedjuk magunkat
  const html = await fetch("/menu.html").then(r => r.text());
  mount.innerHTML = html;
  initMenu();
}

function initMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const sideMenu = document.getElementById("side-menu");
  const menuOverlay = document.getElementById("menu-overlay");
  if (!menuToggle || !sideMenu || !menuOverlay) return;

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

  // A menupontok kulon oldalakra navigalnak, a Statisztika meg nincs implementalva (TODO)
  sideMenu.querySelectorAll(".menu-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.target === "log") {
        window.location.href = "/naplo.html";
        return;
      }
      if (btn.dataset.target === "timer") {
        window.location.href = "/idozito.html";
        return;
      }
      if (btn.dataset.target === "settings") {
        window.location.href = "/kodtar.html";
        return;
      }
      closeMenu();
    });
  });
}

// --- Bekotesek ---
document.getElementById("new-entry-btn")?.addEventListener("click", () => {
  window.location.href = "/uj-elem.html";
});
document.getElementById("log-back")?.addEventListener("click", () => {
  window.location.href = "/naplo.html";
});
document.getElementById("kodtar-elem-back")?.addEventListener("click", () => {
  window.location.href = "/kodtar.html";
});
document.getElementById("timer-back")?.addEventListener("click", () => {
  window.location.href = "/naplo.html";
});
// Kodtar elem: uj rekord hozzaadasa a kozeppontban felugro modallal.
// Egyelore csak a "Tantárgyak" kodtar van osszekotve (subjects tabla).
document.getElementById("kodtar-add-btn")?.addEventListener("click", () => {
  if (!currentKodtar || currentKodtar.name !== "Tantárgyak") {
    alert("Ehhez a kódtárhoz még nincs bekötve adatforrás.");
    return;
  }
  openSubjectModal();
});

// Kodtar elem: kivalasztott rekord modositasa ugyanabban a modalban (edit mod).
document.getElementById("kodtar-edit-btn")?.addEventListener("click", () => {
  if (!currentKodtar || currentKodtar.name !== "Tantárgyak") {
    alert("Ehhez a kódtárhoz még nincs bekötve adatforrás.");
    return;
  }
  const selected = document.querySelector('input[name="kodtar-rekord"]:checked');
  if (!selected) {
    alert("Előbb válassz ki egy rekordot a módosításhoz.");
    return;
  }
  // A kivalasztott sor nev-cellaja (2. cella: kivalaszto, nev, allapot).
  const name = selected.closest("tr")?.children[1]?.textContent ?? "";
  openSubjectModal({ mode: "edit", id: selected.value, name });
});

// Kodtar elem: kivalasztott rekord deaktivalasa (archived = true).
document.getElementById("kodtar-deactivate-btn")?.addEventListener("click", async () => {
  if (!currentKodtar || currentKodtar.name !== "Tantárgyak") {
    alert("Ehhez a kódtárhoz még nincs bekötve adatforrás.");
    return;
  }
  const selected = document.querySelector('input[name="kodtar-rekord"]:checked');
  if (!selected) {
    alert("Előbb válassz ki egy rekordot a deaktiváláshoz.");
    return;
  }
  const row = selected.closest("tr");
  const name = row?.children[1]?.textContent ?? "";
  const status = row?.children[2]?.textContent ?? "";
  if (status === "Inaktív") {
    alert("Ez a tantárgy már inaktív.");
    return;
  }
  const ok = await confirmModal({
    message: `Biztosan deaktiválod a(z) „${name}" tantárgyat?`,
    okLabel: "Deaktiválás",
  });
  if (!ok) return;

  // A nevet is elkuldjuk, mert a PUT feltetel nelkul felulirja azt.
  const res = await api.put(`/api/subjects/${selected.value}`, { name, archived: true });
  if (res && res.id) {
    await loadKodtarElem(); // tabla frissitese
  } else {
    alert("A deaktiválás nem sikerült.");
  }
});

// Kodtar elem: kivalasztott rekord aktivalasa (archived = false).
document.getElementById("kodtar-activate-btn")?.addEventListener("click", async () => {
  if (!currentKodtar || currentKodtar.name !== "Tantárgyak") {
    alert("Ehhez a kódtárhoz még nincs bekötve adatforrás.");
    return;
  }
  const selected = document.querySelector('input[name="kodtar-rekord"]:checked');
  if (!selected) {
    alert("Előbb válassz ki egy rekordot az aktiváláshoz.");
    return;
  }
  const row = selected.closest("tr");
  const name = row?.children[1]?.textContent ?? "";
  const status = row?.children[2]?.textContent ?? "";
  if (status === "Aktív") {
    alert("Ez a tantárgy már aktív.");
    return;
  }
  const ok = await confirmModal({
    message: `Biztosan aktiválod a(z) „${name}" tantárgyat?`,
    okLabel: "Aktiválás",
  });
  if (!ok) return;

  // A nevet is elkuldjuk, mert a PUT feltetel nelkul felulirja azt.
  const res = await api.put(`/api/subjects/${selected.value}`, { name, archived: false });
  if (res && res.id) {
    await loadKodtarElem(); // tabla frissitese
  } else {
    alert("Az aktiválás nem sikerült.");
  }
});

document.getElementById("log-save")?.addEventListener("click", saveSession);
document.getElementById("timer-start")?.addEventListener("click", startTimer);
document.getElementById("timer-pause")?.addEventListener("click", pauseTimer);
document.getElementById("timer-stop")?.addEventListener("click", stopTimer);
document.getElementById("timer-save")?.addEventListener("click", saveTimer);

// --- Veletlen idezet a kezdolapon (nagyban) ---
async function showRandomQuote() {
  const el = document.getElementById("quote-text");
  if (!el) return; // csak az index.html-en letezik

  try {
    const quote = await api.get("/api/quotes/random");
    if (quote && quote.text) el.textContent = quote.text;
  } catch (err) {
    console.error("Idezet betoltese sikertelen:", err);
  }
}

// --- Indulas ---
loadMenu();
loadSubjects();
loadSessions();
loadKodtarak();
loadKodtarElem();
loadSubjectModal();
loadConfirmModal();
loadSessionModal();
loadStats();
showRandomQuote();
