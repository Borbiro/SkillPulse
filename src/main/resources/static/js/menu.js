"use strict";

import { mountFragment } from "./ui.js";

// --- Menu (kozos menu.html fragmentbol toltve minden oldalon) ---
export function initMenu() {
  return mountFragment("menu-mount", "/menu.html", wireMenu);
}

function wireMenu() {
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
  const targets = { log: "/naplo.html", timer: "/idozito.html", settings: "/kodtar.html" };
  sideMenu.querySelectorAll(".menu-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = targets[btn.dataset.target];
      if (url) window.location.href = url;
      else closeMenu();
    });
  });
}
