import {
  loadReferenceLibrary,
  retrieveReferences,
} from '../lib/references/retrieval.js';

import {
  reconcileReference,
  type ProposedReference,
} from '../lib/references/reconciliation.js';

const LIBRARY_PATH = 'src/data/aps-canonical-references.yaml';

function main(): void {
  const proposedReference: ProposedReference = {
    authors: 'Montévil, M., & Mossio, M.',
    year: 2015,
    title: 'Biological Organisation as Closure of Constraints',
    doi: 'https://doi.org/10.1016/j.jtbi.2015.02.029',
  };

  const library = loadReferenceLibrary(LIBRARY_PATH);

  const retrievalResults = retrieveReferences(library.references, {
    doi: proposedReference.doi,
  });

  const result = reconcileReference(
    proposedReference,
    retrievalResults,
  );

  console.log('APS-REF Exact DOI Reconciliation Test');
  console.log(`Library: ${library.absolutePath}`);
  console.log(`Records examined: ${library.references.length}`);
  console.log(`Retrieval matches: ${retrievalResults.length}`);
  console.log(`Classification: ${result.classification}`);
  console.log(`Decision: ${result.decision}`);
  console.log(
    `Canonical ID: ${String(result.canonicalRecord?.id ?? '')}`,
  );
  console.log(
    `DOI comparison: ${result.fieldComparisons[0]?.status ?? 'missing'}`,
  );

  if (retrievalResults.length !== 1) {
    throw new Error(
      `Expected exactly 1 retrieval match, but found ${retrievalResults.length}.`,
    );
  }

  if (result.classification !== 'exact-match') {
    throw new Error(
      `Expected exact-match, but received ${result.classification}.`,
    );
  }

  if (result.decision !== 'USE_CANONICAL_RECORD') {
    throw new Error(
      `Expected USE_CANONICAL_RECORD, but received ${result.decision}.`,
    );
  }

  if (
    result.canonicalRecord?.id !==
    'montevil-mossio-2015-closure-constraints'
  ) {
    throw new Error(
      `Unexpected canonical record: ${String(result.canonicalRecord?.id)}`,
    );
  }

  if (result.fieldComparisons[0]?.status !== 'normalised-equal') {
    throw new Error(
      'Expected the DOI comparison to be normalised-equal.',
    );
  }

  console.log('Result: PASS');
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Result: FAIL — ${message}`);
  process.exitCode = 1;
}