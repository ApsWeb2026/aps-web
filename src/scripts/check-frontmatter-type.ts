import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "src", "content");
const INCLUDED_COLLECTIONS = new Set(["articles", "boxes", "glossary", "orientation"]);
const VALID_TYPES = new Set(["article", "orientation", "box", "glossary"]);

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

function getFrontmatter(content: string): string | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

const files = getMarkdownFiles(CONTENT_DIR);

const missingFrontmatter: string[] = [];
const missingType: string[] = [];
const invalidType: string[] = [];

for (const file of files) {
  const relativeToContent = path.relative(CONTENT_DIR, file);
  const collection = relativeToContent.split(path.sep)[0];

  if (!INCLUDED_COLLECTIONS.has(collection)) {
    continue;
  }

  const content = fs.readFileSync(file, "utf8");
  const frontmatter = getFrontmatter(content);
  const relative = path.relative(process.cwd(), file);

  if (!frontmatter) {
    missingFrontmatter.push(relative);
    continue;
  }

  const typeMatch = frontmatter.match(/^type:\s*["']?([^"'\n#]+)["']?\s*$/m);

  if (!typeMatch) {
    missingType.push(relative);
    continue;
  }

  const type = typeMatch[1].trim();

  if (!VALID_TYPES.has(type)) {
    invalidType.push(`${relative} — type: ${type}`);
  }
}

if (missingFrontmatter.length || missingType.length || invalidType.length) {
  console.log("\n⚠ Frontmatter type audit failed:\n");

  if (missingFrontmatter.length) {
    console.log("Missing frontmatter block:");
    console.log("");
    console.log("Each Markdown content file must begin with an opening --- line and end its frontmatter with a closing --- line.");
    console.log("");
    console.log("Example:");
    console.log("");
    console.log("---");
    console.log("title: Example Title");
    console.log("slug: example-title");
    console.log("type: article");
    console.log("status: canonical");
    console.log("---");
    console.log("");
    for (const file of missingFrontmatter) {
      console.log(`  - ${file}`);
    }
    console.log("");
  }

  if (missingType.length) {
    console.log("Missing type field:");
    console.log("");
    console.log("Add one of the following inside the frontmatter block:");
    console.log("");
    console.log("type: article");
    console.log("type: orientation");
    console.log("type: box");
    console.log("type: glossary");
    console.log("");
    console.log("Example:");
    console.log("");
    console.log("---");
    console.log("title: Example Title");
    console.log("slug: example-title");
    console.log("type: article");
    console.log("status: canonical");
    console.log("---");
    console.log("");
    for (const file of missingType) {
      console.log(`  - ${file}`);
    }
    console.log("");
  }

  if (invalidType.length) {
    console.log("Invalid type field:");
    console.log("");
    console.log("Allowed values are:");
    console.log("");
    console.log("  - article");
    console.log("  - orientation");
    console.log("  - box");
    console.log("  - glossary");
    console.log("");
    for (const file of invalidType) {
      console.log(`  - ${file}`);
    }
    console.log("");
  }

  process.exit(1);
}

console.log("✓ Frontmatter type audit passed.");