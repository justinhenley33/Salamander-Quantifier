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