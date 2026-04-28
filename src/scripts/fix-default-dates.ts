import fs from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : full.endsWith('.md') ? [full] : [];
  });
}

for (const file of walk(CONTENT_DIR)) {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) continue;

  const fm = match[1];

  const dateMatch = fm.match(/^date:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
  const revisedMatch = fm.match(/^revised:\s*(\d{4}-\d{2}-\d{2})\s*$/m);

  if (!dateMatch || !revisedMatch) continue;

  const date = dateMatch[1];
  const revised = revisedMatch[1];

  if (date > revised) {
    const fixed = text.replace(
      /^revised:\s*\d{4}-\d{2}-\d{2}\s*$/m,
      `revised: ${date}`
    );

    fs.writeFileSync(file, fixed);
    console.log(`Fixed ${path.relative(process.cwd(), file)}: revised ${revised} → ${date}`);
  }
}