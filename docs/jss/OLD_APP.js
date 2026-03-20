const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const statusEl = document.getElementById("status");

const undoBtn = document.getElementById("undoBtn");
const clearBtn = document.getElementById("clearBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportMaskBtn = document.getElementById("exportMaskBtn");
const showOverlay = document.getElementById("showOverlay");

let img = null;
let imgScale = 1;
let imgOffsetX = 0;
let imgOffsetY = 0;

// polygon points stored in IMAGE coordinates 
let points = [];
let polygonClosed = false;

function setStatus(msg) { statusEl.textContent = msg; }

function enableTools(enabled) {
  undoBtn.disabled = !enabled;
  clearBtn.disabled = !enabled;
  exportJsonBtn.disabled = !enabled;
  exportMaskBtn.disabled = !enabled;
}

// Fit image to canvas wrapper
function resizeCanvasToWrapper() {
  const wrap = canvas.parentElement;
  const rect = wrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
}

function computeImageTransform() {
  if (!img) return;

  // We draw in CSS pixels, so use client sizes
  const wrap = canvas.parentElement.getBoundingClientRect();
  const cw = wrap.width;
  const ch = wrap.height;

  const sx = cw / img.width;
  const sy = ch / img.height;
  imgScale = Math.min(sx, sy);

  const drawW = img.width * imgScale;
  const drawH = img.height * imgScale;
  imgOffsetX = (cw - drawW) / 2;
  imgOffsetY = (ch - drawH) / 2;
}

function draw() {
  const wrap = canvas.parentElement.getBoundingClientRect();
  const cw = wrap.width;
  const ch = wrap.height;

  ctx.clearRect(0, 0, cw, ch);

  // background
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, cw, ch);

  if (!img) return;

  computeImageTransform();

  // draw image
  ctx.drawImage(
    img,
    imgOffsetX,
    imgOffsetY,
    img.width * imgScale,
    img.height * imgScale
  );

  if (!showOverlay.checked) return;

  // draw polygon overlay
  if (points.length > 0) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(89,210,255,0.95)";
    ctx.fillStyle = "rgba(89,210,255,0.18)";

    ctx.beginPath();
    const first = imageToCanvas(points[0].x, points[0].y);
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < points.length; i++) {
      const p = imageToCanvas(points[i].x, points[i].y);
      ctx.lineTo(p.x, p.y);
    }

    if (polygonClosed && points.length >= 3) {
      ctx.closePath();
      ctx.fill();
    }
    ctx.stroke();

    // draw points
    for (const pt of points) {
      const p = imageToCanvas(pt.x, pt.y);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.stroke();
    }

    ctx.restore();
  }
}

function imageToCanvas(ix, iy) {
  return {
    x: imgOffsetX + ix * imgScale,
    y: imgOffsetY + iy * imgScale
  };
}

function canvasToImage(cx, cy) {
  // cx,cy are in CSS pixels relative to canvas element
  const ix = (cx - imgOffsetX) / imgScale;
  const iy = (cy - imgOffsetY) / imgScale;
  return { x: ix, y: iy };
}

function isInsideImage(cx, cy) {
  const ix = (cx - imgOffsetX) / imgScale;
  const iy = (cy - imgOffsetY) / imgScale;
  return img && ix >= 0 && iy >= 0 && ix <= img.width && iy <= img.height;
}

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  fileName.textContent = file.name;
  const url = URL.createObjectURL(file);

  const image = new Image();
  image.onload = () => {
    img = image;
    points = [];
    polygonClosed = false;

    resizeCanvasToWrapper();
    draw();

    enableTools(true);
    setStatus("Click to add polygon points. Double-click to close.");
    URL.revokeObjectURL(url);
  };
  image.src = url;
});

function addPointFromEvent(evt) {
  if (!img) return;
  if (polygonClosed) return;

  const rect = canvas.getBoundingClientRect();
  const cx = evt.clientX - rect.left;
  const cy = evt.clientY - rect.top;

  if (!isInsideImage(cx, cy)) {
    setStatus("Point must be inside the image.");
    return;
  }

  const p = canvasToImage(cx, cy);
  points.push({ x: clamp(p.x, 0, img.width), y: clamp(p.y, 0, img.height) });

  undoBtn.disabled = points.length === 0;
  clearBtn.disabled = points.length === 0;

  draw();
}

canvas.addEventListener("click", (evt) => {
  addPointFromEvent(evt);
});

canvas.addEventListener("dblclick", (evt) => {
  if (!img) return;
  if (points.length < 3) {
    setStatus("Need at least 3 points to close polygon.");
    return;
  }
  polygonClosed = true;
  setStatus("Polygon closed. You can export JSON or a mask PNG.");
  draw();
});

undoBtn.addEventListener("click", () => {
  if (points.length === 0) return;
  if (polygonClosed) polygonClosed = false;
  points.pop();
  setStatus("Undid last point.");
  draw();
});

clearBtn.addEventListener("click", () => {
  points = [];
  polygonClosed = false;
  setStatus("Cleared polygon.");
  draw();
});

showOverlay.addEventListener("change", draw);

exportJsonBtn.addEventListener("click", () => {
  if (!img) return;

  const payload = {
    image: {
      width: img.width,
      height: img.height
    },
    polygonClosed,
    // store points normalized so it works regardless of image size
    points: points.map(p => ({
      x: p.x / img.width,
      y: p.y / img.height
    }))
  };

  downloadTextFile("segmentation.json", JSON.stringify(payload, null, 2));
});

exportMaskBtn.addEventListener("click", () => {
  if (!img) return;
  if (!polygonClosed || points.length < 3) {
    setStatus("Close the polygon first (double-click).");
    return;
  }

  // Create a binary mask the same size as the original image
  const off = document.createElement("canvas");
  off.width = img.width;
  off.height = img.height;
  const octx = off.getContext("2d");

  // black background
  octx.fillStyle = "black";
  octx.fillRect(0, 0, off.width, off.height);

  // white filled polygon
  octx.beginPath();
  octx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    octx.lineTo(points[i].x, points[i].y);
  }
  octx.closePath();
  octx.fillStyle = "white";
  octx.fill();

  // download as PNG
  const dataUrl = off.toDataURL("image/png");
  downloadDataUrl("mask.png", dataUrl);
  setStatus("Exported mask.png (white region = selection).");
});

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(filename, url, true);
}

function downloadDataUrl(filename, url, revoke = false) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) URL.revokeObjectURL(url);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

window.addEventListener("resize", () => {
  resizeCanvasToWrapper();
  draw();
});

// initial
resizeCanvasToWrapper();
setStatus("Upload an image to begin.");
enableTools(false);