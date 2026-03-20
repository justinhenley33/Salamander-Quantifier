import { state } from "./state.js";
import { clamp, setStatus } from "./utils.js";
import { canvasToImage, draw, isInsideImage } from "./canvas.js";

function updatePointButtons() {
  state.undoBtn.disabled = state.points.length === 0;
  state.clearBtn.disabled = state.points.length === 0;
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
  setStatus("Polygon closed. You can export JSON or a mask PNG.");
  draw();
}

export function undoPoint() {
  if (state.points.length === 0) return;

  if (state.polygonClosed) {
    state.polygonClosed = false;
  }

  state.points.pop();
  setStatus("Undid last point.");
  updatePointButtons();
  draw();
}

export function clearPolygon() {
  state.points = [];
  state.polygonClosed = false;
  setStatus("Cleared polygon.");
  updatePointButtons();
  draw();
}

export function resetPolygon() {
  state.points = [];
  state.polygonClosed = false;
  updatePointButtons();
}