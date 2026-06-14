import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "src", "content");

const DIRECTORY_TYPE_MAP: Record<string, string> = {
  articles: "article",
  boxes: "box",
  orientation: "orientation",
  glossary: "glossary",
};

function getMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getMarkdownFiles(fullPath);
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      return [fullPath];
    }

    return [];
  });
}

function inferTypeFromPath(filePath: string): string | null {
  const relative = path.relative(CONTENT_DIR, filePath);
  const firstFolder = relative.split(path.sep)[0];

  return DIRECTORY_TYPE_MAP[firstFolder] ?? null;
}

function hasFrontmatter(content: string): boolean {
  return /^---\r?\n[\s\S]*?\r?\n---/.test(content);
}

function hasType(frontmatter: string): boolean {
  return /^type:\s*.+$/m.test(frontmatter);
}

function replaceInvalidType(frontmatter: string, correctType: string): string {
  return frontmatter.replace(/^type:\s*.+$/m, `type: ${correctType}`);
}

function insertTypeAfterSlugOrTitle(frontmatter: string, correctType: string): string {
  const lines = frontmatter.split(/\r?\n/);

  const slugIndex = lines.findIndex((line) => /^slug:\s*/.test(line));
  const titleIndex = lines.findIndex((line) => /^title:\s*/.test(line));

  const insertAfterIndex = slugIndex !== -1 ? slugIndex : titleIndex;

  if (insertAfterIndex !== -1) {
    lines.splice(insertAfterIndex + 1, 0, `type: ${correctType}`);
    return lines.join("\n");
  }

  lines.unshift(`type: ${correctType}`);
  return lines.join("\n");
}

function updateFrontmatter(content: string, correctType: string): string {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) return content;

  const fullMatch = match[0];
  const frontmatter = match[1];

  let updatedFrontmatter: string;

  if (hasType(frontmatter)) {
    updatedFrontmatter = replaceInvalidType(frontmatter, correctType);
  } else {
    updatedFrontmatter = insertTypeAfterSlugOrTitle(frontmatter, correctType);
  }

  const updatedBlock = `---\n${updatedFrontmatter}\n---`;

  return content.replace(fullMatch, updatedBlock);
}

const files = getMarkdownFiles(CONTENT_DIR);

const changed: string[] = [];
const skippedNoFrontmatter: string[] = [];
const skippedUnknownFolder: string[] = [];

for (const file of files) {
  const correctType = inferTypeFromPath(file);
  const relative = path.relative(process.cwd(), file);

  if (!correctType) {
    skippedUnknownFolder.push(relative);
    continue;
  }

  const content = fs.readFileSync(file, "utf8");

  if (!hasFrontmatter(content)) {
    skippedNoFrontmatter.push(relative);
    continue;
  }

  const updated = updateFrontmatter(content, correctType);

  if (updated !== content) {
    fs.writeFileSync(file, updated, "utf8");
    changed.push(relative);
  }
}

console.log("\nFrontmatter type repair complete.\n");

if (changed.length) {
  console.log(`Updated ${changed.length} file(s):`);
  for (const file of changed) {
    console.log(`  - ${file}`);
  }
  console.log("");
} else {
  console.log("No files needed updating.\n");
}

if (skippedNoFrontmatter.length) {
  console.log(`Skipped ${skippedNoFrontmatter.length} file(s) with no frontmatter:`);
  for (const file of skippedNoFrontmatter) {
    console.log(`  - ${file}`);
  }
  console.log("");
}

if (skippedUnknownFolder.length) {
  console.log(`Skipped ${skippedUnknownFolder.length} file(s) in unknown content folders:`);
  for (const file of skippedUnknownFolder) {
    console.log(`  - ${file}`);
  }
  console.log("");
}