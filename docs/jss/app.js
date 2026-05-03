import { state } from "./state.js";
import { resizeCanvasToWrapper, draw } from "./canvas.js";
import { handleFileChange } from "./upload.js";
import {
  addPointFromEvent,
  closePolygon,
  undoPoint,
  clearPolygon
} from "./segmentation.js";
import { exportJson, exportMask, exportColorCsv, exportColorBinnedCsv } from "./export.js";
import { runColorAnalysis } from "./color.js";
import { setStatus, enableTools } from "./utils.js";
import { initBottomDrawer, resetOverviewPreview } from "./drawer.js";
import { runPatternAnalysis, exportPatternCSV } from "./pattern.js";

export function initApp() {
  state.canvas = document.getElementById("canvas");
  state.ctx = state.canvas.getContext("2d");

  state.fileInput = document.getElementById("fileInput");
  state.fileName = document.getElementById("fileName");
  state.statusEl = document.getElementById("status");

  state.undoBtn = document.getElementById("undoBtn");
  state.clearBtn = document.getElementById("clearBtn");
  state.exportJsonBtn = document.getElementById("exportJsonBtn");
  state.exportMaskBtn = document.getElementById("exportMaskBtn");
  state.colorAnalysisBtn = document.getElementById("colorAnalysisBtn");
  state.exportColorCsvBtn = document.getElementById("exportColorCsvBtn");
  state.showOverlay = document.getElementById("showOverlay");

  const exportMenuToggle = document.getElementById("exportMenuToggle");
  const exportPopover = document.getElementById("exportPopover");

  state.runPatternBtn = document.getElementById("runPatternBtn");
  state.exportPatternCsvBtn = document.getElementById("exportPatternCsvBtn");
  state.exportPatternOverlayBtn = document.getElementById("exportPatternOverlayBtn");

  state.fileInput.addEventListener("change", handleFileChange);
  state.canvas.addEventListener("click", addPointFromEvent);
  state.canvas.addEventListener("dblclick", closePolygon);
  state.undoBtn.addEventListener("click", undoPoint);
  state.clearBtn.addEventListener("click", clearPolygon);
  state.showOverlay.addEventListener("change", draw);
  state.overlayCanvas = document.createElement("canvas");

  state.exportJsonBtn.addEventListener("click", exportJson);
  state.exportMaskBtn.addEventListener("click", exportMask);
  state.exportColorCsvBtn.addEventListener("click", exportColorCsv);
  state.colorAnalysisBtn.addEventListener("click", runColorAnalysis);
  state.exportColorBinnedBtn = document.getElementById("exportColorBinnedBtn");

  state.exportColorBinnedBtn.addEventListener("click", exportColorBinnedCsv);
  state.exportColorBinnedBtn.disabled = true;

  state.exportColorCsvBtn.disabled = true;

  if (exportMenuToggle && exportPopover) {
    exportMenuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      exportPopover.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      const clickedToggle = exportMenuToggle.contains(e.target);
      const clickedPopover = exportPopover.contains(e.target);

      if (!clickedToggle && !clickedPopover) {
        exportPopover.classList.add("hidden");
      }
    });
  }

  window.addEventListener("resize", () => {
    resizeCanvasToWrapper();

    state.overlayCanvas.width = state.canvas.width;
    state.overlayCanvas.height = state.canvas.height;

    draw();
  });

  state.runPatternBtn.addEventListener("click", () => {
    if (!state.img || !state.polygonClosed) {
      setStatus("Draw and close a polygon first.");
      return;
    }

    const result = runPatternAnalysis({
      imageCanvas: state.canvas,
      overlayCanvas: state.overlayCanvas,
      selectedRegion: state.points
    });

    state.patternResults = result.spots;

    setStatus("Pattern analysis complete.");

    state.exportPatternCsvBtn.disabled = false;
    state.exportPatternOverlayBtn.disabled = false;
  });

  state.exportPatternCsvBtn.addEventListener("click", () => {
    if (!state.patternResults) return;

    const csv = exportPatternCSV(state.patternResults);

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "pattern_analysis.csv";
    a.click();

    URL.revokeObjectURL(url);
  });

  state.exportPatternOverlayBtn.addEventListener("click", () => {
    if (!state.overlayCanvas) return;

    const url = state.overlayCanvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = url;
    a.download = "pattern_overlay.png";
    a.click();
  });

  initBottomDrawer();
  resetOverviewPreview();

  resizeCanvasToWrapper();
  setStatus("Upload an image to begin.");
  enableTools(false);
}