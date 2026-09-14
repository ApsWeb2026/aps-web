import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const now = new Date();

const today =
  `${now.getFullYear()}-` +
  `${String(now.getMonth() + 1).padStart(2, "0")}-` +
  `${String(now.getDate()).padStart(2, "0")}`;

const staged = execFileSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
  { encoding: "utf8" }
)
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean)
  .filter(
    (file) =>
      file.startsWith("src/content/") &&
      file.endsWith(".md")
  );

let updated = 0;

for (const file of staged) {
  const absolutePath = path.resolve(file);
  const original = readFileSync(absolutePath, "utf8");

  // Only operate on files with YAML frontmatter.
  if (!original.startsWith("---")) {
    console.warn(`Skipping ${file}: no opening frontmatter delimiter.`);
    continue;
  }

  const closingIndex = original.indexOf("\n---", 3);

  if (closingIndex === -1) {
    console.warn(`Skipping ${file}: no closing frontmatter delimiter.`);
    continue;
  }

  const frontmatterEnd = closingIndex + 4;
  const frontmatter = original.slice(0, frontmatterEnd);
  const body = original.slice(frontmatterEnd);

  if (!/^revised:\s*\d{4}-\d{2}-\d{2}\s*$/m.test(frontmatter)) {
    console.warn(`Skipping ${file}: no existing revised field.`);
    continue;
  }

  const updatedFrontmatter = frontmatter.replace(
    /^revised:\s*\d{4}-\d{2}-\d{2}\s*$/m,
    `revised: ${today}`
  );

  const revised = updatedFrontmatter + body;

  if (revised !== original) {
    writeFileSync(absolutePath, revised, {
      encoding: "utf8",
    });

    execFileSync("git", ["add", file]);

    console.log(`Updated revised date: ${file} → ${today}`);
    updated++;
  }
}

console.log(
  updated === 0
    ? "No revised dates required updating."
    : `Updated ${updated} revised date(s).`
);