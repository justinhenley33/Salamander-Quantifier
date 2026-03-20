import { state } from "./state.js";
import { resizeCanvasToWrapper, draw } from "./canvas.js";
import { resetPolygon } from "./segmentation.js";
import { enableTools, setStatus } from "./utils.js";

export function handleFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  state.fileName.textContent = file.name;
  const url = URL.createObjectURL(file);

  const image = new Image();
  image.onload = () => {
    state.img = image;
    resetPolygon();

    resizeCanvasToWrapper();
    draw();

    enableTools(true);
    setStatus("Click to add polygon points. Double-click to close.");
    URL.revokeObjectURL(url);
  };

  image.src = url;
}