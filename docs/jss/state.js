export const state = {
  canvas: null,
  ctx: null,

  fileInput: null,
  fileName: null,
  statusEl: null,

  undoBtn: null,
  clearBtn: null,
  exportJsonBtn: null,
  exportMaskBtn: null,
  exportColorCsvBtn: null,
  colorAnalysisBtn: null,
  showOverlay: null,

  img: null,
  imgScale: 1,
  imgOffsetX: 0,
  imgOffsetY: 0,

  points: [],
  polygonClosed: false,

  colorAnalysisMode: false,
  colorAnalysisComplete: false,
  
  // detailed
  colorHexCounts: [],
  totalPixelsInSelection: 0,

  // overview
  colorBinnedCounts: [],
  colorOverviewRows: []
};