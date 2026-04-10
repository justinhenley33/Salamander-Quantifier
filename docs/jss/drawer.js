import { state } from "./state.js";

function formatPercent(p) {
  return (p * 100).toFixed(2);
}

function getDrawerElements() {
  return {
    drawer: document.getElementById("bottomDrawer"),
    content: document.getElementById("bottomDrawerContent"),
    handle: document.getElementById("bottomDrawerHandle"),
    tbody: document.getElementById("overviewPreviewBody"),
    summary: document.getElementById("bottomDrawerSummary")
  };
}

function setDrawerState(mode) {
  const { drawer } = getDrawerElements();
  if (!drawer) return;

  drawer.classList.remove("open", "mid");
  if (mode === "open") drawer.classList.add("open");
  if (mode === "mid") drawer.classList.add("mid");
}

function snapDrawerByOffset(offsetY, contentHeight) {
  // offsetY = current translateY in px
  // smaller offset => more open
  const closedY = contentHeight - 72;
  const midY = contentHeight - 180;
  const openY = 0;

  const distances = [
    { mode: "open", dist: Math.abs(offsetY - openY), y: openY },
    { mode: "mid", dist: Math.abs(offsetY - midY), y: midY },
    { mode: "closed", dist: Math.abs(offsetY - closedY), y: closedY }
  ];

  distances.sort((a, b) => a.dist - b.dist);
  return distances[0].mode;
}

export function initBottomDrawer() {
  const { drawer, content, handle } = getDrawerElements();
  if (!drawer || !content || !handle) return;

  let isDragging = false;
  let startY = 0;
  let startTranslateY = 0;
  let currentTranslateY = 0;

  function getCurrentTranslateY() {
    const style = window.getComputedStyle(content);
    const transform = style.transform;

    if (!transform || transform === "none") {
      if (drawer.classList.contains("open")) return 0;
      if (drawer.classList.contains("mid")) return content.offsetHeight - 180;
      return content.offsetHeight - 72;
    }

    const matrix = new DOMMatrix(transform);
    return matrix.m42;
  }

  function onPointerDown(e) {
    isDragging = true;
    drawer.classList.add("dragging");

    startY = e.clientY;
    startTranslateY = getCurrentTranslateY();
    currentTranslateY = startTranslateY;

    handle.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    const deltaY = e.clientY - startY;
    const contentHeight = content.offsetHeight;

    const closedY = contentHeight - 72;
    const nextY = Math.max(0, Math.min(closedY, startTranslateY + deltaY));

    currentTranslateY = nextY;
    content.style.transform = `translateY(${nextY}px)`;
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    drawer.classList.remove("dragging");

    const mode = snapDrawerByOffset(currentTranslateY, content.offsetHeight);

    content.style.transform = "";

    if (mode === "open") {
      setDrawerState("open");
    } else if (mode === "mid") {
      setDrawerState("mid");
    } else {
      setDrawerState("closed");
    }

    handle.releasePointerCapture?.(e.pointerId);
  }

  handle.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  handle.addEventListener("click", () => {
    if (drawer.classList.contains("open")) {
      setDrawerState("mid");
    } else {
      setDrawerState("open");
    }
  });
}
// comment
export function renderOverviewPreview() {
  const { tbody, summary } = getDrawerElements();
  if (!tbody || !summary) return;

  if (!state.colorAnalysisComplete || state.colorOverviewRows.length === 0) {
    summary.textContent = "Run color analysis to preview grouped color results.";
    tbody.innerHTML = `
      <tr>
        <td colspan="4">No analysis results yet.</td>
      </tr>
    `;
    return;
  }

  summary.textContent = `Showing ${state.colorOverviewRows.length} grouped color categories across ${state.totalPixelsInSelection} selected pixels.`;

  tbody.innerHTML = state.colorOverviewRows
    .map(
      (row) => `
        <tr>
          <td>${row.generalColor}</td>
          <td>${row.hexRange}</td>
          <td>${row.pixelCount}</td>
          <td>${formatPercent(row.percentage)}%</td>
        </tr>
      `
    )
    .join("");
}

export function resetOverviewPreview() {
  const { tbody, summary } = getDrawerElements();

  if (summary) {
    summary.textContent = "Run color analysis to preview grouped color results.";
  }

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">No analysis results yet.</td>
      </tr>
    `;
  }
}