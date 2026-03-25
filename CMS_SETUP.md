# CMS Setup Guide

The APS Publishing Platform uses Decap CMS (formerly Netlify CMS) for browser-based content editing.

## Architecture

```
Browser (CMS UI)  →  Git Gateway (Netlify)  →  GitHub Repository
                         ↑
                  Netlify Identity (auth)
```

- **Decap CMS v3**: Single-page app at `/admin/`
- **Git Gateway**: Netlify service that proxies Git operations (no GitHub OAuth needed)
- **Netlify Identity**: Handles user authentication (email/password or invite-only)

## CMS Access

- URL: `https://your-site.netlify.app/admin/`
- Users log in via Netlify Identity credentials
- On successful login, the Netlify Identity widget redirects to `/admin/`

## Configuration

The CMS is configured in `public/admin/config.yml`. Key sections:

### Backend

```yaml
backend:
  name: git-gateway
  branch: main
```

All CMS edits commit directly to the `main` branch (or via editorial workflow).

### Editorial Workflow

```yaml
publish_mode: editorial_workflow
```

This enables a Draft → In Review → Ready workflow within the CMS. Content saved as "Draft" creates a branch; publishing merges it to main.

### Collections

Six content collections are configured:
1. **Glossary Entries** — `src/content/glossary/`
2. **Articles** — `src/content/articles/`
3. **Research Streams** — `src/content/streams/`
4. **Orientation Pages** — `src/content/orientation/`
5. **APS Boxes** — `src/content/boxes/`
6. **Diagrams** — `src/content/diagrams/`

Each collection defines its fields, validation rules, and widgets.

### Cluster Select Fields

All collections that use clusters share the same 7-value select:

| Label | Value |
|-------|-------|
| Foundations of Life | `foundations` |
| Definition & Borderlines | `definition-borderlines` |
| Cognition & Mind | `cognition-mind` |
| Empirical Interface | `empirical-interface` |
| Scale, Time, and Organisation | `scaling-complexity` |
| Historical & Philosophical Context | `historical-context` |
| Conceptual Foundations & Explanatory Grammar | `conceptual-foundations` |

## Managing Users

### Invite a New User

1. Go to Netlify Dashboard → Site → Integrations → Identity
2. Click "Invite users"
3. Enter the email address
4. The user receives an invite email with a confirmation link

### Remove a User

1. Go to Netlify Dashboard → Identity
2. Find the user and delete their account

## Troubleshooting

### "Failed to load config"

- Verify `public/admin/config.yml` exists and is valid YAML
- Check the browser console for specific parsing errors

### "Git Gateway Error"

- Ensure Git Gateway is enabled: Netlify Dashboard → Site → Integrations → Identity → Git Gateway → Enable
- Verify the GitHub repo is connected in Netlify site settings

### Login Not Working

- Check Netlify Identity is enabled for the site
- Verify the user has accepted their invite
- The Netlify Identity widget script must be in the HTML head (it's in `BaseLayout.astro`)

### Date Fields

Decap CMS writes dates without YAML quotes (e.g. `revised: 2026-03-25`). YAML parsers read these as Date objects. The Astro schema uses `z.preprocess()` to normalise both `Date` objects and strings to `YYYY-MM-DD` format. This is handled automatically — no action needed.

## Files

| File | Purpose |
|------|---------|
| `public/admin/index.html` | CMS entry point (loads Decap CMS script) |
| `public/admin/config.yml` | CMS collection and field configuration |
| `src/layouts/BaseLayout.astro` | Contains Netlify Identity widget + redirect script |
