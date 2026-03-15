/**
 * Generates Netlify _redirects file from redirects.yml.
 * Run as part of the build pipeline, after astro build.
 */

import fs from 'node:fs';
import path from 'node:path';

const REDIRECTS_YML = path.resolve('redirects.yml');
const OUTPUT = path.resolve('dist/_redirects');

interface Redirect {
  from: string;
  to: string;
  status?: number;
}

function parseRedirectsYml(): Redirect[] {
  const content = fs.readFileSync(REDIRECTS_YML, 'utf-8');

  // Simple YAML array parser for our known format
  const redirects: Redirect[] = [];
  const entryRegex = /-\s+from:\s*["']?([^"'\n]+)["']?\s+to:\s*["']?([^"'\n]+)["']?(?:\s+status:\s*(\d+))?/g;
  let match;
  while ((match = entryRegex.exec(content)) !== null) {
    redirects.push({
      from: match[1].trim(),
      to: match[2].trim(),
      status: match[3] ? parseInt(match[3], 10) : 301,
    });
  }

  return redirects;
}

// Run
const redirects = parseRedirectsYml();

if (redirects.length === 0) {
  console.log('✓ No redirects to generate (redirects.yml is empty).');
  process.exit(0);
}

const lines = redirects.map((r) => `${r.from}  ${r.to}  ${r.status ?? 301}`);
const output = lines.join('\n') + '\n';

fs.writeFileSync(OUTPUT, output, 'utf-8');
console.log(`✓ Generated ${redirects.length} redirect(s) in dist/_redirects.`);
