"use strict";

import { initChrome } from "../chrome.js";
import { loadSubjects } from "../subjects.js";
import { initManualLog } from "../manual-log.js";

initChrome();
loadSubjects();
initManualLog();
