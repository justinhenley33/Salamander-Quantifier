import { state } from "./state.js";

// ===============================
// MAIN ENTRY
// ===============================
export function runPatternAnalysis({ imageCanvas, overlayCanvas }) {
  if (!state.polygonClosed || state.points.length < 3) {
    alert("Close a polygon first.");
    return;
  }

  if (!window.cvReady) {
    alert("OpenCV not ready yet.");
    return;
  }

  const polygonMask = buildPolygonMask(imageCanvas);

  const spots = detectSpotsContours(imageCanvas, polygonMask);

  drawOverlay(overlayCanvas, spots);

  console.log("OpenCV spots:", spots.length);

  return { spots };
}

// ===============================
// BUILD POLYGON MASK
// ===============================
function buildPolygonMask(canvas) {
  const width = canvas.width;
  const height = canvas.height;

  const temp = document.createElement("canvas");
  temp.width = width;
  temp.height = height;

  const ctx = temp.getContext("2d");

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  ctx.beginPath();
  const pts = state.points;

  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();

  ctx.fillStyle = "white";
  ctx.fill();

  const maskData = ctx.getImageData(0, 0, width, height).data;

  return maskData;
}

// ===============================
// DETECT SPOTS VIA CONTOURS
// ===============================
function detectSpotsContours(imageCanvas, polygonMask) {
  const ctx = imageCanvas.getContext("2d", { willReadFrequently: true });

  const width = imageCanvas.width;
  const height = imageCanvas.height;

  const imageData = ctx.getImageData(0, 0, width, height);

  let src = cv.matFromImageData(imageData);

  // ===============================
  // APPLY POLYGON MASK
  // ===============================
  for (let i = 0; i < polygonMask.length; i += 4) {
    if (polygonMask[i] === 0) {
      src.data[i] = 0;
      src.data[i + 1] = 0;
      src.data[i + 2] = 0;
    }
  }

  // ===============================
  // GRAYSCALE
  // ===============================
  let gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // ===============================
  // BLUR (reduce noise)
  // ===============================
  let blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

  // ===============================
  // THRESHOLD (CRITICAL)
  // ===============================
  let thresh = new cv.Mat();

  // 🔥 TUNE THIS VALUE IF NEEDED
  cv.threshold(blurred, thresh, 150, 255, cv.THRESH_BINARY);

  // ===============================
  // DEBUG VIEW (optional)
  // ===============================
  const debugCanvas = document.getElementById("debugCanvas");
  if (debugCanvas) {
    debugCanvas.width = width;
    debugCanvas.height = height;
    cv.imshow("debugCanvas", thresh);
  }

  // ===============================
  // FIND CONTOURS
  // ===============================
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.findContours(
    thresh,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );

  const spots = [];

  for (let i = 0; i < contours.size(); i++) {
    let cnt = contours.get(i);

    let area = cv.contourArea(cnt);

    // 🔥 FILTER NOISE
    if (area < 20) continue;

    let perimeter = cv.arcLength(cnt, true);

    let moments = cv.moments(cnt);
    if (moments.m00 === 0) continue;

    let cx = moments.m10 / moments.m00;
    let cy = moments.m01 / moments.m00;

    spots.push({
      id: i,
      x: cx,
      y: cy,
      area: area,
      perimeter: perimeter
    });
  }

  // ===============================
  // CLEANUP
  // ===============================
  src.delete();
  gray.delete();
  blurred.delete();
  thresh.delete();
  contours.delete();
  hierarchy.delete();

  return spots;
}

// ===============================
// DRAW OVERLAY
// ===============================
function drawOverlay(canvas, spots) {
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "red";

  spots.forEach((s) => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ===============================
// EXPORT CSV
// ===============================
export function exportPatternCSV(spots) {
  let csv = "spot_id,x,y,area,perimeter\n";

  spots.forEach((s) => {
    csv += `${s.id},${s.x.toFixed(2)},${s.y.toFixed(2)},${s.area.toFixed(2)},${s.perimeter.toFixed(2)}\n`;
  });

  return csv;
}