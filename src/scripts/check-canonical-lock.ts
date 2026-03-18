/**
 * Canonical lock enforcement via content hashing.
 *
 * When a page is marked canonical with a canonicalLockDate, its body content
 * is hashed and stored in .content-hashes.json. On subsequent builds, if the
 * body has changed without updating the `revised` date, the build fails.
 *
 * This enforces the "no silent drift" protocol: canonical content cannot
 * change without explicitly acknowledging the revision.
 *
 * Exit code 1 if locked content was modified without updating `revised`.
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

function getBodyContent(fileContent: string): string {
  // Extract everything after the closing --- of frontmatter
  const match = fileContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1].trim() : '';
}

/** Extract frontmatter fields that are protected by the canonical lock. */
function getProtectedFrontmatter(fm: Record<string, unknown>): string {
  // These fields carry the substantive content of each entry.
  // Changes to any of them in a canonical page must be acknowledged via `revised`.
  const protectedKeys = ['title', 'definition', 'inBrief', 'abstract', 'overview'];
  const parts: string[] = [];
  for (const key of protectedKeys) {
    if (fm[key] !== undefined) {
      parts.push(`${key}:${String(fm[key])}`);
    }
  }
  return parts.join('\n');
}

function hashContent(body: string): string {
  return crypto.createHash('sha256').update(body, 'utf-8').digest('hex').slice(0, 16);
}

function parseFrontmatter(content: string): Record<string, unknown> {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return {};

  const fm: Record<string, unknown> = {};
  const lines = fmMatch[1].split('\n');

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (kvMatch) {
      let value: unknown = kvMatch[2].trim();
      if (typeof value === 'string' && /^["'](.*)["']$/.test(value)) {
        value = (value as string).slice(1, -1);
      }
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      fm[kvMatch[1]] = value;
    }
  }

  return fm;
}

function loadRegistry(): HashRegistry {
  if (fs.existsSync(HASH_FILE)) {
    return JSON.parse(fs.readFileSync(HASH_FILE, 'utf-8'));
  }
  return {};
}

function saveRegistry(registry: HashRegistry): void {
  fs.writeFileSync(HASH_FILE, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
}

interface Violation {
  file: string;
  message: string;
}

function checkCanonicalLocks(): Violation[] {
  const registry = loadRegistry();
  const newRegistry: HashRegistry = {};
  const violations: Violation[] = [];

  const canonicalSections = ['articles', 'glossary', 'orientation'];

  for (const section of canonicalSections) {
    const dir = path.join(CONTENT_DIR, section);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const fm = parseFrontmatter(content);

      if (fm.canonical !== true || !fm.canonicalLockDate) continue;

      const key = `${section}/${fm.slug}`;
      const body = getBodyContent(content);
      const protectedFm = getProtectedFrontmatter(fm);
      const hash = hashContent(protectedFm + '\n---\n' + body);
      const revised = fm.revised as string;
      const lockedSince = fm.canonicalLockDate as string;

      const existing = registry[key];

      if (existing) {
        // Content existed before — check if hash changed without revised update
        if (existing.hash !== hash && existing.revised === revised) {
          violations.push({
            file: path.relative(process.cwd(), filePath),
            message: `Canonical content modified without updating "revised" date (locked since ${lockedSince})`,
          });
        }
      }

      // Always update the registry with current state
      newRegistry[key] = { hash, revised, lockedSince };
    }
  }

  // Merge: keep old entries for pages no longer canonical, add new ones
  const merged = { ...registry, ...newRegistry };
  saveRegistry(merged);

  return violations;
}

// Run
const violations = checkCanonicalLocks();

if (violations.length > 0) {
  console.error('\n❌ Canonical lock violations:\n');
  for (const v of violations) {
    console.error(`  ${v.file}`);
    console.error(`    → ${v.message}`);
  }
  console.error(`\n${violations.length} violation(s). Update "revised" date to acknowledge changes.\n`);
  process.exit(1);
} else {
  console.log('✓ Canonical lock check passed.');
}
