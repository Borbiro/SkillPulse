"use strict";

import { api } from "./api.js";

// --- Veletlen idezet a kezdolapon (nagyban) ---
export async function showRandomQuote() {
  const el = document.getElementById("quote-text");
  if (!el) return; // csak az index.html-en letezik

  try {
    const quote = await api.get("/api/quotes/random");
    if (quote && quote.text) el.textContent = quote.text;
  } catch (err) {
    console.error("Idezet betoltese sikertelen:", err);
  }
}
