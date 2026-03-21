import { state } from "./state.js";

function formatPercent(p) {
  return (p * 100).toFixed(2);
}

export function initBottomDrawer() {
  state.bottomDrawer = document.getElementById("bottomDrawer");
  state.bottomDrawerToggle = document.getElementById("bottomDrawerToggle");
  state.bottomDrawerContent = document.getElementById("bottomDrawerContent");

  if (!state.bottomDrawer || !state.bottomDrawerToggle) return;

  state.bottomDrawerToggle.addEventListener("click", () => {
    state.bottomDrawer.classList.toggle("open");
  });
}

export function renderOverviewPreview() {
  const tbody = document.getElementById("overviewPreviewBody");
  const summary = document.getElementById("bottomDrawerSummary");

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
  const tbody = document.getElementById("overviewPreviewBody");
  const summary = document.getElementById("bottomDrawerSummary");

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