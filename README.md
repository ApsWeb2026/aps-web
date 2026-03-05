# APS Publishing Platform

Structured academic research publishing platform built on the Agency–Process–Scale (APS) framework.

## Stack

- Astro + TypeScript
- Decap CMS (Git-backed)
- Pagefind (search)
- Netlify (hosting)

## Development

```bash
npm install
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
```

## Project Structure

```
src/
├── components/   # Astro components (Header, Footer)
├── content/      # Markdown content collections
│   ├── articles/
│   ├── boxes/
│   ├── diagrams/
│   ├── glossary/
│   ├── orientation/
│   └── streams/
├── layouts/      # Page layouts
├── pages/        # Route pages
├── scripts/      # Client-side scripts
└── styles/       # Global CSS
```
