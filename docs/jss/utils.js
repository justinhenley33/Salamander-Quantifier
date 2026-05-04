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
    state.undoBtn.disabled = !enabled || state.points.length === 0;
  }

  if (state.clearBtn) {
    state.clearBtn.disabled = !enabled || state.points.length === 0;
  }

  // Important:
  // Color Analysis should only unlock in closePolygon(), not on upload.
  if (state.colorAnalysisBtn) {
    state.colorAnalysisBtn.disabled = true;
  }

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