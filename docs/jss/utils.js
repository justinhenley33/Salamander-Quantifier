import { state } from "./state.js";

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function setStatus(msg) {
  if (state.statusEl) {
    state.statusEl.textContent = msg;
  }
}

export function enableTools(enabled) {
  if (state.undoBtn) {
    state.undoBtn.disabled = !enabled;
  }

  if (state.clearBtn) {
    state.clearBtn.disabled = !enabled;
  }

  /*
    Keep color analysis disabled until the polygon is closed.
    This prevents users from running analysis before selecting a region.
    closePolygon() should enable it.
  */
  if (state.colorAnalysisBtn) {
    state.colorAnalysisBtn.disabled = true;
  }

  /*
    Export buttons should stay disabled until color analysis is complete.
    runColorAnalysis() should enable them after successful analysis.
  */
  if (state.exportColorCsvBtn) {
    state.exportColorCsvBtn.disabled = true;
  }

  if (state.exportColorBinnedBtn) {
    state.exportColorBinnedBtn.disabled = true;
  }
}

export function downloadDataUrl(filename, url, revoke = false) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  if (revoke) {
    URL.revokeObjectURL(url);
  }
}

export function downloadTextFile(filename, text, mimeType = "application/json") {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(filename, url, true);
}