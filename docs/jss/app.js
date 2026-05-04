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

export function initApp() {
  state.canvas = document.getElementById("canvas");
  state.ctx = state.canvas.getContext("2d");

  state.fileInput = document.getElementById("fileInput");
  state.fileName = document.getElementById("fileName");
  state.statusEl = document.getElementById("status");
  state.binSizeSelect = document.getElementById("binSizeSelect");

  state.undoBtn = document.getElementById("undoBtn");
  state.clearBtn = document.getElementById("clearBtn");
  state.colorAnalysisBtn = document.getElementById("colorAnalysisBtn");
  state.exportColorCsvBtn = document.getElementById("exportColorCsvBtn");
  state.showOverlay = document.getElementById("showOverlay");

  const exportMenuToggle = document.getElementById("exportMenuToggle");
  const exportPopover = document.getElementById("exportPopover");

  const helpBtn = document.getElementById("helpBtn");
  const helpModal = document.getElementById("helpModal");
  const closeHelpBtn = document.getElementById("closeHelpBtn");

  state.fileInput.addEventListener("change", handleFileChange);
  state.canvas.addEventListener("click", addPointFromEvent);
  state.canvas.addEventListener("dblclick", closePolygon);
  state.undoBtn.addEventListener("click", undoPoint);
  state.clearBtn.addEventListener("click", clearPolygon);
  state.showOverlay.addEventListener("change", draw);

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
    draw();
  });


  if (helpBtn && helpModal) {
    helpBtn.addEventListener("click", (e) => {
      e.preventDefault();
      helpModal.classList.remove("hidden");
    });
  }

  if (closeHelpBtn && helpModal) {
    closeHelpBtn.addEventListener("click", () => {
      helpModal.classList.add("hidden");
    });
  }

  if (helpModal) {
    helpModal.addEventListener("click", (e) => {
      if (e.target === helpModal) {
        helpModal.classList.add("hidden");
      }
    });
  }

  initBottomDrawer();
  resetOverviewPreview();

  resizeCanvasToWrapper();
  setStatus("Upload an image to begin.");
  enableTools(false);
}