// =============================
// MAIN ENTRY POINT
// =============================
export function runPatternAnalysis({
  imageCanvas,
  overlayCanvas,
  selectedRegion
}) {
  if (!window.cvReady) {
    console.warn("OpenCV not ready yet");
    return { spots: [], eps: 0 };
  }
  const ctx = imageCanvas.getContext("2d");
  const width = imageCanvas.width;
  const height = imageCanvas.height;

  const imageData = ctx.getImageData(0, 0, width, height);

  // STEP 0: polygon mask
  const polygonMask = createPolygonMask(width, height, selectedRegion);

  // STEP 1: preprocess
  const gray = toGrayscaleMasked(imageData, polygonMask);
  const blurred = gaussianBlur(gray, width, height);
  const stretched = contrastStretch(blurred);

  // STEP 2: segmentation
  const mask = spotThreshold(stretched, polygonMask);

  // STEP 3: clean mask
  let cleaned = openMask(mask, width, height);

  for (let i = 0; i < cleaned.length; i++) {
    if (polygonMask && polygonMask[i * 4] === 0) {
      cleaned[i] = 0;
    }
  }

  // STEP 4: connected components
  const spots = detectBlobsOpenCV(imageCanvas, polygonMask);

  // STEP 5: DBSCAN
  const eps = estimateDbscanEpsilon(spots);
  const clustered = dbscan(spots, eps, 3);

  // STEP 6: visualization
  drawOverlay(overlayCanvas, clustered, width, height, selectedRegion);
  console.log("spots found:", spots.length);

  return {
    spots: clustered,
    eps
  };
}

// =============================
// POLYGON MASK
// =============================
function createPolygonMask(width, height, points) {
  if (!points || points.length < 3) return null;

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;

  const ctx = maskCanvas.getContext("2d");

  ctx.clearRect(0, 0, width, height);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.closePath();
  ctx.fillStyle = "white";
  ctx.fill();

  return ctx.getImageData(0, 0, width, height).data;
}

// =============================
// STEP 1: PREPROCESS
// =============================
function toGrayscaleMasked(imageData, polygonMask) {
  const data = imageData.data;
  const gray = new Uint8ClampedArray(imageData.width * imageData.height);

  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;

    if (polygonMask && polygonMask[i] === 0) {
      gray[idx] = 0;
      continue;
    }

    gray[idx] =
      0.299 * data[i] +
      0.587 * data[i + 1] +
      0.114 * data[i + 2];
  }

  return gray;
}

function gaussianBlur(gray, width, height) {
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const out = new Uint8ClampedArray(gray.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      let k = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += gray[(y + dy) * width + (x + dx)] * kernel[k++];
        }
      }

      out[y * width + x] = sum / 16;
    }
  }

  return out;
}

function contrastStretch(gray) {
  let min = 255,
    max = 0;

  for (let v of gray) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const out = new Uint8ClampedArray(gray.length);

  for (let i = 0; i < gray.length; i++) {
    out[i] = ((gray[i] - min) / (max - min)) * 255;
  }

  return out;
}

// =============================
// STEP 2: THRESHOLD
// =============================
function spotThreshold(gray, polygonMask) {
  const mask = new Uint8ClampedArray(gray.length);

  let sum = 0;
  let count = 0;

  // compute mean inside polygon
  for (let i = 0; i < gray.length; i++) {
    if (polygonMask && polygonMask[i * 4] === 0) continue;
    sum += gray[i];
    count++;
  }

  const mean = sum / count;

  // 🔴 lower threshold (key change)
  const threshold = mean + 10;  // was too high before

  for (let i = 0; i < gray.length; i++) {
    if (polygonMask && polygonMask[i * 4] === 0) {
      mask[i] = 0;
      continue;
    }

    mask[i] = gray[i] > threshold ? 1 : 0;
  }

  return mask;
}

// =============================
// STEP 3: MORPHOLOGY
// =============================
function erode(mask, width, height) {
  const out = new Uint8ClampedArray(mask.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let keep = 1;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (mask[(y + dy) * width + (x + dx)] === 0) {
            keep = 0;
          }
        }
      }

      out[y * width + x] = keep;
    }
  }

  return out;
}

function dilate(mask, width, height) {
  const out = new Uint8ClampedArray(mask.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let val = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (mask[(y + dy) * width + (x + dx)] === 1) {
            val = 1;
          }
        }
      }

      out[y * width + x] = val;
    }
  }

  return out;
}

function openMask(mask, w, h) {
  return dilate(erode(mask, w, h), w, h);
}

function closeMask(mask, w, h) {
  return erode(dilate(mask, w, h), w, h);
}

// =============================
// STEP 4: CONNECTED COMPONENTS
// =============================
function findConnectedComponents(mask, width, height) {
  const visited = new Uint8Array(mask.length);
  const spots = [];
  let id = 0;

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 1 && !visited[i]) {
      const queue = [i];
      let pixels = [];

      visited[i] = 1;

      while (queue.length) {
        const curr = queue.pop();
        pixels.push(curr);

        const x = curr % width;
        const y = Math.floor(curr / width);

        for (let [dx, dy] of dirs) {
          const nx = x + dx;
          const ny = y + dy;

          const ni = ny * width + nx;

          if (
            nx >= 0 &&
            nx < width &&
            ny >= 0 &&
            ny < height &&
            mask[ni] === 1 &&
            !visited[ni]
          ) {
            visited[ni] = 1;
            queue.push(ni);
          }
        }
      }

      if (pixels.length < 10) continue;

      let sumX = 0,
        sumY = 0;

      for (let p of pixels) {
        sumX += p % width;
        sumY += Math.floor(p / width);
      }

      const cx = sumX / pixels.length;
      const cy = sumY / pixels.length;

      spots.push({
        id: id++,
        pixels,
        area: pixels.length,
        x: cx,
        y: cy
      });
    }
  }

  return spots;
}

function detectBlobsOpenCV(imageCanvas, polygonMask) {
  const ctx = imageCanvas.getContext("2d", { willReadFrequently: true });
  const width = imageCanvas.width;
  const height = imageCanvas.height;

  const imageData = ctx.getImageData(0, 0, width, height);

  let src = cv.matFromImageData(imageData);

  // --- mask out everything outside polygon ---
  if (polygonMask) {
    for (let i = 0; i < polygonMask.length; i += 4) {
      if (polygonMask[i] === 0) {
        src.data[i] = 0;
        src.data[i + 1] = 0;
        src.data[i + 2] = 0;
      }
    }
  }

  // grayscale
  let gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // blur for stability
  let blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

  // --- threshold (THIS is key) ---
  let thresh = new cv.Mat();

  cv.threshold(blurred, thresh, 180, 255, cv.THRESH_BINARY);

  // debug display
  const debugCanvas = document.getElementById("debugCanvas");
  debugCanvas.width = width;
  debugCanvas.height = height;

  cv.imshow("debugCanvas", thresh);

  // --- blob detector params ---
  let params = new cv.SimpleBlobDetector_Params();

  params.filterByColor = false;

  params.filterByArea = true;
  params.minArea = 20;  
  params.maxArea = 10000;

  params.filterByCircularity = false;
  params.filterByConvexity = false;
  params.filterByInertia = false;

  let detector = new cv.SimpleBlobDetector(params);

  let keypoints = new cv.KeyPointVector();
  detector.detect(thresh, keypoints);

  const spots = [];

  for (let i = 0; i < keypoints.size(); i++) {
    const kp = keypoints.get(i);

    spots.push({
      id: i,
      x: kp.pt.x,
      y: kp.pt.y,
      area: Math.PI * Math.pow(kp.size / 2, 2)
    });
  }

  console.log("OpenCV spots:", spots.length);

  // cleanup
  src.delete();
  gray.delete();
  blurred.delete();
  thresh.delete();
  keypoints.delete();

  return spots;
}

// =============================
// STEP 5: DBSCAN
// =============================
function estimateDbscanEpsilon(spots) {
  const distances = [];

  for (let s of spots) {
    let nearest = Infinity;

    for (let t of spots) {
      if (s === t) continue;

      const d = Math.hypot(s.x - t.x, s.y - t.y);
      if (d < nearest) nearest = d;
    }

    if (nearest < Infinity) distances.push(nearest);
  }

  distances.sort((a, b) => a - b);
  return distances[Math.floor(distances.length / 2)] * 2.5;
}

function dbscan(points, eps, minPts) {
  let clusterId = 0;

  for (let p of points) {
    if (p.visited) continue;

    p.visited = true;
    const neighbors = regionQuery(points, p, eps);

    if (neighbors.length < minPts) {
      p.cluster = -1;
    } else {
      expandCluster(points, p, neighbors, clusterId++, eps, minPts);
    }
  }

  return points;
}

function expandCluster(points, p, neighbors, clusterId, eps, minPts) {
  p.cluster = clusterId;

  for (let i = 0; i < neighbors.length; i++) {
    let n = neighbors[i];

    if (!n.visited) {
      n.visited = true;
      let nNeighbors = regionQuery(points, n, eps);

      if (nNeighbors.length >= minPts) {
        neighbors.push(...nNeighbors);
      }
    }

    if (n.cluster === undefined) {
      n.cluster = clusterId;
    }
  }
}

function regionQuery(points, p, eps) {
  return points.filter(
    q => Math.hypot(p.x - q.x, p.y - q.y) <= eps
  );
}

// =============================
// STEP 6: VISUALIZATION
// =============================
function drawOverlay(canvas, spots, width, height, polygon) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  // polygon outline
  if (polygon && polygon.length > 2) {
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);

    for (let i = 1; i < polygon.length; i++) {
      ctx.lineTo(polygon[i].x, polygon[i].y);
    }

    ctx.closePath();
    ctx.stroke();
  }

  const colors = ["red", "blue", "green", "yellow", "purple"];

  for (let s of spots) {
    const color =
      s.cluster === -1
        ? "white"
        : colors[s.cluster % colors.length];

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// =============================
// STEP 7: CSV EXPORT
// =============================
export function exportPatternCSV(spots) {
  let rows = ["spot_id,x,y,area,cluster_id"];

  for (let s of spots) {
    rows.push(
      `${s.id},${s.x.toFixed(2)},${s.y.toFixed(2)},${s.area},${s.cluster}`
    );
  }

  return rows.join("\n");
}
