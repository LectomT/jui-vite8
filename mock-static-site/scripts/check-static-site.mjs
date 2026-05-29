import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const requiredFiles = [
    "README.md",
    "index.html",
    "src/fixtures.js",
    "src/smoke.js",
    "src/theme-toggle.js",
    "styles/site.css",
    "assets/jui/.gitkeep"
];

const requiredHtmlMarkers = [
    "data-smoke-root",
    "data-smoke-summary",
    "src/fixtures.js",
    "src/theme-toggle.js",
    "src/smoke.js",
    "assets/jui/jui-core.js",
    "assets/jui/jui-ui.js",
    "assets/jui/jui-grid.js",
    "assets/jui/jui-chart.js"
];

const missingFiles = requiredFiles.filter((file) => {
    try {
        return !statSync(resolve(root, file)).isFile();
    } catch {
        return true;
    }
});

if (missingFiles.length > 0) {
    throw new Error(`Missing mock static site files: ${missingFiles.join(", ")}`);
}

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
const missingMarkers = requiredHtmlMarkers.filter((marker) => !indexHtml.includes(marker));

if (missingMarkers.length > 0) {
    throw new Error(`Missing mock static site markers: ${missingMarkers.join(", ")}`);
}

console.log("mock-static-site scaffold check passed");
