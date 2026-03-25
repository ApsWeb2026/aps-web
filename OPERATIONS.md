# Operations Guide

Day-to-day operations, maintenance tasks, and troubleshooting for the APS Publishing Platform.

## Common Tasks

### Adding a New Content Page

1. Log into the CMS at `/admin/`
2. Select the appropriate collection (Articles, Glossary, etc.)
3. Click "New"
4. Fill in all required fields (title, slug, status, revised, cluster)
5. Write the body content
6. Save/Publish

Or create a `.md` file directly in `src/content/{collection}/` with the correct frontmatter.

### Promoting Content to Canonical

1. Edit the page (CMS or Markdown)
2. Set `status` to `canonical`
3. Set `canonical` to `true`
4. Set `canonicalLockDate` to today's date
5. Update `revised` to today's date
6. Save and deploy

The canonical lock will take effect on the next build.

### Editing Canonical Content

1. Edit the content as needed
2. Update `revised` to today's date (this is required)
3. Save and deploy

If you forget to update `revised`, the build will fail with a canonical lock violation.

### Adding a Cross-Reference

- **Glossary See Also**: Add the target glossary slug to the `seeAlso` array
- **Article Related Terms**: Add glossary slugs to `relatedGlossaryTerms`
- **Article Related Articles**: Add article slugs to `relatedArticles`
- **Research Stream Link**: Add stream slugs to `researchStreams` on the article
- **Internal Link in Body**: Use `[Link Text](/section/slug/)`

All cross-references are validated at build time.

## Troubleshooting

### Build Failed: Content Lint

```
Content lint issues:
  src/content/articles/my-article.md
    → Missing "revised" date
```

**Fix**: Add or correct the field mentioned in the error message.

### Build Failed: Broken Link

```
Broken links found:
  src/content/articles/my-article.md
    → /glossary/nonexistent-term/
```

**Fix**: Either create the missing content page or correct the link path.

### Build Failed: Canonical Lock Violation

```
Canonical lock violation: articles/some-article
  Content changed but revised date was not updated.
```

**Fix**: Update the `revised` date in the page frontmatter to the current date.

### Build Failed: Hash Mismatch After Merge

If canonical content was edited via CMS while a feature branch was open, `.content-hashes.json` may be stale after merging.

**Fix**:
1. Pull latest main
2. Run `npm run check:canonical` (this auto-updates hashes for legitimate changes)
3. Commit the updated `.content-hashes.json`
4. Push

### CMS Saves But Deploy Fails

The CMS commits to Git successfully, but the Netlify build may still fail if validation checks don't pass. Check the Netlify deploy log for the specific error.

### Search Not Finding Content

Pagefind indexes content during postbuild. If content doesn't appear in search:

1. Ensure the page has `data-pagefind-body` on its content wrapper
2. Check that the build completed successfully (postbuild runs Pagefind)
3. Search indexes are rebuilt on every deploy — no manual action needed

### Pagefind Filters Not Working

The `data-pagefind-filter` attribute requires separate elements per filter. Comma-separated filters in a single attribute do not work correctly. Each filter must be on its own `<span>`:

```html
<!-- Correct -->
<span data-pagefind-filter="type:Article" data-pagefind-ignore></span>
<span data-pagefind-filter="status:Canonical" data-pagefind-ignore></span>

<!-- Broken -->
<span data-pagefind-filter="type:Article, status:Canonical" data-pagefind-ignore></span>
```

## Maintenance

### Updating Dependencies

```bash
npm update              # Update within semver ranges
npm outdated            # Check for newer versions
```

Test locally with `npm run build` before pushing dependency updates.

### Netlify Free Tier

The site runs on Netlify's free tier. Be aware of:
- Build minutes limit (300/month)
- Bandwidth limit (100GB/month)

If the site is paused due to limits, it will resume at the start of the next billing cycle, or the plan can be upgraded.

### Checking Content Health

Run all validation checks locally:

```bash
npm run lint:content      # Frontmatter validation
npm run check:links       # Internal link validation
npm run check:canonical   # Canonical lock check
```

These are the same checks that run during `npm run build`.
