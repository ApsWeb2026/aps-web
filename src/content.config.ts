import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// Milestone 1: Define empty collections to suppress deprecation warning.
// Milestone 2: Add full Zod schemas for each content type.

const glossary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/glossary' }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/articles' }),
});

const streams = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/streams' }),
});

const orientation = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/orientation' }),
});

const boxes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/boxes' }),
});

const diagrams = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/diagrams' }),
});

export const collections = {
  glossary,
  articles,
  streams,
  orientation,
  boxes,
  diagrams,
};
