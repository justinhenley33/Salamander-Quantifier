import { state } from "./state.js";
import { draw } from "./canvas.js";
import { enableTools, setStatus } from "./utils.js";

const NAMED_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#FF0000" },
  { name: "Lime", hex: "#00FF00" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Cyan", hex: "#00FFFF" },
  { name: "Magenta", hex: "#FF00FF" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Gray", hex: "#808080" },
  { name: "Maroon", hex: "#800000" },
  { name: "Olive", hex: "#808000" },
  { name: "Green", hex: "#008000" },
  { name: "Purple", hex: "#800080" },
  { name: "Teal", hex: "#008080" },
  { name: "Navy", hex: "#000080" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Salmon", hex: "#FA8072" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Khaki", hex: "#F0E68C" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Ivory", hex: "#FFFFF0" },
  { name: "Lavender", hex: "#E6E6FA" },
  { name: "Violet", hex: "#EE82EE" },
  { name: "Indigo", hex: "#4B0082" },
  { name: "Turquoise", hex: "#40E0D0" }
];

function componentToHex(v) {
  return v.toString(16).padStart(2, "0").toUpperCase();
}

function rgbToHex(r, g, b) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function colorDistanceSq(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function getClosestColorName(hex) {
  const rgb = hexToRgb(hex);

  let best = NAMED_COLORS[0];
  let bestDist = Infinity;

  for (const candidate of NAMED_COLORS) {
    const candRgb = hexToRgb(candidate.hex);
    const dist = colorDistanceSq(rgb, candRgb);

    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }

  return best.name;
}

function buildPolygonMaskCanvas() {
  const off = document.createElement("canvas");
  off.width = state.img.width;
  off.height = state.img.height;
  const octx = off.getContext("2d");

  octx.clearRect(0, 0, off.width, off.height);
  octx.fillStyle = "black";
  octx.fillRect(0, 0, off.width, off.height);

  octx.beginPath();
  octx.moveTo(state.points[0].x, state.points[0].y);

  for (let i = 1; i < state.points.length; i++) {
    octx.lineTo(state.points[i].x, state.points[i].y);
  }

  octx.closePath();
  octx.fillStyle = "white";
  octx.fill();

  return off;
}

function getTimestampIso() {
  return new Date().toISOString();
}

export function runColorAnalysis() {
  if (!state.img) return;

  if (!state.polygonClosed || state.points.length < 3) {
    setStatus("Close the polygon first, then run color analysis.");
    return;
  }

  state.colorAnalysisMode = true;
  state.colorAnalysisComplete = false;
  state.colorAnalysisResults = [];
  state.colorAnalysisSummary = null;
  draw();

  setStatus("Running color analysis...");

  const imageCanvas = document.createElement("canvas");
  imageCanvas.width = state.img.width;
  imageCanvas.height = state.img.height;
  const imageCtx = imageCanvas.getContext("2d");
  imageCtx.drawImage(state.img, 0, 0);

  const imageData = imageCtx.getImageData(0, 0, imageCanvas.width, imageCanvas.height).data;

  const maskCanvas = buildPolygonMaskCanvas();
  const maskCtx = maskCanvas.getContext("2d");
  const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;

  const counts = new Map();
  let totalPixelsInSelection = 0;

  for (let i = 0; i < imageData.length; i += 4) {
    const maskR = maskData[i];
    const alpha = imageData[i + 3];

    if (maskR === 255 && alpha > 0) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];

      const hex = rgbToHex(r, g, b);
      counts.set(hex, (counts.get(hex) || 0) + 1);
      totalPixelsInSelection += 1;
    }
  }

  const timestamp = getTimestampIso();
  const photoSize = `${state.img.width}x${state.img.height}`;

  const rows = Array.from(counts.entries())
    .map(([hex, pixelCount]) => ({
      filename: state.imageFilename || "unknown",
      colorCommonName: getClosestColorName(hex),
      hexValue: hex,
      pixelCountWithinRegion: pixelCount,
      totalPixelsInSelection,
      percentThisColorInArea:
        totalPixelsInSelection > 0 ? pixelCount / totalPixelsInSelection : 0,
      photoSize,
      timestamp
    }))
    .sort((a, b) => b.pixelCountWithinRegion - a.pixelCountWithinRegion)
    .slice(0, 10);

  state.colorAnalysisResults = rows;
  state.colorAnalysisSummary = {
    totalPixelsInSelection,
    uniqueHexCount: counts.size,
    analyzedAt: timestamp
  };
  state.colorAnalysisComplete = true;

  if (state.exportColorCsvBtn) {
    state.exportColorCsvBtn.disabled = rows.length === 0;
  }

  enableTools(true);
  draw();
  setStatus("Color analysis complete. Export Color CSV when ready.");
}