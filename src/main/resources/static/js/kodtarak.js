"use strict";

import { api } from "./api.js";

// --- Kodtar lista (kodtar.html) ---
export async function loadKodtarak() {
  const body = document.getElementById("kodtar-body");
  if (!body) return;
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
