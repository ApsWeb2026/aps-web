import {
  loadReferenceLibrary,
  retrieveReferences,
  type RetrievalQuery,
} from '../lib/references/retrieval.js';

const LIBRARY_PATH = 'src/data/aps-canonical-references.yaml';

function main(): void {
  const query: RetrievalQuery = {
    doi: '10.1016/j.jtbi.2015.02.029',
  };

  const library = loadReferenceLibrary(LIBRARY_PATH);
  const matches = retrieveReferences(library.references, query);

  console.log('APS-REF Module Import Test');
  console.log(`Library: ${library.absolutePath}`);
  console.log(`Records examined: ${library.references.length}`);
  console.log(`Matches found: ${matches.length}`);

  if (matches.length !== 1) {
    throw new Error(`Expected exactly 1 match, but found ${matches.length}.`);
  }

  const match = matches[0];

  if (match.kind !== 'exact') {
    throw new Error(`Expected an exact match, but received: ${match.kind}.`);
  }

  if (match.record.id !== 'montevil-mossio-2015-closure-constraints') {
    throw new Error(
      `Unexpected reference returned: ${String(match.record.id)}`,
    );
  }

  console.log(`Classification: ${match.kind}`);
  console.log(`Reference ID: ${String(match.record.id)}`);
  console.log(`Title: ${String(match.record.title)}`);
  console.log('Result: PASS');
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Result: FAIL — ${message}`);
  process.exitCode = 1;
}