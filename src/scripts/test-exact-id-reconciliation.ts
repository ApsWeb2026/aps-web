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
    id: 'montevil-mossio-2015-closure-constraints',
  };

  const library = loadReferenceLibrary(LIBRARY_PATH);

  const retrievalResults = retrieveReferences(library.references, {
    id: proposedReference.id,
  });

  const result = reconcileReference(
    proposedReference,
    retrievalResults,
  );

  console.log('APS-REF Exact APS-ID Reconciliation Test');
  console.log(`Library: ${library.absolutePath}`);
  console.log(`Records examined: ${library.references.length}`);
  console.log(`Retrieval matches: ${retrievalResults.length}`);
  console.log(`Classification: ${result.classification}`);
  console.log(`Decision: ${result.decision}`);
  console.log(
    `Canonical ID: ${String(result.canonicalRecord?.id ?? '')}`,
  );
  console.log(
    `ID comparison: ${result.fieldComparisons[0]?.status ?? 'missing'}`,
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

  if (result.fieldComparisons[0]?.status !== 'equal') {
    throw new Error(
      'Expected the APS-ID comparison to be equal.',
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