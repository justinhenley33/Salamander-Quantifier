import { state } from "./state.js";
import { clamp, setStatus } from "./utils.js";
import { canvasToImage, draw, isInsideImage } from "./canvas.js";
import { resetOverviewPreview } from "./drawer.js";

function updatePointButtons() {
  state.undoBtn.disabled = state.points.length === 0;
  state.clearBtn.disabled = state.points.length === 0;
}

function resetColorAnalysisState() {
  state.colorAnalysisMode = false;
  state.colorAnalysisComplete = false;
  state.colorAnalysisResults = [];
  state.colorAnalysisSummary = null;

  if (state.exportColorCsvBtn) {
    state.exportColorCsvBtn.disabled = true;
  }
  resetOverviewPreview();
}

export function addPointFromEvent(evt) {
  if (!state.img) return;
  if (state.polygonClosed) return;

  const rect = state.canvas.getBoundingClientRect();
  const cx = evt.clientX - rect.left;
  const cy = evt.clientY - rect.top;

  if (!isInsideImage(cx, cy)) {
    setStatus("Point must be inside the image.");
    return;
  }

  const p = canvasToImage(cx, cy);

  state.points.push({
    x: clamp(p.x, 0, state.img.width),
    y: clamp(p.y, 0, state.img.height)
  });

  resetColorAnalysisState();
  updatePointButtons();
  draw();
}
export function closePolygon() {
  if (!state.img) return;

  if (state.points.length < 3) {
    setStatus("Need at least 3 points to close polygon.");
    return;
  }

  state.polygonClosed = true;

  if (state.colorAnalysisBtn) {
    state.colorAnalysisBtn.disabled = false;
  }

  setStatus("Polygon closed. You can now run color analysis.");
  draw();
}

export function undoPoint() {
  if (state.points.length === 0) return;

  if (state.polygonClosed) {
    state.polygonClosed = false;

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

  state.points.pop();
  setStatus("Undid last point.");
  updatePointButtons();
  draw();
}

export function clearPolygon() {
  state.points = [];
  state.polygonClosed = false;

  if (state.colorAnalysisBtn) {
    state.colorAnalysisBtn.disabled = true;
  }

  if (state.exportColorCsvBtn) {
    state.exportColorCsvBtn.disabled = true;
  }

  if (state.exportColorBinnedBtn) {
    state.exportColorBinnedBtn.disabled = true;
  }

  setStatus("Cleared polygon.");
  updatePointButtons();
  draw();
}

function resetColorAnalysisState() {
  state.colorAnalysisMode = false;
  state.colorAnalysisComplete = false;
  state.colorAnalysisResults = [];
  state.colorAnalysisSummary = null;

  if (!state.polygonClosed && state.colorAnalysisBtn) {
    state.colorAnalysisBtn.disabled = true;
  }

  if (state.exportColorCsvBtn) {
    state.exportColorCsvBtn.disabled = true;
  }

  if (state.exportColorBinnedBtn) {
    state.exportColorBinnedBtn.disabled = true;
  }

  resetOverviewPreview();
}