# Deployment Guide

The APS Publishing Platform deploys to Netlify via Git-triggered builds.

## How Deploys Work

1. A commit is pushed to the `main` branch (directly or via merged PR)
2. Netlify detects the push and starts a build
3. The build runs: `npm ci && npm run build`
4. If the build succeeds, the `dist/` folder is deployed
5. If any check fails (lint, links, canonical lock), the build exits with code 1 and the deploy is cancelled

## Build Pipeline

```
npm ci
  ↓
prebuild:
  ├── content-lint.ts        (frontmatter validation)
  ├── check-links.ts         (internal link validation)
  └── check-canonical-lock.ts (canonical page protection)
  ↓
astro build                  (static site generation)
  ↓
postbuild:
  ├── generate-redirects.ts  (Netlify _redirects file)
  └── pagefind --site dist   (search index generation)
```

## Netlify Configuration

Defined in `netlify.toml`:

```toml
[build]
  command = "npm ci && npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"
```

### Routing Rules

| Path | Target | Status |
|------|--------|--------|
| `/admin/*` | `/admin/index.html` | 200 (SPA rewrite) |
| `/*` | `/404/` | 404 (fallback) |

## Branch Protection

The `main` branch has branch protection enabled on GitHub. All changes should go through pull requests, though direct pushes are accepted for urgent fixes.

## Deploy Previews

Pull requests automatically generate deploy previews on Netlify. The preview URL appears as a status check on the PR.

## Domain

- Netlify URL: `https://aps-platform.netlify.app`
- Custom domain: `apsframework.org` (configured in Netlify, DNS pointing required)

## Environment

- Node.js: v20
- npm: v10
- Astro: v5
- No environment variables or secrets are required for the build

## Monitoring Builds

1. Go to Netlify Dashboard → Site → Deploys
2. Each deploy shows build logs with full output
3. Failed builds show the exact error from whichever check failed

## Redirects

The file `redirects.yml` at the project root defines URL redirects. During postbuild, `generate-redirects.ts` converts this to a Netlify `_redirects` file in `dist/`.

Format:
```yaml
- from: "/old-path/"
  to: "/new-path/"
  status: 301
```

## Rollback

Netlify keeps all previous deploys. To rollback:

1. Go to Netlify Dashboard → Site → Deploys
2. Find the previous successful deploy
3. Click "Publish deploy"
