# APS Publishing Platform

Structured academic research publishing platform for the Agency-Process-Scale (APS) framework. Built with Astro, backed by Decap CMS, and deployed on Netlify.

## Stack

- **Astro 5** + TypeScript (static site generator)
- **Decap CMS v3** (Git-backed content management via Git Gateway + Netlify Identity)
- **Pagefind** (client-side static search)
- **Netlify** (hosting, deploys, identity service)

## Quick Start

```bash
npm install
npm run dev          # Start dev server at localhost:4321
npm run build        # Full production build (runs lint + link checks first)
npm run preview      # Preview production build locally
```

## Project Structure

```
src/
├── components/       # Astro components (Header, Footer, Breadcrumb, etc.)
├── content/          # Markdown content collections
│   ├── articles/     # Research essays
│   ├── boxes/        # Reusable conceptual highlights
│   ├── diagrams/     # SVG-based diagram pages
│   ├── glossary/     # Canonical term definitions
│   ├── orientation/  # Foundational explainer pages
│   └── streams/      # Research stream hubs
├── layouts/          # BaseLayout (root HTML template)
├── pages/            # Route pages (Astro file-based routing)
├── scripts/          # Build-time scripts (lint, link check, canonical lock)
└── styles/           # Global CSS
public/
├── admin/            # Decap CMS (config.yml + index.html)
└── assets/           # Static assets (SVGs, images)
```

## Content Types

| Type | Description | Path |
|------|-------------|------|
| Glossary | Canonical term definitions (conceptual spine) | `/glossary/{slug}/` |
| Articles | Research essays developing the framework | `/articles/{slug}/` |
| Research Streams | Domain-specific research indices | `/streams/{slug}/` |
| Orientation | Foundational layer / how-to-read pages | `/orientation/{slug}/` |
| APS Boxes | Reusable conceptual callouts | `/boxes/{slug}/` |
| Diagrams | SVG-based explanatory diagrams | `/diagrams/{slug}/` |

## Knowledge Clusters

Content is organised into 7 non-hierarchical conceptual clusters:

1. **Foundations of Life** (`foundations`)
2. **Definition & Borderlines** (`definition-borderlines`)
3. **Cognition & Mind** (`cognition-mind`)
4. **Empirical Interface** (`empirical-interface`)
5. **Scale, Time, and Organisation** (`scaling-complexity`)
6. **Historical & Philosophical Context** (`historical-context`)
7. **Conceptual Foundations & Explanatory Grammar** (`conceptual-foundations`)

## Status System

Every content page has a status badge:

- **Draft** — Work in progress, not yet reviewed
- **Evolving** — Published but subject to revision
- **Canonical** — Formally locked; changes require governance process

## Build Pipeline

The build runs these checks automatically (via `prebuild`):

1. **Content lint** (`content-lint.ts`) — validates frontmatter conventions, duplicate slugs, broken glossary/article references
2. **Link check** (`check-links.ts`) — verifies all internal markdown links resolve to existing content
3. **Canonical lock** (`check-canonical-lock.ts`) — ensures canonical pages haven't been silently modified

If any check fails, the build exits with code 1.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build (with all checks) |
| `npm run preview` | Preview production build |
| `npm run lint:content` | Run content lint only |
| `npm run check:links` | Run link checker only |
| `npm run check:canonical` | Run canonical lock checker only |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without writing |

## Documentation

- [CONTENT_AUTHORING.md](CONTENT_AUTHORING.md) — How to add and edit content
- [GOVERNANCE.md](GOVERNANCE.md) — Canonical lock process and status workflows
- [CMS_SETUP.md](CMS_SETUP.md) — Decap CMS configuration and authentication
- [DEPLOYMENT.md](DEPLOYMENT.md) — Netlify deployment and build pipeline
- [OPERATIONS.md](OPERATIONS.md) — Day-to-day operations and troubleshooting
