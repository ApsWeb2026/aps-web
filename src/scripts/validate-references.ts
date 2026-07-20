import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import * as yaml from "js-yaml";

type Verification = {
  status?: string;
  authority?: string;
  verifiedDate?: string;
};

type ReferenceRecord = {
  id?: string;
  type?: string;
  authors?: string;
  editors?: string;
  year?: number;
  title?: string;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  repository?: string;
  identifier?: string;
  edition?: string;
  note?: string;
  "book-title"?: string;
  "article-number"?: string;
  verification?: Verification;
  [key: string]: unknown;
};

type ReferenceLibrary = {
  references?: ReferenceRecord[];
};

type DuplicateOccurrence = {
  value: string;
  recordNumbers: number[];
  recordIds: string[];
};

type JournalWarning = {
  id: string;
  missing: string[];
};

const PROJECT_ROOT = process.cwd();

const suppliedLibraryPath = process.argv[2];

const LIBRARY_PATH = suppliedLibraryPath
  ? path.resolve(PROJECT_ROOT, suppliedLibraryPath)
  : path.resolve(
      PROJECT_ROOT,
      "src/data/aps-canonical-references.yaml",
    );

const SCHEMA_PATH = path.resolve(
  PROJECT_ROOT,
  "src/data/aps-reference-schema.json",
);

function printHeading(title: string, underline = "-"): void {
  console.log(title);
  console.log(underline.repeat(title.length));
}

function fail(message: string, error?: unknown): never {
  console.error(`ERROR: ${message}`);

  if (error instanceof Error && error.message) {
    console.error(`Details: ${error.message}`);
  }

  process.exit(1);
}

function readTextFile(filePath: string, label: string): string {
  if (!fs.existsSync(filePath)) {
    fail(`${label} was not found at:\n${filePath}`);
  }

  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    fail(`Unable to read ${label}.`, error);
  }
}

function parseYamlLibrary(source: string): ReferenceLibrary {
  try {
    const parsed = yaml.load(source);

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      fail("The canonical YAML library did not parse as an object.");
    }

    return parsed as ReferenceLibrary;
  } catch (error) {
    fail("The canonical reference library contains invalid YAML.", error);
  }
}

function parseJsonSchema(source: string): object {
  try {
    const parsed: unknown = JSON.parse(source);

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      fail("The APS-REF schema did not parse as a JSON object.");
    }

    return parsed as object;
  } catch (error) {
    fail("The APS-REF schema contains invalid JSON.", error);
  }
}

function recordLabel(record: ReferenceRecord, index: number): string {
  return record.id?.trim() || `[record ${index + 1} without an id]`;
}

function normaliseDoi(doi: string): string {
  return doi
    .trim()
    .replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .trim()
    .toLowerCase();
}

function findDuplicateValues(
  records: ReferenceRecord[],
  getValue: (record: ReferenceRecord) => string | undefined,
  normalise: (value: string) => string = (value) => value.trim(),
): DuplicateOccurrence[] {
  const occurrences = new Map<
    string,
    {
      displayValue: string;
      recordNumbers: number[];
      recordIds: string[];
    }
  >();

  records.forEach((record, index) => {
    const rawValue = getValue(record);

    if (!rawValue || !rawValue.trim()) {
      return;
    }

    const comparisonValue = normalise(rawValue);

    if (!comparisonValue) {
      return;
    }

    const existing = occurrences.get(comparisonValue);

    if (existing) {
      existing.recordNumbers.push(index + 1);
      existing.recordIds.push(recordLabel(record, index));
      return;
    }

    occurrences.set(comparisonValue, {
      displayValue: rawValue.trim(),
      recordNumbers: [index + 1],
      recordIds: [recordLabel(record, index)],
    });
  });

  return [...occurrences.values()]
    .filter((entry) => entry.recordNumbers.length > 1)
    .map((entry) => ({
      value: entry.displayValue,
      recordNumbers: entry.recordNumbers,
      recordIds: entry.recordIds,
    }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

function findMissingAuthorities(records: ReferenceRecord[]): string[] {
  return records
    .map((record, index) => ({
      id: recordLabel(record, index),
      authority: record.verification?.authority,
    }))
    .filter(
      ({ authority }) =>
        typeof authority !== "string" || authority.trim().length === 0,
    )
    .map(({ id }) => id)
    .sort((a, b) => a.localeCompare(b));
}

function findJournalMetadataWarnings(
  records: ReferenceRecord[],
): JournalWarning[] {
  return records
    .map((record, index): JournalWarning | null => {
      if (record.type !== "journal-article") {
        return null;
      }

      const missing: string[] = [];

      if (!record.volume?.trim()) {
        missing.push("volume");
      }

      if (!record.issue?.trim()) {
        missing.push("issue");
      }

      if (
        !record.pages?.trim() &&
        !record["article-number"]?.trim()
      ) {
        missing.push("pages or article-number");
      }

      if (!record.doi?.trim()) {
        missing.push("doi");
      }

      if (missing.length === 0) {
        return null;
      }

      return {
        id: recordLabel(record, index),
        missing,
      };
    })
    .filter((warning): warning is JournalWarning => warning !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function formatSchemaError(error: ErrorObject): string {
  const location = error.instancePath || "/";

  if (error.keyword === "additionalProperties") {
    const property =
      typeof error.params.additionalProperty === "string"
        ? error.params.additionalProperty
        : "unknown";

    return `${location}: unexpected field "${property}"`;
  }

  if (error.keyword === "required") {
    const property =
      typeof error.params.missingProperty === "string"
        ? error.params.missingProperty
        : "unknown";

    return `${location}: missing required field "${property}"`;
  }

  return `${location}: ${error.message ?? error.keyword}`;
}

function main(): void {
  console.log();
  printHeading("APS-REF Validator", "=");
  console.log();
  console.log(
    `Library: ${path.relative(PROJECT_ROOT, LIBRARY_PATH)}`,
  );
  console.log(
    `Schema:  ${path.relative(PROJECT_ROOT, SCHEMA_PATH)}`,
  );
  console.log();
  if (suppliedLibraryPath) {
  console.log("Mode:    controlled fixture test");
  console.log();
}

  const librarySource = readTextFile(
    LIBRARY_PATH,
    "canonical reference library",
  );

  const schemaSource = readTextFile(
    SCHEMA_PATH,
    "APS-REF schema",
  );

  const library = parseYamlLibrary(librarySource);
  const schema = parseJsonSchema(schemaSource);

  if (!Array.isArray(library.references)) {
    fail(
      'The canonical library must contain a top-level "references" array.',
    );
  }

  const records = library.references;

  console.log(`Records examined: ${records.length}`);
  console.log();

  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    allowUnionTypes: true,
  });

  addFormats(ajv);

  let validate: ReturnType<typeof ajv.compile>;

  try {
    validate = ajv.compile(schema);
  } catch (error) {
    fail("The APS-REF JSON Schema could not be compiled.", error);
  }

  const schemaIsValid = validate(library);
  const schemaErrors = validate.errors ?? [];

  printHeading("Schema validation");

  if (schemaIsValid) {
    console.log("PASS");
  } else {
    console.log(`ERROR — ${schemaErrors.length} schema violation(s)`);

    for (const error of schemaErrors) {
      console.log(`  - ${formatSchemaError(error)}`);
    }
  }

  console.log();

  const duplicateIds = findDuplicateValues(
    records,
    (record) => record.id,
  );

  const duplicateDois = findDuplicateValues(
    records,
    (record) => record.doi,
    normaliseDoi,
  );

  printHeading("Canonical uniqueness");
  console.log(`Duplicate IDs:  ${duplicateIds.length}`);
  console.log(`Duplicate DOIs: ${duplicateDois.length}`);

  if (duplicateIds.length > 0) {
    console.log();
    console.log("Duplicate APS-REF identifiers:");

    for (const duplicate of duplicateIds) {
      console.log(`  - ${duplicate.value}`);
      console.log(
        `    Records: ${duplicate.recordNumbers.join(", ")}`,
      );
      console.log(
        `    IDs: ${duplicate.recordIds.join(", ")}`,
      );
    }
  }

  if (duplicateDois.length > 0) {
    console.log();
    console.log("Duplicate DOI values:");

    for (const duplicate of duplicateDois) {
      console.log(`  - ${duplicate.value}`);
      console.log(
        `    Records: ${duplicate.recordNumbers.join(", ")}`,
      );
      console.log(
        `    IDs: ${duplicate.recordIds.join(", ")}`,
      );
    }
  }

  console.log();

  const missingAuthorities = findMissingAuthorities(records);
  const journalWarnings = findJournalMetadataWarnings(records);

  printHeading("Governance warnings");
  console.log(
    `Missing verification authority: ${missingAuthorities.length}`,
  );
  console.log(
    `Journal metadata reviews:        ${journalWarnings.length}`,
  );

  if (missingAuthorities.length > 0) {
    console.log();
    console.log("Records missing verification authority:");

    for (const id of missingAuthorities) {
      console.log(`  - ${id}`);
    }
  }

  if (journalWarnings.length > 0) {
    console.log();
    console.log("Journal records requiring metadata review:");

    for (const warning of journalWarnings) {
      console.log(`  - ${warning.id}`);
      console.log(`    Review: ${warning.missing.join(", ")}`);
    }
  }

  const hasErrors =
    !schemaIsValid ||
    duplicateIds.length > 0 ||
    duplicateDois.length > 0;

  const hasWarnings =
    missingAuthorities.length > 0 ||
    journalWarnings.length > 0;

  console.log();
  printHeading("Final result");

  if (hasErrors) {
    console.log("FAIL");
    process.exitCode = 1;
    return;
  }

  if (hasWarnings) {
    console.log("PASS WITH WARNINGS");
    process.exitCode = 0;
    return;
  }

  console.log("PASS");
  process.exitCode = 0;
}

try {
  main();
} catch (error) {
  fail("The validator encountered an unexpected runtime failure.", error);
}