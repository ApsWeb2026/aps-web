import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aps-platform.netlify.app',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
