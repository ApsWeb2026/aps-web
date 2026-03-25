# Content Authoring Guide

This guide explains how to create and edit content on the APS Publishing Platform.

## Two Ways to Edit Content

### 1. Decap CMS (Recommended for Authors)

Access the CMS at: `https://your-site.netlify.app/admin/`

1. Log in with your Netlify Identity credentials
2. Select a collection (e.g. Glossary Entries, Articles)
3. Click "New" to create or select an existing entry to edit
4. Fill in the frontmatter fields and write content in the body editor
5. Save as Draft or Publish

The CMS writes Markdown files directly to the Git repository via Git Gateway.

### 2. Direct Markdown Editing

Content lives in `src/content/{collection}/` as `.md` files. Each file has YAML frontmatter followed by Markdown body content.

## Content Types and Required Fields

### Glossary Entry

```yaml
---
title: "Term Name"
slug: "term-name"
definition: "One-paragraph formal definition"
inBrief: "One-sentence plain-language summary"
status: "draft"          # draft | evolving | canonical
canonical: false
canonicalLockDate: ""     # YYYY-MM-DD (required if canonical: true)
revised: "2026-03-25"    # YYYY-MM-DD (update on every edit)
cluster: "foundations"    # See cluster slugs below
seeAlso:                 # Optional: related glossary slugs
  - "related-term"
references: []           # Optional: structured references
---

Body content here (extended discussion, examples, context).
```

### Article

```yaml
---
title: "Article Title"
slug: "article-slug"
abstract: "Brief summary of the article"
status: "draft"
canonical: false
canonicalLockDate: ""
revised: "2026-03-25"
cluster: "foundations"
keyPoints:               # Optional
  - "First key point"
  - "Second key point"
relatedGlossaryTerms:   # Optional: glossary slugs
  - "agency"
  - "process"
relatedArticles:         # Optional: article slugs
  - "another-article-slug"
researchStreams:          # Optional: stream slugs
  - "cognition"
references: []
---

Article body content.
```

### Research Stream

```yaml
---
title: "Stream Title"
slug: "stream-slug"
overview: "Brief overview of this research stream"
status: "draft"
revised: "2026-03-25"
cluster: "foundations"
associatedGlossaryTerms:  # Optional
  - "related-term"
---

Stream body content.
```

### Orientation Page

```yaml
---
title: "Page Title"
slug: "page-slug"
status: "evolving"
canonical: false
canonicalLockDate: ""
revised: "2026-03-25"
---

Orientation page body content.
```

### APS Box

```yaml
---
title: "Box Title"
slug: "box-slug"
status: "draft"
canonical: false
canonicalLockDate: ""
revised: "2026-03-25"
seeAlso:                 # Optional: glossary slugs
  - "term-slug"
associatedPages:         # Optional: page paths
  - "/glossary/function/"
---

Box body content.
```

### Diagram

```yaml
---
title: "Diagram Title"
slug: "diagram-slug"
svgFile: "/assets/diagram-name.svg"
caption: "Short caption"
description: "Accessible description of the diagram"
status: "draft"
revised: "2026-03-25"
figureNumber: "1"        # Optional
crossReferences:         # Optional: page paths
  - "/articles/related-article/"
---

Diagram description and discussion.
```

## Cluster Slugs

Use these exact values for the `cluster` field:

| Cluster | Slug |
|---------|------|
| Foundations of Life | `foundations` |
| Definition & Borderlines | `definition-borderlines` |
| Cognition & Mind | `cognition-mind` |
| Empirical Interface | `empirical-interface` |
| Scale, Time, and Organisation | `scaling-complexity` |
| Historical & Philosophical Context | `historical-context` |
| Conceptual Foundations & Explanatory Grammar | `conceptual-foundations` |

## Slug Rules

- Lowercase letters, numbers, and hyphens only
- Pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Examples: `biological-agency`, `scale-time-persistence`, `what-is-aps`
- Slugs must be unique within each collection

## Cross-References

### Glossary See Also

The `seeAlso` field on glossary entries accepts slugs of other glossary entries. These render as linked tags below the entry.

### Related Glossary Terms (Articles)

The `relatedGlossaryTerms` field on articles accepts glossary slugs. These render as a "See Also" section linking to the referenced glossary pages.

### Related Articles

The `relatedArticles` field on articles accepts other article slugs. These auto-resolve to titled links in a "Related Articles" section. This behaves like the glossary See Also feature.

### Research Streams

The `researchStreams` field on articles is a list of stream slugs. Articles appear automatically on the corresponding stream hub pages.

### Referenced By (Auto-generated)

Glossary pages automatically display a "Referenced by" section showing all articles that include that term in their `relatedGlossaryTerms`.

## Internal Links in Body Content

Use standard Markdown links with full paths:

```markdown
See [Agency](/glossary/agency/) for the formal definition.
This builds on [Scale, Time, and Persistence](/articles/scale-time-persistence/).
```

All internal links are validated at build time. Broken links will cause the build to fail.

## Revised Date

Always update the `revised` field when editing content. Format: `YYYY-MM-DD`.

For canonical pages, failing to update the revised date when content changes will cause a build failure (canonical lock violation).

## References

Structured references follow author-date format:

```yaml
references:
  - id: "thompson-2007"
    authors: "Thompson, E."
    year: 2007
    title: "Mind in Life"
    publisher: "Harvard University Press"
```

In body text, cite as `(Thompson 2007)` and the reference block renders automatically at the bottom of the page.
