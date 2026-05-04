export const state = {
  canvas: null,
  ctx: null,

  fileInput: null,
  fileName: null,
  statusEl: null,

  undoBtn: null,
  clearBtn: null,

  exportColorCsvBtn: null,
  exportColorBinnedBtn: null,

  colorAnalysisBtn: null,
  showOverlay: null,
  binSizeSelect: null,

  bottomDrawer: null,
  bottomDrawerToggle: null,
  bottomDrawerContent: null,

  img: null,
  imageFilename: null,

  imgScale: 1,
  imgOffsetX: 0,
  imgOffsetY: 0,

  points: [],
  polygonClosed: false,

  colorAnalysisMode: false,
  colorAnalysisComplete: false,

  colorAnalysisResults: [],
  colorAnalysisSummary: null,

  colorHexCounts: [],
  totalPixelsInSelection: 0,
  colorBinnedCounts: [],
  colorOverviewRows: []
};