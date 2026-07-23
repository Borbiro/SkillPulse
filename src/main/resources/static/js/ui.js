"use strict";

// --- Kozos UI-segedek (minden oldal / modal ezekre epul) ---

/**
 * Uzenet megjelenitese egy urlap/modal uzeno-elemeben.
 * A megadott elem (vagy id) kap "success" / "error" osztalyt.
 */
export function showFormMessage(el, text, type) {
  const target = typeof el === "string" ? document.getElementById(el) : el;
  if (!target) return;
  target.textContent = text;
  target.classList.remove("error", "success");
  target.classList.add(type);
  target.hidden = false;
}

/**
 * Egy HTML-fragment betoltese egy mount pontba, majd az init lefuttatasa.
 * Visszaadja, hogy volt-e mount pont (igy a hivo tudja, az oldalon kell-e a fragment).
 */
export async function mountFragment(mountId, url, init) {
  const mount = document.getElementById(mountId);
  if (!mount) return false; // ezen az oldalon nincs ilyen mount pont
  mount.innerHTML = await fetch(url).then(r => r.text());
  init?.();
  return true;
}

/**
 * A modaloknal ismetlodo bezaro-viselkedes: hatterre kattintva bezar
 * (a kartyan belulre kattintva nem), es Escape-re is bezar.
 */
export function bindOverlayDismiss(overlay, onClose) {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) onClose();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) onClose();
  });
}

/** Ikonos muvelet-gomb (kozeppontba igazitott SVG) a tablazatokhoz. */
export function iconButton(svgMarkup, label, onClick) {
  const btn = document.createElement("button");
  btn.innerHTML = svgMarkup;
  btn.className = "icon-btn";
  btn.title = label;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", onClick);
  return btn;
}

/**
 * Egy kesz alkalom (session) elkuldese a szervernek (POST /api/sessions).
 * Csak a halozati hivast + a sikeruzenetet vegzi; a mentes utani frissitest
 * (lista/oridozito) a hivo intezi. Sikeres mentes eseten true-t ad vissza.
 */
export async function postSession(body, messageEl) {
  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showFormMessage(messageEl, "Mentés sikeres!", "success");
    return true;
  } catch (err) {
    console.error("Mentes sikertelen:", err);
    showFormMessage(messageEl, "A mentés nem sikerült!", "error");
    return false;
  }
}
