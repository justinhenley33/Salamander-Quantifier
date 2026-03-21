import { state } from "./state.js";
import { downloadDataUrl, downloadTextFile, setStatus } from "./utils.js";

export function exportJson() {
  if (!state.img) return;

  const payload = {
    image: {
      width: state.img.width,
      height: state.img.height
    },
    polygonClosed: state.polygonClosed,
    points: state.points.map((p) => ({
      x: p.x / state.img.width,
      y: p.y / state.img.height
    }))
  };

  downloadTextFile("segmentation.json", JSON.stringify(payload, null, 2));
}

export function exportMask() {
  if (!state.img) return;

  if (!state.polygonClosed || state.points.length < 3) {
    setStatus("Close the polygon first (double-click).");
    return;
  }

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

  const dataUrl = off.toDataURL("image/png");
  downloadDataUrl("mask.png", dataUrl);

  setStatus("Exported mask.png (white region = selection).");
}

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
  if (!state.colorAnalysisComplete || state.colorBinnedCounts.length === 0) {
    setStatus("Run color analysis before exporting binned CSV.");
    return;
  }

  const imageName =
    state.imageFilename ||
    state.fileInput?.files?.[0]?.name ||
    "uploaded_image";

  const baseName = imageName.replace(/\.[^.]+$/, "");

  const lines = [];
  lines.push("binned_hex_value,pixel_count");

  for (const row of state.colorBinnedCounts) {
    lines.push(`${row.hexValue},${row.pixelCount}`);
  }

  const csv = lines.join("\n");

  downloadTextFile(
    `${baseName}_color_binned_32.csv`,
    csv,
    "text/csv"
  );

  setStatus("Exported binned color CSV (size 32).");
}