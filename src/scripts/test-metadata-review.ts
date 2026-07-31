import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadReferenceLibrary,
  retrieveReferences,
} from '../lib/references/retrieval';

import {
  reconcileReference,
  type ProposedReference,
} from '../lib/references/reconciliation';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const libraryPath = path.resolve(
  currentDirectory,
  '../data/aps-canonical-references.yaml',
);

const proposedReference: ProposedReference = {
  title: 'Closure of constraints in biological organisation',
  authors: 'Montevil, M.; Mossio, M.',
  year: '2015',
  journal: 'Journal of Theoretical Biology',
  volume: '372',
  issue: '1',
  pages: '179-191',
  publisher: 'Elsevier',
  doi: 'https://doi.org/10.1016/j.jtbi.2015.02.029',
};

const library = loadReferenceLibrary(libraryPath);

const retrievalResults = retrieveReferences(
  library.references,
  {
    doi: proposedReference.doi,
  },
);

const result = reconcileReference(
  proposedReference,
  retrievalResults,
);

const reviewRequired =
  result.classification === 'metadata-update-candidate' &&
  result.decision === 'REVIEW_METADATA_UPDATE';

const passed =
  reviewRequired &&
  result.fieldComparisons.some(
    (comparison) =>
      comparison.field === 'issue' &&
      comparison.status === 'proposed-only',
  ) &&
  result.fieldComparisons.some(
    (comparison) =>
      comparison.field === 'publisher' &&
      comparison.status === 'proposed-only',
  );

console.log('APS-REF Metadata Review Classification Test');
console.log(`Library: ${libraryPath}`);
console.log(`Records examined: ${library.references.length}`);
console.log(`Retrieval matches: ${retrievalResults.length}`);
console.log(`Classification: ${result.classification}`);
console.log(`Decision: ${result.decision}`);
console.log(`Review required: ${reviewRequired}`);
console.log(`Result: ${passed ? 'PASS' : 'FAIL'}`);

if (!passed) {
  process.exitCode = 1;
}