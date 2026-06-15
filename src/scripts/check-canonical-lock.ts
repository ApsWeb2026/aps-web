/**
 * Canonical lock enforcement via content hashing.
 *
 * When a page is marked canonical with a canonicalLockDate, its protected
 * frontmatter fields and body content are hashed and stored in
 * .content-hashes.json. On subsequent builds, if protected canonical content
 * changes without updating the `revised` date, the build fails.
 *
 * This enforces the "no silent drift" protocol: canonical content cannot
 * change without explicitly acknowledging the revision.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CONTENT_DIR = path.resolve('src/content');
const HASH_FILE = path.resolve('.content-hashes.json');

interface HashEntry {
  hash: string;
  revised: string;
  lockedSince: string;
}

type HashRegistry = Record<string, HashEntry>;

interface Violation {
  file: string;
  message: string;
}

function getBodyContent(fileContent: string): string {
  const normalised = fileContent.replace(/\r\n/g, '\n');
  const match = normalised.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1].trim() : '';
}

function getProtectedFrontmatter(fm: Record<string, unknown>): string {
  const protectedKeys = ['title', 'definition', 'inBrief', 'abstract', 'overview'];
  const parts: string[] = [];

  for (const key of protectedKeys) {
    if (fm[key] !== undefined) {
      parts.push(`${key}:${String(fm[key])}`);
    }
  }

  return parts.join('\n');
}

function hashContent(content: string): string {
  const normalised = content.replace(/\r\n/g, '\n');
  return crypto
    .createHash('sha256')
    .update(normalised, 'utf-8')
    .digest('hex')
    .slice(0, 16);
}

function parseFrontmatter(content: string): Record<string, unknown> {
  const normalised = content.replace(/\r\n/g, '\n');
  const fmMatch = normalised.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return {};

  const fm: Record<string, unknown> = {};
  const lines = fmMatch[1].split('\n');

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (!kvMatch) continue;

    let value: unknown = kvMatch[2].trim();

    if (typeof value === 'string' && /^["'](.*)["']$/.test(value)) {
      value = value.slice(1, -1);
    }

    if (value === 'true') value = true;
    if (value === 'false') value = false;

    fm[kvMatch[1]] = value;
  }

  return fm;
}

function loadRegistry(): HashRegistry {
  if (!fs.existsSync(HASH_FILE)) return {};
  return JSON.parse(fs.readFileSync(HASH_FILE, 'utf-8'));
}

function saveRegistry(registry: HashRegistry): void {
  fs.writeFileSync(HASH_FILE, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
}

function checkCanonicalLocks(): Violation[] {
  const registry = loadRegistry();
  const newRegistry: HashRegistry = {};
  const violations: Violation[] = [];

  const canonicalSections = ['articles', 'glossary', 'orientation'];

  for (const section of canonicalSections) {
    const dir = path.join(CONTENT_DIR, section);
    if (!fs.existsSync(dir)) continue;

    const files = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith('.md'))
      .sort();

    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const fm = parseFrontmatter(content);

      if (fm.canonical !== true || !fm.canonicalLockDate) continue;

      const key = `${section}/${fm.slug}`;
      const body = getBodyContent(content);
      const protectedFm = getProtectedFrontmatter(fm);
      const hash = hashContent(`${protectedFm}\n---\n${body}`);
      const revised = fm.revised as string;
      const lockedSince = fm.canonicalLockDate as string;

      const existing = registry[key];

      if (existing && existing.hash !== hash && existing.revised === revised) {
        violations.push({
          file: path.relative(process.cwd(), filePath),
          message: `Canonical content modified without updating "revised" date (locked since ${lockedSince})`,
        });
      }

      newRegistry[key] = { hash, revised, lockedSince };
    }
  }

  const merged = { ...registry, ...newRegistry };

  if (!process.env.CI) {
    saveRegistry(merged);
  }

  return violations;
}

const violations = checkCanonicalLocks();

if (violations.length > 0) {
  console.error('\n❌ Canonical lock violations:\n');

  for (const violation of violations) {
    console.error(`  ${violation.file}`);
    console.error(`    → ${violation.message}`);
  }

  console.error(
    `\n${violations.length} violation(s). Update "revised" date to acknowledge changes.\n`,
  );

  process.exit(1);
}

console.log('✓ Canonical lock check passed.');