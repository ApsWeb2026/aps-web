// Read-only APS-REF retrieval command-line utility.

import process from 'node:process';
import * as yaml from 'js-yaml';
import {
  loadReferenceLibrary,
  retrieveReferences,
  type RetrievalMatch,
  type RetrievalQuery,
} from '../lib/references/retrieval.js';

type CliOptions = RetrievalQuery & {
  libraryPath: string;
  help: boolean;
};

const DEFAULT_LIBRARY_PATH = 'src/data/aps-canonical-references.yaml';

function printHelp(): void {
  console.log(`APS-REF Reference Retrieval Engine\n\nUsage:\n  npx tsx src/scripts/retrieve-references.ts --doi <doi>\n  npx tsx src/scripts/retrieve-references.ts --id <aps-id>\n  npx tsx src/scripts/retrieve-references.ts --title \"<title>\"\n  npx tsx src/scripts/retrieve-references.ts --author \"<author>\"\n  npx tsx src/scripts/retrieve-references.ts --author \"<author>\" --year <year>\n\nOptions:\n  --id        Exact APS reference identifier\n  --doi       Exact DOI (https://doi.org/ prefix is accepted)\n  --title     Exact or candidate title search\n  --author    Candidate author search\n  --year      Optional publication-year filter\n  --library   Alternate library YAML path\n  --help      Show this help message\n\nThis tool is read-only and never modifies the Canonical Reference Library.`);
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    libraryPath: DEFAULT_LIBRARY_PATH,
    help: false,
  };

  const valueOptions = new Set(['--id', '--doi', '--title', '--author', '--year', '--library']);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }

    if (!valueOptions.has(argument)) {
      throw new Error(`Unknown option: ${argument}`);
    }

    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${argument}`);
    }

    index += 1;

    switch (argument) {
      case '--id':
        options.id = value;
        break;
      case '--doi':
        options.doi = value;
        break;
      case '--title':
        options.title = value;
        break;
      case '--author':
        options.author = value;
        break;
      case '--year': {
        const year = Number(value);
        if (!Number.isInteger(year) || year < 0) {
          throw new Error(`Invalid year: ${value}`);
        }
        options.year = year;
        break;
      }
      case '--library':
        options.libraryPath = value;
        break;
    }
  }

  if (!options.help && !options.id && !options.doi && !options.title && !options.author) {
    throw new Error('Provide at least one search option: --id, --doi, --title, or --author.');
  }

  return options;
}

function printResults(
  matches: RetrievalMatch[],
  absoluteLibraryPath: string,
  totalRecords: number,
): void {
  console.log('APS-REF Retrieval Report');
  console.log(`Library: ${absoluteLibraryPath}`);
  console.log(`Records examined: ${totalRecords}`);
  console.log(`Matches found: ${matches.length}\n`);

  if (matches.length === 0) {
    console.log('Result: No match found.');
    process.exitCode = 1;
    return;
  }

  matches.forEach((match, index) => {
    console.log(`Match ${index + 1}`);
    console.log(`Classification: ${match.kind === 'exact' ? 'Exact Match' : 'Candidate Match'}`);
    console.log(`Reasons: ${match.reasons.join('; ')}`);
    console.log(yaml.dump(match.record, { noRefs: true, lineWidth: 120, sortKeys: false }).trimEnd());
    if (index < matches.length - 1) console.log('\n---\n');
  });
}

function main(): void {
  try {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
      printHelp();
      return;
    }

    const library = loadReferenceLibrary(options.libraryPath);
    const matches = retrieveReferences(library.references, options);
    printResults(matches, library.absolutePath, library.references.length);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`APS-REF retrieval failed: ${message}`);
    process.exitCode = 2;
  }
}

main();