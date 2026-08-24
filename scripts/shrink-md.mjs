#!/usr/bin/env node
// Strip base64 image payloads from a big exported MD file, keep everything else.
// Run: node scripts/shrink-md.mjs "<input.md>" ["<output.md>"]
import { readFileSync, writeFileSync } from "node:fs";

const [, , input, output] = process.argv;
if (!input) {
  console.error("usage: node shrink-md.mjs <input.md> [output.md]");
  process.exit(1);
}
const out = output ?? input.replace(/\.md$/i, ".stripped.md");

const src = readFileSync(input, "utf8");
let removedBytes = 0;
let removedCount = 0;

const stripped = src.replace(
  /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g,
  (match) => {
    removedBytes += match.length;
    removedCount += 1;
    return `data:image/removed;base64,[stripped ${match.length} bytes]`;
  },
);

writeFileSync(out, stripped, "utf8");

console.log(`images stripped: ${removedCount}`);
console.log(`bytes removed:   ${removedBytes}`);
console.log(`input size:      ${src.length}`);
console.log(`output size:     ${stripped.length}`);
console.log(`output file:     ${out}`);
