# APS_CONTENT_STANDARD.md
**Authoring Standards for APS Content (Glossary, Articles, Boxes)**

---

## 1. Purpose

This document defines the **required structure and formatting rules** for all APS content.

It ensures:

- Consistency across glossary, articles, and boxes  
- Compatibility with CMS and build validation  
- Alignment with APS conceptual grammar  

> No content should be added to the site unless it conforms to these standards.

---

## 2. General Principles

All APS content must:

- Use **Markdown only** (no HTML or styling commands)  
- Avoid unnecessary visual elements (e.g. dividers `---` in body text)  
- Follow **fixed structural templates**  
- Use **clear, consistent terminology aligned with APS glossary**  
- Avoid hierarchical language (e.g. “higher/lower levels”)  

---

## 3. Glossary Entries (Canonical Format)

### 3.1 Frontmatter (Required)

    ---
    title: [Term]
    slug: [kebab-case slug]
    definition: "[Single-sentence formal definition]"
    inBrief: "[Single-sentence simplified definition]"
    status: canonical
    cluster: [cluster-name]
    revised: YYYY-MM-DD
    seeAlso:
      - slug-1
      - slug-2
    ---

### 3.2 Body Structure (Required)

    ## Conventional framing

    [Standard biological interpretation]

    ## APS reframing

    [APS reinterpretation]

    ## Key Point

    [Single-sentence summary]

### 3.3 Rules

- No dividers (`---`) in the body  
- No `cf.` lists  
- All cross-references must be in `seeAlso` (slug-based)  
- Definitions must be precise, non-redundant, and APS-aligned  

---

## 4. Articles (Canonical Format)

### 4.1 Frontmatter (Required)

    ---
    title: [Full title]
    slug: [kebab-case slug]
    status: canonical
    canonical: true
    canonicalLockDate: YYYY-MM-DD
    revised: YYYY-MM-DD
    cluster: [cluster-name]
    abstract: |
      [Short paragraph summary]
    keyPoints:
      - [Point 1]
      - [Point 2]
    relatedGlossaryTerms:
      - slug-1
      - slug-2
    ---

### 4.2 Body Structure (Standard)

    ## Introduction

    ## Core Argument

    ## Implications

    ## Key Point

### 4.3 Rules

- No dividers (`---`) in body text  
- Use glossary terms consistently  
- Avoid duplication of glossary definitions  
- Ensure conceptual alignment with APS explanatory grammar  
- Boxes should be used sparingly and only where necessary  

---

## 5. Boxes (APS Box Format)

### 5.1 Frontmatter (Required)

    ---
    title: APS Box — [Title]
    slug: [kebab-case slug]
    status: canonical
    canonical: true
    canonicalLockDate: YYYY-MM-DD
    revised: YYYY-MM-DD
    associatedPages: []
    ---

### 5.2 Body Structure

    [Short explanatory paragraph]

    **Key Point:** [Single-sentence insight]

### 5.3 Rules

- Boxes are reusable conceptual clarifications, not general content  
- Only create a new box if it applies across multiple articles  
- Avoid proliferation (target ~8–10 core boxes)  

Insert using:

    [[box:slug]]

---

## 6. Slugs and Naming

- Use kebab-case (e.g. `biological-agency`)  
- Slugs must be:
  - unique  
  - stable (do not change once canonical)  

Titles must be:

- human-readable  
- consistent with glossary terminology  

---

## 7. Cross-Linking Rules

- Glossary → uses `seeAlso` (slug list)  
- Articles → use `relatedGlossaryTerms`  
- Do not manually create inline slug references in prose  
- All links must resolve under build validation  

---

## 8. Language Discipline

All content must:

- Avoid hierarchical framing (e.g. “higher/lower levels”)  
- Avoid reductionist phrasing (e.g. gene-centric causation)  
- Avoid external teleology  

Use APS-consistent terms:

- viability  
- constraint closure  
- organisation  
- agency  
- normativity  

---

## 9. Pre-Insert Checklist

Before committing any content:

- Frontmatter complete and valid  
- Slugs correct and unique  
- No dividers in body  
- Headings follow template  
- Cross-links use correct slugs  
- Content aligns with APS glossary and guardrails  

---

## 10. Summary

APS content must be:

- Structurally consistent  
- Conceptually aligned  
- Systematically linked  

> APS is a structured explanatory framework. Its content must reflect that structure.
