import { state } from "./state.js";
import { downloadTextFile, setStatus } from "./utils.js";

function getSafeImageFilename() {
  return (
    state.imageFilename ||
    state.fileInput?.files?.[0]?.name ||
    "uploaded_image"
  );
}

function getBaseImageName() {
  return getSafeImageFilename().replace(/\.[^.]+$/, "");
}

function csvEscape(value) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatPercent(p) {
  return (p * 100).toFixed(4);
}

function clampChannelToBin(value, binSize) {
  return Math.floor(value / binSize) * binSize;
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;

  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function buildBinnedCountsFromHexCounts(hexCounts, binSize) {
  const binnedMap = new Map();

  for (const row of hexCounts) {
    const rgb = hexToRgb(row.hexValue);
    if (!rgb) continue;

    const br = clampChannelToBin(rgb.r, binSize);
    const bg = clampChannelToBin(rgb.g, binSize);
    const bb = clampChannelToBin(rgb.b, binSize);

    const binnedHex = rgbToHex(br, bg, bb);

    const current = binnedMap.get(binnedHex) || 0;
    binnedMap.set(binnedHex, current + row.pixelCount);
  }

  return Array.from(binnedMap.entries())
    .map(([hexValue, pixelCount]) => ({
      hexValue,
      pixelCount
    }))
    .sort((a, b) => b.pixelCount - a.pixelCount);
}

export function exportColorCsv() {
  if (!state.colorAnalysisComplete || state.colorHexCounts.length === 0) {
    setStatus("Run color analysis before exporting.");
    return;
  }

  const baseName = getBaseImageName();

  // Detailed CSV
  const detailedLines = [];
  detailedLines.push("hex_value,pixel_count");

  for (const row of state.colorHexCounts) {
    detailedLines.push(
      [row.hexValue, row.pixelCount].map(csvEscape).join(",")
    );
  }

  const detailedCsv = detailedLines.join("\n");

  // Overview CSV
  const overviewLines = [];
  overviewLines.push("general_color,range_label,pixel_count,percent_of_area");

  for (const row of state.colorOverviewRows) {
    overviewLines.push(
      [
        row.generalColor,
        row.hexRange,
        row.pixelCount,
        formatPercent(row.percentage)
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const overviewCsv = overviewLines.join("\n");

  downloadTextFile(
    `${baseName}_color_detailed.csv`,
    detailedCsv,
    "text/csv"
  );

  downloadTextFile(
    `${baseName}_color_overview.csv`,
    overviewCsv,
    "text/csv"
  );

  setStatus("Exported detailed and overview color CSV files.");
}

export function exportColorBinnedCsv() {
  if (!state.colorAnalysisComplete || state.colorHexCounts.length === 0) {
    setStatus("Run color analysis before exporting binned CSV.");
    return;
  }

  const baseName = getBaseImageName();

  const selectedBinSize = state.binSizeSelect
    ? Number(state.binSizeSelect.value)
    : 32;

  const validBinSizes = [8, 16, 32, 64];
  const binSize = validBinSizes.includes(selectedBinSize)
    ? selectedBinSize
    : 32;

  const binnedCounts = buildBinnedCountsFromHexCounts(
    state.colorHexCounts,
    binSize
  );

  const lines = [];
  lines.push("binned_hex_value,pixel_count");

  for (const row of binnedCounts) {
    lines.push(
      [row.hexValue, row.pixelCount].map(csvEscape).join(",")
    );
  }

  const csv = lines.join("\n");

  downloadTextFile(
    `${baseName}_color_binned_${binSize}.csv`,
    csv,
    "text/csv"
  );

  setStatus(`Exported binned color CSV (size ${binSize}).`);
}