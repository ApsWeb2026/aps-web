/**
 * Remark plugin that renders [[box:slug]] embeds inline.
 *
 * Scans markdown text nodes for the pattern [[box:slug]], looks up the
 * corresponding APS Box file in src/content/boxes/, and replaces the
 * placeholder with a styled HTML block containing the box title and body.
 *
 * Build fails if a referenced box slug does not exist.
 */

import fs from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';
import { micromark } from 'micromark';

const BOX_DIR = path.resolve('src/content/boxes');
const BOX_PATTERN = /\[\[box:([\w-]+)\]\]/g;

interface BoxData {
  title: string;
  body: string;
}

function loadBoxes(): Map<string, BoxData> {
  const boxes = new Map<string, BoxData>();
  if (!fs.existsSync(BOX_DIR)) return boxes;

  for (const file of fs.readdirSync(BOX_DIR).filter((f) => f.endsWith('.md'))) {
    const raw = fs.readFileSync(path.join(BOX_DIR, file), 'utf-8');
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!fmMatch) continue;

    const frontmatter = fmMatch[1];
    const body = fmMatch[2].trim();

    let slug = '';
    let title = '';
    for (const line of frontmatter.split('\n')) {
      const kv = line.match(/^(\w[\w-]*):\s*(.+)/);
      if (!kv) continue;
      const val = kv[2].trim().replace(/^["']|["']$/g, '');
      if (kv[1] === 'slug') slug = val;
      if (kv[1] === 'title') title = val;
    }

    if (slug) {
      boxes.set(slug, { title, body });
    }
  }

  return boxes;
}

function formatBoxTitle(title: string): string {
  // Ensure consistent "APS Box — Title" format
  const stripped = title.replace(/^APS Box\s*[—–-]\s*/i, '').trim();
  return `APS Box — ${stripped}`;
}

export function remarkBoxEmbed() {
  const boxes = loadBoxes();

  return (tree: any) => {
    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      if (index === undefined || !parent) return;

      const text: string = node.value;
      if (!text.includes('[[box:')) return;

      const parts: any[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      const regex = new RegExp(BOX_PATTERN.source, 'g');
      while ((match = regex.exec(text)) !== null) {
        const slug = match[1];
        const box = boxes.get(slug);

        if (!box) {
          throw new Error(
            `Box embed error: no box found with slug "${slug}". ` +
              `Available slugs: ${[...boxes.keys()].join(', ')}`,
          );
        }

        // Text before the match
        if (match.index > lastIndex) {
          parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }

        // Render box body markdown to HTML
        const bodyHtml = micromark(box.body);
        const displayTitle = formatBoxTitle(box.title);

        parts.push({
          type: 'html',
          value:
            `<aside class="aps-box-inline" role="note" aria-label="${displayTitle}">\n` +
            `<div class="aps-box-inline-title">${displayTitle}</div>\n` +
            `<div class="aps-box-inline-body">${bodyHtml}</div>\n` +
            `</aside>`,
        });

        lastIndex = match.index + match[0].length;
      }

      // Remaining text after last match
      if (lastIndex < text.length) {
        parts.push({ type: 'text', value: text.slice(lastIndex) });
      }

      if (parts.length > 0) {
        parent.children.splice(index, 1, ...parts);
      }
    });
  };
}
