// Plate height rule (see CLAUDE.md): from 1280px every plate is as tall as Zliding's (±2px), in en, es and ca.
// Usage: node ci/check-plate-heights.mjs  (needs `playwright` resolvable; serves site/ itself)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(fileURLToPath(new URL("..", import.meta.url)), "site");
const types = { ".html": "text/html", ".css": "text/css", ".svg": "image/svg+xml", ".js": "text/javascript", ".png": "image/png", ".webp": "image/webp", ".json": "application/json" };

const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
    if (p.endsWith("/")) p += "index.html";
    res.setHeader("content-type", types[extname(p)] ?? "application/octet-stream");
    res.end(await readFile(join(root, p)));
  } catch {
    res.statusCode = 404;
    res.end();
  }
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch();
const page = await browser.newPage();
const failures = [];
for (const lang of ["", "es/", "ca/"]) {
  for (const width of [1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/${lang}`, { waitUntil: "load" });
    const heights = await page.$$eval(".plate:not(.plate-next)", (els) => els.map((e) => e.getBoundingClientRect().height));
    const spread = Math.max(...heights) - Math.min(...heights);
    console.log(`/${lang} @${width}: ${heights.map(Math.round).join(", ")} (spread ${spread.toFixed(1)})`);
    if (heights.length < 4 || spread > 2) failures.push(`/${lang} @${width}`);
  }
}
await browser.close();
server.close();
if (failures.length) {
  console.error(`Plate heights differ from Zliding's: ${failures.join("; ")}`);
  process.exit(1);
}
