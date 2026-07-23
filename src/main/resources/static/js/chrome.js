"use strict";

import { initMenu } from "./menu.js";
import { loadStats } from "./stats.js";

// A minden oldalon kozos "keret": oldalsavos menu + header statisztika.
export function initChrome() {
  initMenu();
  loadStats();
}
