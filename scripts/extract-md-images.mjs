#!/usr/bin/env node
// Extract base64 images from the original exported MD into real files, then
// append reference definitions ([imageN]: images/imageN.png) to the split docs
// so their ![][imageN] refs resolve again.
//
// Run: node scripts/extract-md-images.mjs "<original.md>" <out-image-dir> <doc.md>...
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { relative, dirname } from "node:path";

const [, , source, imageDir, ...docs] = process.argv;
if (!source || !imageDir) {
  console.error(
    "usage: node extract-md-images.mjs <original.md> <out-image-dir> <doc.md>...",
  );
  process.exit(1);
}

const src = readFileSync(source, "utf8");
mkdirSync(imageDir, { recursive: true });

// Definition lines look like: [image57]: <data:image/png;base64,iVBOR...>
const defRe = /^\[(image\d+)\]:\s*<?data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)>?/gm;

const written = new Map(); // name -> file path
for (const [, name, ext, b64] of src.matchAll(defRe)) {
  const file = `${imageDir}/${name}.${ext === "jpeg" ? "jpg" : ext}`;
  writeFileSync(file, Buffer.from(b64, "base64"));
  written.set(name, file);
}
console.log(`extracted ${written.size} images to ${imageDir}`);

for (const doc of docs) {
  const text = readFileSync(doc, "utf8");
  const used = [...new Set([...text.matchAll(/\[(image\d+)\]/g)].map((m) => m[1]))];
  const missing = used.filter((n) => !written.has(n));
  const defs = used
    .filter((n) => written.has(n))
    .map((n) => `[${n}]: ${relative(dirname(doc), written.get(n))}`);

  // Drop any existing definition block we previously appended, then re-append.
  const body = text.replace(/\n*<!-- image refs -->[\s\S]*$/, "");
  writeFileSync(doc, `${body}\n\n<!-- image refs -->\n${defs.join("\n")}\n`, "utf8");

  console.log(
    `${doc}: ${defs.length} refs wired${missing.length ? `, MISSING: ${missing.join(", ")}` : ""}`,
  );
}
