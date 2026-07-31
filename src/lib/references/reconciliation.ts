import {
  normalizeDoi,
  type ReferenceRecord,
  type RetrievalMatch,
} from './retrieval.js';

/**
 * A proposed reference supplied for comparison with the APS Canonical
 * Reference Library.
 *
 * The proposal may be incomplete because incomplete records must also be
 * classified by the reconciliation process.
 */
export interface ProposedReference {
  id?: string;
  type?: string;
  authors?: string;
  year?: number | string;
  title?: string;
  journal?: string;
  bookTitle?: string;
  publisher?: string;
  volume?: number | string;
  issue?: number | string;
  pages?: string;
  doi?: string;
  url?: string;
  [key: string]: unknown;
}

/**
 * Stable machine-readable decisions produced by the Reconciliation Engine.
 */
export type ReconciliationDecision =
  | 'USE_CANONICAL_RECORD'
  | 'REVIEW_METADATA_UPDATE'
  | 'REVIEW_POSSIBLE_DUPLICATE'
  | 'AUTHENTICATE_NEW_REFERENCE'
  | 'REQUEST_MORE_METADATA';

/**
 * Higher-level classification used in human-readable reports.
 */
export type ReconciliationClassification =
  | 'exact-match'
  | 'metadata-update-candidate'
  | 'probable-duplicate'
  | 'new-reference-candidate'
  | 'insufficient-evidence';

/**
 * Comparison of one proposed field with the corresponding canonical field.
 */
export interface FieldComparison {
  field: string;
  proposedValue: unknown;
  canonicalValue: unknown;
  status:
    | 'equal'
    | 'normalised-equal'
    | 'proposed-only'
    | 'canonical-only'
    | 'different';
}

/**
 * Complete read-only result returned by the Reconciliation Engine.
 */
export interface ReconciliationResult {
  classification: ReconciliationClassification;
  decision: ReconciliationDecision;
  proposedReference: ProposedReference;
  canonicalRecord?: ReferenceRecord;
  retrievalResult?: RetrievalMatch;
  fieldComparisons: FieldComparison[];
  reasons: string[];
  warnings: string[];
}

/**
 * Options controlling reconciliation behaviour.
 *
 * Thresholds are defined now so that later implementation does not hide
 * decision rules inside individual functions.
 */
export interface ReconciliationOptions {
  probableDuplicateTitleThreshold: number;
  minimumEvidenceFields: number;
}

/**
 * Initial conservative defaults.
 *
 * These may be revised only after controlled fixture testing.
 */
export const DEFAULT_RECONCILIATION_OPTIONS: ReconciliationOptions = {
  probableDuplicateTitleThreshold: 0.85,
  minimumEvidenceFields: 2,
};

/**
 * Exhaustive decision vocabulary used by validation tests and reporting.
 */
export const RECONCILIATION_DECISIONS: readonly ReconciliationDecision[] = [
  'USE_CANONICAL_RECORD',
  'REVIEW_METADATA_UPDATE',
  'REVIEW_POSSIBLE_DUPLICATE',
  'AUTHENTICATE_NEW_REFERENCE',
  'REQUEST_MORE_METADATA',
] as const;

/**
 * Reference fields included in reconciliation reports.
 *
 * Verification metadata is intentionally excluded at this stage because it is
 * governed by the separate APS-REF authentication process.
 */
const COMPARABLE_REFERENCE_FIELDS = [
  'id',
  'type',
  'authors',
  'year',
  'title',
  'journal',
  'bookTitle',
  'publisher',
  'volume',
  'issue',
  'pages',
  'doi',
  'url',
] as const;

const REVIEWABLE_METADATA_FIELDS = [
  'title',
  'authors',
  'year',
  'journal',
  'bookTitle',
  'publisher',
  'volume',
  'issue',
  'pages',
  'doi',
  'url',
] as const;

type ComparableReferenceField =
  (typeof COMPARABLE_REFERENCE_FIELDS)[number];

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  return true;
}

function normaliseComparisonValue(
  field: ComparableReferenceField,
  value: unknown,
): string {
  if (!hasValue(value)) {
    return '';
  }

  if (field === 'doi') {
    return normalizeDoi(value);
  }

  return String(value)
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ');
}

function compareField(
  field: ComparableReferenceField,
  proposedValue: unknown,
  canonicalValue: unknown,
): FieldComparison {
  const proposedHasValue = hasValue(proposedValue);
  const canonicalHasValue = hasValue(canonicalValue);

  if (proposedHasValue && !canonicalHasValue) {
    return {
      field,
      proposedValue,
      canonicalValue,
      status: 'proposed-only',
    };
  }

  if (!proposedHasValue && canonicalHasValue) {
    return {
      field,
      proposedValue,
      canonicalValue,
      status: 'canonical-only',
    };
  }

  if (!proposedHasValue && !canonicalHasValue) {
    return {
      field,
      proposedValue,
      canonicalValue,
      status: 'equal',
    };
  }

  if (proposedValue === canonicalValue) {
    return {
      field,
      proposedValue,
      canonicalValue,
      status: 'equal',
    };
  }

  const normalisedProposed = normaliseComparisonValue(
    field,
    proposedValue,
  );

  const normalisedCanonical = normaliseComparisonValue(
    field,
    canonicalValue,
  );

  return {
    field,
    proposedValue,
    canonicalValue,
    status:
      normalisedProposed === normalisedCanonical
        ? 'normalised-equal'
        : 'different',
  };
}

export function compareReferenceMetadata(
  proposedReference: ProposedReference,
  canonicalRecord: ReferenceRecord,
): FieldComparison[] {
  return COMPARABLE_REFERENCE_FIELDS.map((field) =>
    compareField(
      field,
      proposedReference[field],
      canonicalRecord[field],
    ),
  );
}

function requiresMetadataReview(
  comparisons: FieldComparison[],
): boolean {
  return comparisons.some(
    (comparison) =>
      REVIEWABLE_METADATA_FIELDS.includes(
        comparison.field as (typeof REVIEWABLE_METADATA_FIELDS)[number],
      ) &&
      (
        comparison.status === 'proposed-only' ||
        comparison.status === 'canonical-only' ||
        comparison.status === 'different'
      ),
  );
}

/**
 * Placeholder entry point.
 *
 * Reconciliation logic will be introduced incrementally from Checkpoint 2.2.
 */
export function reconcileReference(
  proposedReference: ProposedReference,
  retrievalResults: RetrievalMatch[],
  options: ReconciliationOptions = DEFAULT_RECONCILIATION_OPTIONS,
): ReconciliationResult {
  void options;

  const proposedId =
    typeof proposedReference.id === 'string'
      ? proposedReference.id.trim()
      : '';

  if (proposedId) {
    const exactIdMatch = retrievalResults.find((retrievalResult) => {
      const canonicalId =
        typeof retrievalResult.record.id === 'string'
          ? retrievalResult.record.id.trim()
          : '';

      return canonicalId !== '' && canonicalId === proposedId;
    });

    if (exactIdMatch) {
      const fieldComparisons = compareReferenceMetadata(
        proposedReference,
        exactIdMatch.record,
      );

      const reviewRequired = requiresMetadataReview(fieldComparisons);

      return {
        classification: reviewRequired
          ? 'metadata-update-candidate'
          : 'exact-match',

        decision: reviewRequired
          ? 'REVIEW_METADATA_UPDATE'
          : 'USE_CANONICAL_RECORD',

        proposedReference,
        canonicalRecord: exactIdMatch.record,
        retrievalResult: exactIdMatch,
        fieldComparisons,
        reasons: [
          'The proposed APS identifier exactly matches a canonical identifier.',
        ],
        warnings: [],
      };
    }
  }

  const proposedDoi = normalizeDoi(proposedReference.doi);

  if (proposedDoi) {
    const exactDoiMatch = retrievalResults.find((retrievalResult) => {
      const canonicalDoi = normalizeDoi(retrievalResult.record.doi);

      return canonicalDoi !== '' && canonicalDoi === proposedDoi;
    });

    if (exactDoiMatch) {
      const fieldComparisons = compareReferenceMetadata(
        proposedReference,
        exactDoiMatch.record,
      );

      const reviewRequired = requiresMetadataReview(fieldComparisons);

      return {
        classification: reviewRequired
          ? 'metadata-update-candidate'
          : 'exact-match',

        decision: reviewRequired
          ? 'REVIEW_METADATA_UPDATE'
          : 'USE_CANONICAL_RECORD',

        proposedReference,
        canonicalRecord: exactDoiMatch.record,
        retrievalResult: exactDoiMatch,
        fieldComparisons,
        reasons: ['The proposed DOI exactly matches a canonical DOI.'],
        warnings: [],
      };
    }
  }

  return {
    classification: 'insufficient-evidence',
    decision: 'REQUEST_MORE_METADATA',
    proposedReference,
    fieldComparisons: [],
    reasons: ['No exact DOI reconciliation rule was satisfied.'],
    warnings: [
      'Only exact DOI reconciliation is implemented at Checkpoint 2.2.',
    ],
  };
}