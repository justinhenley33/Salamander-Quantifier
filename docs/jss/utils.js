import { state } from "./state.js";

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function setStatus(msg) {
  state.statusEl.textContent = msg;
}

export function enableTools(enabled) {
  state.undoBtn.disabled = !enabled;
  state.clearBtn.disabled = !enabled;
  state.exportJsonBtn.disabled = !enabled;
  state.exportMaskBtn.disabled = !enabled;
  state.colorAnalysisBtn.disabled = !enabled;
  state.runPatternBtn.disabled = !enabled;
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