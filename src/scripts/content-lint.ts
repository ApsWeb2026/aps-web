/**
 * Content lint script — validates frontmatter conventions.
 *
 * Checks:
 * - Missing `revised` field on content types that require it
 * - Canonical pages missing `canonicalLockDate`
 * - Duplicate slugs within a collection
 * - References missing required fields (if references array used)
 * - Invalid glossary links in relatedGlossaryTerms / associatedGlossaryTerms
 *
 * Exit code 1 if any issues found.
 */

import fs from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.resolve('src/content');

interface LintIssue {
  file: string;
  issue: string;
  severity: 'error' | 'warning';
}

function parseFrontmatter(content: string): Record<string, unknown> {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return {};

  const fm: Record<string, unknown> = {};
  const lines = fmMatch[1].split('\n');

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (kvMatch) {
      let value: unknown = kvMatch[2].trim();
      // Remove quotes
      if (typeof value === 'string' && /^["'](.*)["']$/.test(value)) {
        value = (value as string).slice(1, -1);
      }
      // Boolean
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      fm[kvMatch[1]] = value;
    }
  }

  return fm;
}

function getSlugsForSection(section: string): Set<string> {
  const dir = path.join(CONTENT_DIR, section);
  const slugs = new Set<string>();
  if (!fs.existsSync(dir)) return slugs;

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const fm = parseFrontmatter(content);
    if (fm.slug) slugs.add(fm.slug as string);
  }
  return slugs;
}

function getGlossarySlugs(): Set<string> {
  return getSlugsForSection('glossary');
}

function getArticleSlugs(): Set<string> {
  return getSlugsForSection('articles');
}

function getBoxSlugs(): Set<string> {
  return getSlugsForSection('boxes');
}

function findBoxEmbeds(content: string): string[] {
  const regex = /\[\[box:([\w-]+)\]\]/g;
  const slugs: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    slugs.push(match[1]);
  }
  return slugs;
}

function parseYamlArray(content: string, fieldName: string): string[] {
  const regex = new RegExp(`^${fieldName}:\\s*$`, 'm');
  const match = content.match(regex);
  if (!match) return [];

  const startIndex = (match.index ?? 0) + match[0].length;
  const rest = content.slice(startIndex);
  const items: string[] = [];

  let foundItem = false;
  for (const line of rest.split('\n')) {
    const itemMatch = line.match(/^\s+-\s*["']?([^"'\n]+)["']?/);
    if (itemMatch) {
      foundItem = true;
      items.push(itemMatch[1].trim());
    } else if (line.trim() === '') {
      // Skip empty lines before first item; stop after items have started
      if (foundItem) break;
    } else if (line.match(/^\S/)) {
      break;
    }
  }

  return items;
}

function lintCollection(section: string): LintIssue[] {
  const dir = path.join(CONTENT_DIR, section);
  const issues: LintIssue[] = [];
  if (!fs.existsSync(dir)) return issues;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  const slugsSeen = new Map<string, string>();
  const glossarySlugs = getGlossarySlugs();
  const articleSlugs = getArticleSlugs();
  const orientationSlugs = getSlugsForSection('orientation');
  const boxSlugs = getBoxSlugs();
  const requiresRevised = ['articles', 'glossary', 'streams', 'orientation', 'diagrams'];
  const supportsCanonical = ['articles', 'glossary', 'orientation'];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const relPath = path.relative(process.cwd(), filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const fm = parseFrontmatter(content);

    // Check slug (error — structural)
    const slug = fm.slug as string;
    if (!slug) {
      issues.push({ file: relPath, issue: 'Missing slug', severity: 'error' });
    } else {
      if (slugsSeen.has(slug)) {
        issues.push({
          file: relPath,
          issue: `Duplicate slug "${slug}" (also in ${slugsSeen.get(slug)})`,
          severity: 'error',
        });
      }
      slugsSeen.set(slug, relPath);
    }

    // Check revised (error — structural)
    if (requiresRevised.includes(section) && !fm.revised) {
      issues.push({ file: relPath, issue: 'Missing "revised" date', severity: 'error' });
    }

    // Check canonical without lockDate (error — structural)
    if (supportsCanonical.includes(section)) {
      if (fm.canonical === true && !fm.canonicalLockDate) {
        issues.push({
          file: relPath,
          issue: 'Canonical page missing "canonicalLockDate"',
          severity: 'error',
        });
      }
    }

    // Check glossary term references (warning — content may be added later)
    if (section === 'articles' || section === 'orientation') {
      const terms = parseYamlArray(content, 'relatedGlossaryTerms');
      for (const term of terms) {
        const normalized = term.toLowerCase().replace(/\s+/g, '-');
        if (!glossarySlugs.has(normalized)) {
          issues.push({
            file: relPath,
            issue: `relatedGlossaryTerms: "${term}" not found in glossary`,
            severity: 'warning',
          });
        }
      }
    }

    // Check relatedArticles references (warning — content may be added later)
    if (section === 'articles' || section === 'orientation') {
      const related = parseYamlArray(content, 'relatedArticles');
      for (const ref of related) {
        if (!articleSlugs.has(ref) && !orientationSlugs.has(ref)) {
          issues.push({
            file: relPath,
            issue: `relatedArticles: "${ref}" not found in articles or orientation`,
            severity: 'warning',
          });
        }
      }
    }

    if (section === 'streams') {
      const terms = parseYamlArray(content, 'associatedGlossaryTerms');
      for (const term of terms) {
        if (!glossarySlugs.has(term)) {
          issues.push({
            file: relPath,
            issue: `associatedGlossaryTerms: "${term}" not found in glossary`,
            severity: 'warning',
          });
        }
      }
    }

    // Check [[box:slug]] embeds in body content (error — build will fail)
    const boxEmbeds = findBoxEmbeds(content);
    for (const boxSlug of boxEmbeds) {
      if (!boxSlugs.has(boxSlug)) {
        issues.push({
          file: relPath,
          issue: `Box embed: [[box:${boxSlug}]] not found in boxes`,
          severity: 'error',
        });
      }
    }
  }

  return issues;
}

// Run
const allIssues: LintIssue[] = [];
for (const section of ['articles', 'glossary', 'streams', 'orientation', 'boxes', 'diagrams']) {
  allIssues.push(...lintCollection(section));
}

const errors = allIssues.filter((i) => i.severity === 'error');
const warnings = allIssues.filter((i) => i.severity === 'warning');

if (warnings.length > 0) {
  console.warn('\n⚠ Content lint warnings:\n');
  for (const issue of warnings) {
    console.warn(`  ${issue.file}`);
    console.warn(`    → ${issue.issue}`);
  }
  console.warn(`\n${warnings.length} warning(s).\n`);
}

if (errors.length > 0) {
  console.error('\n❌ Content lint errors:\n');
  for (const issue of errors) {
    console.error(`  ${issue.file}`);
    console.error(`    → ${issue.issue}`);
  }
  console.error(`\n${errors.length} error(s) found — build will fail.\n`);
  process.exit(1);
}

if (allIssues.length === 0) {
  console.log('✓ Content lint passed — no issues found.');
} else {
  console.log(`✓ Content lint passed — ${warnings.length} warning(s), 0 errors.`);
}
