# Governance & Canonical Lock Process

This document describes the content governance model for the APS Publishing Platform.

## Status Workflow

Every content page follows this lifecycle:

```
Draft  →  Evolving  →  Canonical
```

| Status | Meaning | Editable? |
|--------|---------|-----------|
| Draft | Work in progress, not yet reviewed | Freely editable |
| Evolving | Published and visible, subject to revision | Freely editable |
| Canonical | Formally locked as authoritative | Protected (see below) |

## Canonical Lock

When a page reaches canonical status, it is protected by the canonical lock system.

### How It Works

1. Set `canonical: true` and `canonicalLockDate: YYYY-MM-DD` in the page frontmatter
2. Set `status: canonical`
3. On the next build, the canonical lock checker (`check-canonical-lock.ts`) hashes the page content and stores it in `.content-hashes.json`
4. On every subsequent build, the checker compares the current content hash against the stored hash
5. If the content has changed but the `revised` date has NOT been updated, the build fails

### What Is Protected

The lock covers:
- Frontmatter fields: `title`, `definition`, `inBrief`, `abstract`, `overview`
- Body content: Everything after the frontmatter block

The lock does NOT cover metadata-only fields like `seeAlso`, `relatedGlossaryTerms`, `references`, or `cluster`.

### How to Update Canonical Content

To make a legitimate revision to canonical content:

1. Edit the content as needed
2. Update the `revised` field to today's date (YYYY-MM-DD)
3. Commit and push — the lock checker will accept the change and store the new hash

The lock banner on the published page will show both the original lock date and the new revision date.

### Lock Violations

If a build fails with a canonical lock error:

```
Canonical lock violation: articles/some-article
  Content changed but revised date was not updated.
  Stored revised: 2026-02-01 | Current revised: 2026-02-01
```

Fix: Update the `revised` date in the frontmatter to the current date, then rebuild.

### Hash Registry

The file `.content-hashes.json` at the project root stores all canonical hashes. This file is committed to the repository and should not be manually edited. It is automatically updated when canonical content is legitimately revised.

Format:
```json
{
  "articles/slug-name": {
    "hash": "a1b2c3d4e5f67890",
    "revised": "2026-03-25",
    "lockedSince": "2026-02-01"
  }
}
```

## Build-Time Validation

Three checks run automatically before every build (via `prebuild`):

### 1. Content Lint (`content-lint.ts`)

- Missing `slug` field
- Duplicate slugs within a collection
- Missing `revised` date on content types that require it
- Canonical pages missing `canonicalLockDate`
- Invalid glossary term references in `relatedGlossaryTerms`
- Invalid article references in `relatedArticles`
- Invalid glossary term references in `associatedGlossaryTerms` (streams)

### 2. Link Check (`check-links.ts`)

- Validates all internal Markdown links (`[text](/section/slug/)`) resolve to existing content
- Checks both the section and slug exist
- Supports articles, glossary, streams, orientation, diagrams, boxes, and clusters

### 3. Canonical Lock (`check-canonical-lock.ts`)

- Compares content hashes for all canonical pages
- Fails if content changed without updating the `revised` date
- Auto-updates stored hashes when revisions are legitimate

## Running Checks Manually

```bash
npm run lint:content      # Content lint only
npm run check:links       # Link checker only
npm run check:canonical   # Canonical lock only
npm run build             # Full build (runs all checks)
```

All checks exit with code 1 on failure, which prevents the Netlify deploy from proceeding.
