# Salamander Quantifier

Salamander Quantifier is a browser-based image analysis tool for quantifying colors within user-selected regions of amphibian images. The site is intended for ecological researchers, students, and hobbyists who want a simple way to measure color composition from high-quality field or lab images.

This site is designed to make image-based color quantification more accessible by allowing users to upload an image, manually segment a region of interest, run color analysis on only that selected region, preview grouped results, and export data for further analysis.

The current version focuses on manual region segmentation and color analysis. Pattern analysis is not included in this release.

## Live Site

Use the tool here:

https://justinhenley33.github.io/Salamander-Quantifier/

No downloads or installations are required.

---

## Features

### 1. Manual Image Segmentation

Salamander Quantifier allows users to manually define a region of interest by drawing a polygon directly on the uploaded image. This allows analysis to be limited to a specific user-determined region instead of the entire image.

This is useful when:

- the background should be excluded
- only a specific body region should be analyzed
- multiple regions need to be analyzed separately
- lighting or non-animal objects are present elsewhere in the image
- the user wants precise control over which pixels are included in the analysis

Examples of possible selected regions include:

- a salamander's body
- a limb
- a patch of skin
- a spot or stripe region
- a region of interest around a color pattern

### 2. Color Analysis

After a region is selected, Salamander Quantifier analyzes the pixels inside the polygon and summarizes the colors found in that selected area.

The color analysis performs a pixel-by-pixel analysis of the selected region. Each pixel inside the polygon is read, converted into a hex color value, counted, and grouped into different summary formats.

The tool currently provides three color output views:

1. Color overview CSV
2. Binned color CSV
3. Detailed color CSV

---

## Color Analysis Export Options

### A. Color Overview CSV

The color overview export provides a high-level summary of the major color families found in the selected region.

Each pixel is classified into a general color family using HSV-based rules. The overview includes:

- general color family
- HSV range used for classification
- pixel count
- percent of selected area

This is useful if you want to quickly understand which broad color families are present and which are not.

For example, the color overview can help answer questions such as:

- What general colors are present in the selected region?
- What percentage of the selected region is black, gray, white, blue, orange, etc.?
- Are certain color families absent or rare?
- Is the selected region mostly dark, light, colorful, or neutral?
- How does the general color composition compare between images or individuals?

This option is most useful when the user wants a simple, readable summary instead of a massive list of exact pixel colors.

---

### B. Binned Color CSV

The binned color export provides a moderate-level overview of the colors present by grouping similar RGB colors together.

Instead of preserving every exact shade, each RGB channel is floored to the nearest bin interval. This reduces the number of possible output colors and makes the data easier to understand.

The user can choose the bin size from the export menu.

Current bin size options include:

- 8
- 16
- 32
- 64

A smaller bin size preserves more detail. A larger bin size simplifies the colors more aggressively.

For example, with a bin size of 32:

```text
#93C958
RGB = R: 147, G: 209, B: 88
Binned RGB = R: 128, G: 192, B: 64
Binned Hex = #80C040
```

In this example, the original color `#93C958` is converted into RGB values:

```text
R = 147
G = 209
B = 88
```

With a bin size of 32, each channel is floored to the nearest multiple of 32:

```text
R: 147 → 128
G: 209 → 192
B: 88  → 64
```

The resulting binned color is:

```text
#80C040
```

For bin size 32, the channel flooring rules are:

```text
0–31     → 0
32–63    → 32
64–95    → 64
96–127   → 96
128–159  → 128
160–191  → 160
192–223  → 192
224–255  → 224
```

This reduces the number of possible colors from over 16 million exact RGB combinations into a much smaller and more manageable set.

For a bin size of 32, each RGB channel has 8 possible values:

```text
0, 32, 64, 96, 128, 160, 192, 224
```

Since there are 8 possible values for red, 8 for green, and 8 for blue, the total number of possible binned colors is:

```text
8 × 8 × 8 = 512
```

This export is useful when:

- exact shade differences are not important
- minor lighting differences should be reduced
- the full detailed file would be too large
- a researcher wants a more manageable color distribution
- similar colors should be grouped together for later analysis
- the user wants more detail than the overview CSV but less complexity than the detailed CSV

The binned CSV is a good middle ground between the high-level overview and the fully detailed pixel-level export.

---

### C. Detailed Color CSV

The detailed color export provides the raw count of every exact hex color found in the selected region.

Each row includes:

- hex value
- pixel count

This is the most precise output and may produce a large file for high-resolution images or large selected regions.

This export is useful when:

- exact color values matter
- downstream analysis will be performed in R, Python, Excel, or another tool
- rare colors or subtle shade differences need to be preserved
- the user wants the most complete representation of the selected region's color data
- small differences in shade may be biologically or visually meaningful

For example, if a selected region contains many slightly different shades of gray, brown, black, or blue, the detailed CSV preserves each exact hex value separately rather than grouping them into larger categories.

This file can become very large because natural images often contain thousands or even millions of subtly different pixel colors. For this reason, the detailed CSV is best used when precision is more important than file size or readability.

---

## How to Use

### 1. Upload an Image

Click **Upload** in the top navigation bar and select an image from your computer.

PNG images are preferred, but common image formats supported by the browser should work.

After uploading, the image should appear in the center canvas. Once the image is visible, the user can begin drawing a polygon around the region of interest.

### 2. Segment a Region

Click on the image to place polygon points around the region you want to analyze.

Each click adds a new point. The points are connected by lines to form a polygon boundary.

When the region is complete, double click to close the polygon.

After the polygon is closed, the **Color Analysis** button becomes available.

Tips for segmentation:

- Try to select only the region of interest.
- Avoid including background areas when possible.
- Use more points for curved or irregular regions.
- Use fewer points for simple rectangular or triangular regions.
- If the selected region is not correct, use Undo Point or Clear.

### 3. Run Color Analysis

Click **Color Analysis** in the sidebar.

The site analyzes only the pixels inside the selected polygon.

The analysis reads the pixel data inside the selected region and computes:

- exact hex color counts
- binned color counts
- general HSV-based color family counts
- total selected pixel count
- percentage of area represented by each color family

After analysis is complete, the bottom drawer displays a color overview preview.

### 4. Review the Drawer Preview

The bottom drawer shows grouped color results, including:

- general color family
- HSV range
- pixel count
- percent of selected area

This preview is intended to give a quick summary before exporting the full results.

For example, a result might show that a selected region is mostly black and gray, with smaller amounts of blue, brown, white, or yellow.

### 5. Export Results

Click **Export** in the top navigation bar.

Available export options include:

- detailed color CSV
- binned color CSV

For the binned export, select a bin size before downloading.

---

## Color Classification Method

Salamander Quantifier uses RGB and HSV color representations.

Exact pixel colors are read as RGB values and converted into hex codes for detailed export. For the color overview, RGB values are converted into HSV so that pixels can be grouped into general color families.

HSV stands for:

- **H, Hue:** the basic color angle, measured from 0° to 360°
- **S, Saturation:** how colorful or gray a color is
- **V, Value:** how bright or dark a color is

HSV is useful because hue represents the main color family, saturation helps distinguish colorful pixels from gray pixels, and value helps identify light and dark pixels.

For example:

- black is detected using low value
- white is detected using high value and low saturation
- gray is detected using low saturation
- colors like red, blue, purple, and green are detected mainly using hue

A simplified example of the color family logic is:

```text
White:  V ≥ 0.94 and S ≤ 0.08
Black:  V ≤ 0.18
Gray:   S ≤ 0.15
Brown:  H 15°–45° and V < 0.65
Red:    H 345°–360° or H 0°–15°
Orange: H 15°–45°
Yellow: H 45°–70°
Green:  H 70°–170°
Cyan:   H 170°–200°
Blue:   H 200°–255°
Purple: H 255°–320°
Pink:   H 320°–345°
```

This means the site does not compare each hex code to a fixed list of named colors. Instead, it converts each pixel from RGB into HSV and groups it into a broader color family based on the pixel's hue, saturation, and value.

For example, a hex code is classified into the purple family if its HSV hue value falls between approximately 255° and 320°, as long as it is not first classified as black, white, or gray based on value and saturation.

---

## Example Workflow

A typical workflow might look like this:

1. Upload a salamander image.
2. Draw a polygon around a body region.
3. Double click to close the polygon.
4. Run color analysis.
5. Review the bottom drawer preview.
6. Export the detailed color CSV for precise color values.
7. Export the binned color CSV for a simplified color distribution.
8. Use the CSV files in R, Python, Excel, or another analysis tool.

---

## Current Limitations

Salamander Quantifier is intended as a lightweight browser-based analysis tool. Results may be affected by:

- lighting conditions
- image resolution
- shadows or glare
- camera white balance
- how carefully the region is segmented
- background accidentally included inside the polygon
- compression artifacts in the uploaded image
- differences between field lighting and controlled lab lighting

For best results, use clear images with consistent lighting and segment only the region of interest.

The tool currently does not automatically identify salamander body regions or remove background pixels. The quality of the output depends heavily on the quality of the image and the accuracy of the user's manual segmentation.

---

## Project Structure

```text
Salamander-Quantifier/
├── docs/
│   ├── index.html
│   ├── styles.css
│   └── jss/
│       ├── main.js
│       ├── app.js
│       ├── state.js
│       ├── canvas.js
│       ├── upload.js
│       ├── segmentation.js
│       ├── color.js
│       ├── drawer.js
│       ├── export.js
│       └── utils.js
```

The site is deployed through GitHub Pages using the `docs` directory.

---

## Main JavaScript Modules

### `main.js`

Entry point for the site. It initializes the application.

### `app.js`

Connects HTML elements to JavaScript functionality. This includes upload events, segmentation events, color analysis, export actions, the help menu, and drawer initialization.

### `state.js`

Stores shared application state such as:

- uploaded image
- canvas reference
- polygon points
- color analysis results
- export button references
- selected bin size

### `canvas.js`

Handles canvas resizing, image drawing, polygon overlay drawing, and coordinate conversion between canvas space and image space.

### `upload.js`

Handles image uploads and initializes the image state.

### `segmentation.js`

Handles polygon point placement, polygon closing, undoing points, clearing selections, and resetting analysis state.

### `color.js`

Runs the color analysis. It reads pixels inside the selected polygon, counts exact hex values, builds binned color counts, and creates overview color family rows.

### `drawer.js`

Controls the bottom drawer and renders the color overview preview.

### `export.js`

Exports color analysis results as CSV files.

### `utils.js`

Contains shared utility functions such as clamping values, setting status messages, and downloading files.

---

## Deployment

This project is hosted with GitHub Pages.

To deploy updates:

1. Make changes locally.
2. Commit the changes.
3. Push to the GitHub branch used for Pages deployment.
4. GitHub Pages will serve the updated files from the configured deployment directory.

Typical workflow:

```bash
git add .
git commit -m "Update color analysis features"
git push origin main
```

If using a separate development branch:

```bash
git checkout trial
git add .
git commit -m "Refine demo color analysis features"
git push origin trial
```

---

## Built With

- HTML
- CSS
- JavaScript
- Canvas API
- GitHub Pages

No backend server is required.

---

## Version

### Current demo version

```text
v0.4
```

Current focus:

- manual polygon segmentation
- color overview preview
- detailed color export
- selectable binned color export
- help menu
- improved demo interface

Pattern analysis is planned for a future release.

---

## Planned Future Work

Possible future improvements include:

- pattern analysis
- spot detection
- stripe detection
- exporting region statistics
- comparing multiple selected regions
- adding calibration tools for scale
- improving color family definitions
- supporting multiple polygons per image
- allowing users to save project sessions
- adding more interactive visual previews

---

## Author

**Justin Henley**

---

## License

This project is licensed under the MIT License. See the repository license file for details.

---

## Acknowledgments

This project was developed under the guidance of Dr. Ben Fitzpatrick at the University of Tennessee, Knoxville as part of an effort to make image-based color quantification more accessible for amphibian research and ecological analysis.