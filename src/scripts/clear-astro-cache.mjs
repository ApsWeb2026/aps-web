import fs from "node:fs";

const paths = [
  ".astro",
  "node_modules/.astro",
];

for (const path of paths) {
  if (fs.existsSync(path)) {
    fs.rmSync(path, { recursive: true, force: true });
    console.log(`Cleared ${path}`);
  }
}