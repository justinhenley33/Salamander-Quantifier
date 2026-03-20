import { state } from "./state.js";

export function resizeCanvasToWrapper() {
  const wrap = state.canvas.parentElement;
  const rect = wrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  state.canvas.width = Math.floor(rect.width * dpr);
  state.canvas.height = Math.floor(rect.height * dpr);
  state.canvas.style.width = `${rect.width}px`;
  state.canvas.style.height = `${rect.height}px`;

  state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function computeImageTransform() {
  if (!state.img) return;

  const wrap = state.canvas.parentElement.getBoundingClientRect();
  const cw = wrap.width;
  const ch = wrap.height;

  const sx = cw / state.img.width;
  const sy = ch / state.img.height;
  state.imgScale = Math.min(sx, sy);

  const drawW = state.img.width * state.imgScale;
  const drawH = state.img.height * state.imgScale;

  state.imgOffsetX = (cw - drawW) / 2;
  state.imgOffsetY = (ch - drawH) / 2;
}

export function imageToCanvas(ix, iy) {
  return {
    x: state.imgOffsetX + ix * state.imgScale,
    y: state.imgOffsetY + iy * state.imgScale
  };
}

export function canvasToImage(cx, cy) {
  return {
    x: (cx - state.imgOffsetX) / state.imgScale,
    y: (cy - state.imgOffsetY) / state.imgScale
  };
}

export function isInsideImage(cx, cy) {
  if (!state.img) return false;

  const ix = (cx - state.imgOffsetX) / state.imgScale;
  const iy = (cy - state.imgOffsetY) / state.imgScale;

  return ix >= 0 && iy >= 0 && ix <= state.img.width && iy <= state.img.height;
}

export function draw() {
  const wrap = state.canvas.parentElement.getBoundingClientRect();
  const cw = wrap.width;
  const ch = wrap.height;

  state.ctx.clearRect(0, 0, cw, ch);

  state.ctx.fillStyle = "rgba(0,0,0,0)";
  state.ctx.fillRect(0, 0, cw, ch);

  if (!state.img) return;

  computeImageTransform();

  state.ctx.drawImage(
    state.img,
    state.imgOffsetX,
    state.imgOffsetY,
    state.img.width * state.imgScale,
    state.img.height * state.imgScale
  );

  if (!state.showOverlay.checked) return;

  if (state.points.length > 0) {
    state.ctx.save();
    state.ctx.lineWidth = 2;
    state.ctx.strokeStyle = "rgba(89,210,255,0.95)";
    state.ctx.fillStyle = "rgba(89,210,255,0.18)";

    state.ctx.beginPath();
    const first = imageToCanvas(state.points[0].x, state.points[0].y);
    state.ctx.moveTo(first.x, first.y);

    for (let i = 1; i < state.points.length; i++) {
      const p = imageToCanvas(state.points[i].x, state.points[i].y);
      state.ctx.lineTo(p.x, p.y);
    }

    if (state.polygonClosed && state.points.length >= 3) {
      state.ctx.closePath();
      state.ctx.fill();
    }

    state.ctx.stroke();

    for (const pt of state.points) {
      const p = imageToCanvas(pt.x, pt.y);

      state.ctx.beginPath();
      state.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      state.ctx.fillStyle = "rgba(255,255,255,0.9)";
      state.ctx.fill();
      state.ctx.strokeStyle = "rgba(0,0,0,0.35)";
      state.ctx.stroke();
    }

    state.ctx.restore();
  }
}