/**
 * Build-time broken link detection.
 * Scans all Markdown content files for internal links and verifies
 * that each target exists as a valid route.
 *
 * Exit code 1 if any broken links are found.
 */

import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'node:fs';

const CONTENT_DIR = path.resolve('src/content');
const VALID_SECTIONS = ['articles', 'glossary', 'streams', 'orientation', 'diagrams', 'clusters'];

interface BrokenLink {
  file: string;
  link: string;
  reason: string;
}

function getContentSlugs(): Map<string, Set<string>> {
  const slugsBySection = new Map<string, Set<string>>();

  for (const section of ['articles', 'glossary', 'streams', 'orientation', 'diagrams']) {
    const dir = path.join(CONTENT_DIR, section);
    const slugs = new Set<string>();

    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        const slugMatch = content.match(/^slug:\s*["']?([^"'\n]+)["']?/m);
        if (slugMatch) {
          slugs.add(slugMatch[1].trim());
        }
      }
    }
    slugsBySection.set(section, slugs);
  }

  // Add hardcoded cluster slugs
  slugsBySection.set(
    'clusters',
    new Set([
      'foundations',
      'definition-borderlines',
      'cognition-mind',
      'empirical-interface',
      'scaling-complexity',
      'historical-context',
    ]),
  );

  return slugsBySection;
}

function findInternalLinks(content: string): string[] {
  const links: string[] = [];
  // Match markdown links: [text](/path/) and [text](/path/slug/)
  const mdLinkRegex = /\[([^\]]*)\]\((\/([\w-]+)\/([\w-]+)?\/?)(?:#[^)]+)?\)/g;
  let match;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    links.push(match[2]);
  }
  return links;
}

function checkLinks(): BrokenLink[] {
  const slugsBySection = getContentSlugs();
  const broken: BrokenLink[] = [];

  for (const section of ['articles', 'glossary', 'streams', 'orientation', 'diagrams']) {
    const dir = path.join(CONTENT_DIR, section);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const links = findInternalLinks(content);

      for (const link of links) {
        // Parse: /section/slug/ or /section/
        const parts = link.replace(/^\//, '').replace(/\/$/, '').split('/');
        const targetSection = parts[0];
        const targetSlug = parts[1];

        if (!VALID_SECTIONS.includes(targetSection)) {
          broken.push({
            file: path.relative(process.cwd(), filePath),
            link,
            reason: `Unknown section "${targetSection}"`,
          });
          continue;
        }

        if (targetSlug) {
          const slugs = slugsBySection.get(targetSection);
          if (slugs && !slugs.has(targetSlug)) {
            broken.push({
              file: path.relative(process.cwd(), filePath),
              link,
              reason: `Slug "${targetSlug}" not found in ${targetSection}`,
            });
          }
        }
      }
    }
  }

  return broken;
}

// Run
const broken = checkLinks();

if (broken.length > 0) {
  console.error('\n❌ Broken internal links found:\n');
  for (const b of broken) {
    console.error(`  ${b.file}`);
    console.error(`    → ${b.link} (${b.reason})`);
  }
  console.error(`\n${broken.length} broken link(s) found.\n`);
  process.exit(1);
} else {
  console.log('✓ All internal links valid.');
}
