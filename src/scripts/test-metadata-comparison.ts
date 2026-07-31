import {
  loadReferenceLibrary,
  retrieveReferences,
} from '../lib/references/retrieval.js';

import {
  reconcileReference,
  type FieldComparison,
  type ProposedReference,
} from '../lib/references/reconciliation.js';

const LIBRARY_PATH = 'src/data/aps-canonical-references.yaml';

function findComparison(
  comparisons: FieldComparison[],
  field: string,
): FieldComparison {
  const comparison = comparisons.find(
    (item) => item.field === field,
  );

  if (!comparison) {
    throw new Error(`No comparison was produced for field: ${field}.`);
  }

  return comparison;
}

function main(): void {
  const proposedReference: ProposedReference = {
    authors: 'Montevil, M., & Mossio, M.',
    year: '2015',
    title: 'Biological Organisation as Closure of Constraints',
    journal: 'Journal of Theoretical Biology',
    volume: 372,
    issue: '4',
    pages: '179-191',
    doi: 'https://doi.org/10.1016/j.jtbi.2015.02.029',
    publisher: 'Elsevier',
  };

  const library = loadReferenceLibrary(LIBRARY_PATH);

  const retrievalResults = retrieveReferences(library.references, {
    doi: proposedReference.doi,
  });

  const result = reconcileReference(
    proposedReference,
    retrievalResults,
  );

  const authors = findComparison(
    result.fieldComparisons,
    'authors',
  );

  const year = findComparison(
    result.fieldComparisons,
    'year',
  );

  const issue = findComparison(
    result.fieldComparisons,
    'issue',
  );

  const pages = findComparison(
    result.fieldComparisons,
    'pages',
  );

  const doi = findComparison(
    result.fieldComparisons,
    'doi',
  );

  const publisher = findComparison(
    result.fieldComparisons,
    'publisher',
  );

  console.log('APS-REF Metadata Difference Reporting Test');
  console.log(`Library: ${library.absolutePath}`);
  console.log(`Records examined: ${library.references.length}`);
  console.log(`Retrieval matches: ${retrievalResults.length}`);
  console.log(`Classification: ${result.classification}`);
  console.log(`Decision: ${result.decision}`);
  console.log(`Comparisons produced: ${result.fieldComparisons.length}`);
  console.log(`Authors: ${authors.status}`);
  console.log(`Year: ${year.status}`);
  console.log(`Issue: ${issue.status}`);
  console.log(`Pages: ${pages.status}`);
  console.log(`DOI: ${doi.status}`);
  console.log(`Publisher: ${publisher.status}`);

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

  if (authors.status !== 'normalised-equal') {
    throw new Error(
      `Expected authors to be normalised-equal, but received ${authors.status}.`,
    );
  }

  if (year.status !== 'normalised-equal') {
    throw new Error(
      `Expected year to be normalised-equal, but received ${year.status}.`,
    );
  }

  if (issue.status !== 'proposed-only') {
    throw new Error(
      `Expected issue to be proposed-only, but received ${issue.status}.`,
    );
  }

  if (pages.status !== 'normalised-equal') {
    throw new Error(
      `Expected pages to be normalised-equal, but received ${pages.status}.`,
    );
  }

  if (doi.status !== 'normalised-equal') {
    throw new Error(
      `Expected DOI to be normalised-equal, but received ${doi.status}.`,
    );
  }

  if (publisher.status !== 'proposed-only') {
    throw new Error(
      `Expected publisher to be proposed-only, but received ${publisher.status}.`,
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