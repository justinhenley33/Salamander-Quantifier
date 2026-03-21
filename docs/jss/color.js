import { state } from "./state.js";
import { draw } from "./canvas.js";
import { setStatus } from "./utils.js";
import { renderOverviewPreview } from "./drawer.js";

function componentToHex(v) {
  return v.toString(16).padStart(2, "0").toUpperCase();
}

function rgbToHex(r, g, b) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function rgbToHsv(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * (((bn - rn) / delta) + 2);
    else h = 60 * (((rn - gn) / delta) + 4);
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
}

function classifyColorFamily(r, g, b) {
  const { h, s, v } = rgbToHsv(r, g, b);

  if (v >= 0.94 && s <= 0.08) {
    return { color: "White", range: "#F0F0F0–#FFFFFF" };
  }

  if (v <= 0.18) {
    return { color: "Black", range: "#000000–#2E2E2E" };
  }

  if (s <= 0.15) {
    return { color: "Gray", range: "#2F2F2F–#EFEFEF" };
  }

  if (h >= 15 && h < 45 && v < 0.65) {
    return { color: "Brown", range: "dark orange-brown family" };
  }

  if (h >= 345 || h < 15) {
    return { color: "Red", range: "red family" };
  }
  if (h >= 15 && h < 45) {
    return { color: "Orange", range: "orange family" };
  }
  if (h >= 45 && h < 70) {
    return { color: "Yellow", range: "yellow family" };
  }
  if (h >= 70 && h < 170) {
    return { color: "Green", range: "green family" };
  }
  if (h >= 170 && h < 200) {
    return { color: "Cyan", range: "cyan family" };
  }
  if (h >= 200 && h < 255) {
    return { color: "Blue", range: "blue family" };
  }
  if (h >= 255 && h < 320) {
    return { color: "Purple", range: "purple family" };
  }
  return { color: "Pink", range: "pink family" };
}

function buildPolygonMaskCanvas() {
  const off = document.createElement("canvas");
  off.width = state.img.width;
  off.height = state.img.height;
  const octx = off.getContext("2d");

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

function getSafeImageFilename() {
  return (
    state.imageFilename ||
    state.fileInput?.files?.[0]?.name ||
    "uploaded_image"
  );
}

function binColor(r, g, b, binSize = 32) {
  return {
    r: Math.floor(r / binSize) * binSize,
    g: Math.floor(g / binSize) * binSize,
    b: Math.floor(b / binSize) * binSize
  };
}

export function runColorAnalysis() {
  if (!state.img) return;

  if (!state.polygonClosed || state.points.length < 3) {
    setStatus("Close the polygon first, then run color analysis.");
    return;
  }

  state.colorAnalysisMode = true;
  state.colorAnalysisComplete = false;
  state.colorHexCounts = [];
  state.colorOverviewRows = [];
  state.totalPixelsInSelection = 0;

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

  const hexCounts = new Map();
  const overviewMap = new Map();
  const binnedCounts = new Map();
  let totalPixels = 0;

  for (let i = 0; i < imageData.length; i += 4) {
    const maskR = maskData[i];
    const alpha = imageData[i + 3];
    if (maskR !== 255 || alpha === 0) continue;

    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const hex = rgbToHex(r, g, b);

    const binned = binColor(r, g, b, 32);
    const binnedHex = rgbToHex(binned.r, binned.g, binned.b);

    binnedCounts.set(binnedHex, (binnedCounts.get(binnedHex) || 0) + 1);

    hexCounts.set(hex, (hexCounts.get(hex) || 0) + 1);
    totalPixels += 1;

    const family = classifyColorFamily(r, g, b);
    const key = `${family.color}||${family.range}`;
    overviewMap.set(key, (overviewMap.get(key) || 0) + 1);
  }

  const filename = getSafeImageFilename();

  state.imageFilename = filename;
  state.totalPixelsInSelection = totalPixels;
  state.colorBinnedCounts = Array.from(binnedCounts.entries())
  .map(([hexValue, pixelCount]) => ({
    hexValue,
    pixelCount
  }))
  .sort((a, b) => b.pixelCount - a.pixelCount);

  state.colorHexCounts = Array.from(hexCounts.entries())
    .map(([hexValue, pixelCount]) => ({
      filename,
      hexValue,
      pixelCount
    }))
    .sort((a, b) => b.pixelCount - a.pixelCount);

  state.colorOverviewRows = Array.from(overviewMap.entries())
    .map(([key, pixelCount]) => {
      const [generalColor, hexRange] = key.split("||");
      return {
        generalColor,
        hexRange,
        pixelCount,
        percentage: totalPixels > 0 ? pixelCount / totalPixels : 0
      };
    })
    .sort((a, b) => b.pixelCount - a.pixelCount);

  state.colorAnalysisComplete = true;

  if (state.exportColorCsvBtn) {
    state.exportColorCsvBtn.disabled = false;
  }

  if (state.exportColorBinnedBtn) {
    state.exportColorBinnedBtn.disabled = false;
  }

  draw();
  renderOverviewPreview();
  setStatus("Color analysis complete. Review the drawer preview or export when ready.");
}