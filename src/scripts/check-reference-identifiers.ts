import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as yaml from 'js-yaml';

import {
  loadReferenceLibrary,
  retrieveReferences,
} from '../lib/references/retrieval';

type FrontmatterRecord = Record<string, unknown>;

type AuditFailure = {
  file: string;
  identifier: string;
  reason: string;
};

const contentDirectories = [
  'src/content/articles',
  'src/content/glossary',
  'src/content/orientation',
];

const referenceLibraryPath =
  './src/data/aps-canonical-references.yaml';

function isRecord(value: unknown): value is FrontmatterRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getMarkdownFiles(directory: string): string[] {
  const absoluteDirectory = path.resolve(
    process.cwd(),
    directory,
  );

  if (!fs.existsSync(absoluteDirectory)) {
    return [];
  }

  const files: string[] = [];

  for (const entry of fs.readdirSync(absoluteDirectory, {
    withFileTypes: true,
  })) {
    const absolutePath = path.join(
      absoluteDirectory,
      entry.name,
    );

    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(absolutePath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.md')
    ) {
      files.push(absolutePath);
    }
  }

  return files;
}

function readFrontmatter(
  filePath: string,
): FrontmatterRecord {
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) {
    throw new Error(
      'Valid YAML frontmatter delimiters not found.',
    );
  }

  const parsed = yaml.load(match[1]) as unknown;

  if (!isRecord(parsed)) {
    throw new Error(
      'Frontmatter is not a YAML object.',
    );
  }

  return parsed;
}

function getReferenceIds(
  frontmatter: FrontmatterRecord,
): string[] {
  const references = frontmatter.references;

  if (Array.isArray(references)) {
    return references.filter(
      (value): value is string =>
        typeof value === 'string',
    );
  }

  if (
    isRecord(references) &&
    Array.isArray(references.references)
  ) {
    return references.references.filter(
      (value): value is string =>
        typeof value === 'string',
    );
  }

  return [];
}

const library = loadReferenceLibrary(
  referenceLibraryPath,
);

const failures: AuditFailure[] = [];
let examinedFiles = 0;
let examinedIdentifiers = 0;

for (const directory of contentDirectories) {
  for (const filePath of getMarkdownFiles(directory)) {
    examinedFiles += 1;

    let frontmatter: FrontmatterRecord;

    try {
      frontmatter = readFrontmatter(filePath);
    } catch (error) {
      failures.push({
        file: path.relative(process.cwd(), filePath),
        identifier: '(frontmatter)',
        reason:
          error instanceof Error
            ? error.message
            : 'Unable to read frontmatter.',
      });
      continue;
    }

    const referenceIds = getReferenceIds(frontmatter);
    const seen = new Set<string>();

    for (const identifier of referenceIds) {
      examinedIdentifiers += 1;

      if (seen.has(identifier)) {
        failures.push({
          file: path.relative(process.cwd(), filePath),
          identifier,
          reason: 'duplicate identifier in frontmatter',
        });
        continue;
      }

      seen.add(identifier);

      const matches = retrieveReferences(
        library.references,
        { id: identifier },
      );

      if (matches.length === 0) {
        failures.push({
          file: path.relative(process.cwd(), filePath),
          identifier,
          reason: 'unresolved APS-REF identifier',
        });
      } else if (matches.length > 1) {
        failures.push({
          file: path.relative(process.cwd(), filePath),
          identifier,
          reason: `${matches.length} matching records`,
        });
      } else if (matches[0].kind !== 'exact') {
        failures.push({
          file: path.relative(process.cwd(), filePath),
          identifier,
          reason: 'identifier did not resolve exactly',
        });
      }
    }
  }
}

if (failures.length > 0) {
  console.error(
    '\nAPS-REF identifier audit failed.\n',
  );

  let currentFile = '';

  for (const failure of failures) {
    if (failure.file !== currentFile) {
      currentFile = failure.file;
      console.error(`  ${currentFile}`);
    }

    console.error(
      `    -> ${failure.identifier}: ${failure.reason}`,
    );
  }

  console.error(
    `\n${failures.length} failure(s) across ` +
      `${examinedFiles} content file(s).`,
  );

  process.exit(1);
}

console.log(
  `APS-REF identifier audit passed: ` +
    `${examinedIdentifiers} identifier(s) across ` +
    `${examinedFiles} content file(s).`,
);