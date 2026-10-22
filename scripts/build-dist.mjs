// Builds dist/ for production: copies only the public files the site serves.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist");

const files = [
  "index.html", "styles.css", "app.js", "fx3d.js", "louis.js", "louis-data.js", "louis-fallback.png",
  "content/manifest.js", "downloads/aviso-lite.zip",
  "favicon.svg", "robots.txt", "sitemap.xml", "llms.txt", "google1d46b99a88f4b0f9.html"
];
const dirs = ["assets/audio", "assets/suikou", "assets/work", "assets/xiaoyi"];

rmSync(out, { recursive: true, force: true });
let n = 0;
for (const p of [...files, ...dirs]) {
  const src = join(root, p);
  if (!existsSync(src)) throw new Error(`build-dist: missing ${p}`);
  mkdirSync(dirname(join(out, p)), { recursive: true });
  cpSync(src, join(out, p), { recursive: true });
  n++;
}
console.log(`build-dist: copied ${n} entries to dist/`);
