import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as yaml from 'js-yaml';

export type ReferenceRecord = Record<string, unknown>;

export type RetrievalQuery = {
  id?: string;
  doi?: string;
  title?: string;
  author?: string;
  year?: number;
};

export type MatchKind = 'exact' | 'candidate';

export type RetrievalMatch = {
  kind: MatchKind;
  reasons: string[];
  record: ReferenceRecord;
};

export type LoadedReferenceLibrary = {
  absolutePath: string;
  references: ReferenceRecord[];
};

function isRecord(value: unknown): value is ReferenceRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

export function normalizeText(value: unknown): string {
  return asString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeDoi(value: unknown): string {
  return asString(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//, '')
    .replace(/^doi:\s*/, '')
    .replace(/[\s.]+$/, '');
}

function tokenSimilarity(left: string, right: string): number {
  const leftTokens = new Set(left.split(' ').filter(Boolean));
  const rightTokens = new Set(right.split(' ').filter(Boolean));

  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }

  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

export function loadReferenceLibrary(libraryPath: string): LoadedReferenceLibrary {
  const absolutePath = path.resolve(process.cwd(), libraryPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Reference library not found: ${absolutePath}`);
  }

  const source = fs.readFileSync(absolutePath, 'utf8');
  const parsed = yaml.load(source) as unknown;

  if (Array.isArray(parsed)) {
    return {
      absolutePath,
      references: parsed.filter(isRecord),
    };
  }

  if (isRecord(parsed) && Array.isArray(parsed.references)) {
    return {
      absolutePath,
      references: parsed.references.filter(isRecord),
    };
  }

  throw new Error('Unsupported YAML structure. Expected an array or a top-level "references" array.');
}

export function evaluateReference(
  record: ReferenceRecord,
  query: RetrievalQuery,
): RetrievalMatch | null {
  const reasons: string[] = [];
  let exact = true;

  if (query.id) {
    const requestedId = normalizeText(query.id);
    const recordId = normalizeText(record.id);
    if (recordId !== requestedId) return null;
    reasons.push('exact APS identifier');
  }

  if (query.doi) {
    const requestedDoi = normalizeDoi(query.doi);
    const recordDoi = normalizeDoi(record.doi);
    if (!recordDoi || recordDoi !== requestedDoi) return null;
    reasons.push('exact DOI');
  }

  if (query.year !== undefined) {
    const recordYear = Number(record.year);
    if (recordYear !== query.year) return null;
    reasons.push('publication year');
  }

  if (query.title) {
    const requestedTitle = normalizeText(query.title);
    const recordTitle = normalizeText(record.title);

    if (!recordTitle) return null;

    if (recordTitle === requestedTitle) {
      reasons.push('exact normalised title');
    } else {
      const similarity = tokenSimilarity(requestedTitle, recordTitle);
      const contains = recordTitle.includes(requestedTitle) || requestedTitle.includes(recordTitle);

      if (!contains && similarity < 0.6) return null;

      exact = false;
      reasons.push(`candidate title (${Math.round(similarity * 100)}% token similarity)`);
    }
  }

  if (query.author) {
    const requestedAuthor = normalizeText(query.author);
    const authorText = normalizeText(record.authors ?? record.editors);

    if (!authorText || !authorText.includes(requestedAuthor)) return null;

    if (authorText === requestedAuthor) {
      reasons.push('exact normalised author field');
    } else {
      exact = false;
      reasons.push('candidate author match');
    }
  }

  return {
    kind: exact ? 'exact' : 'candidate',
    reasons,
    record,
  };
}

export function retrieveReferences(
  references: ReferenceRecord[],
  query: RetrievalQuery,
): RetrievalMatch[] {
  return references
    .map((record) => evaluateReference(record, query))
    .filter((match): match is RetrievalMatch => match !== null)
    .sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === 'exact' ? -1 : 1;
      return asString(left.record.id).localeCompare(asString(right.record.id));
    });
}

export type ReferenceInput = string | ReferenceRecord;

function getReferenceId(record: ReferenceRecord): string {
  return asString(record.id).trim();
}

export function resolveReferenceInputs(
  inputs: ReferenceInput[],
  libraryPath = 'src/data/aps-canonical-references.yaml',
): ReferenceRecord[] {
  if (inputs.length === 0) return [];

  const { references } = loadReferenceLibrary(libraryPath);

  const referencesById = new Map<string, ReferenceRecord>();

  for (const record of references) {
    const id = getReferenceId(record);

    if (!id) {
      throw new Error(
        'APS-REF library contains a reference record without an id.',
      );
    }

    if (referencesById.has(id)) {
      throw new Error(
        `Duplicate APS-REF identifier in Master Knowledgebase: ${id}`,
      );
    }

    referencesById.set(id, record);
  }

  const requestedIds = inputs
    .filter((input): input is string => typeof input === 'string')
    .map((id) => id.trim());

  const duplicateRequestedIds = requestedIds.filter(
    (id, index) => requestedIds.indexOf(id) !== index,
  );

  if (duplicateRequestedIds.length > 0) {
    throw new Error(
      `Duplicate APS-REF identifiers in article frontmatter: ${
        [...new Set(duplicateRequestedIds)].join(', ')
      }`,
    );
  }

  return inputs.map((input) => {
    // Legacy expanded record: retain during migration.
    if (isRecord(input)) {
      return input;
    }

    const id = input.trim();

    if (!id) {
      throw new Error(
        'Article frontmatter contains an empty APS-REF identifier.',
      );
    }

    const resolved = referencesById.get(id);

    if (!resolved) {
      throw new Error(
        `Unresolved APS-REF identifier in article frontmatter: ${id}`,
      );
    }

    return resolved;
  });
}