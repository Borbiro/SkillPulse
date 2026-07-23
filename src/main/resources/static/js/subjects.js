"use strict";

import { api } from "./api.js";

// --- Tantargy-valaszto(k) feltoltese a katalogusbol ---
// Az idozito es a kezi rogzites oldalan van egy-egy <select>; mindkettot feltoltjuk.
export async function loadSubjects() {
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
