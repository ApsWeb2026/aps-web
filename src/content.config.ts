import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const statusEnum = z.enum(['draft', 'evolving', 'canonical']);

const clusterEnum = z.enum([
  'foundations',
  'definition-borderlines',
  'cognition-mind',
  'empirical-interface',
  'scaling-complexity',
  'historical-context',
]);

const referenceSchema = z.object({
  id: z.string(),
  authors: z.string(),
  year: z.number(),
  title: z.string(),
  journal: z.string().optional(),
  publisher: z.string().optional(),
  volume: z.string().optional(),
  pages: z.string().optional(),
  doi: z.string().optional(),
});

const glossary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/glossary' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    definition: z.string(),
    inBrief: z.string(),
    status: statusEnum,
    canonical: z.boolean().default(false),
    canonicalLockDate: z.string().optional(),
    revised: z.string(),
    cluster: clusterEnum,
    seeAlso: z.array(z.string()).default([]),
    references: z.array(referenceSchema).default([]),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/articles' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    abstract: z.string(),
    status: statusEnum,
    canonical: z.boolean().default(false),
    canonicalLockDate: z.string().optional(),
    revised: z.string(),
    cluster: clusterEnum,
    keyPoints: z.array(z.string()).default([]),
    relatedGlossaryTerms: z.array(z.string()).default([]),
    researchStream: z.string().optional(),
    references: z.array(referenceSchema).default([]),
  }),
});

const streams = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/streams' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    overview: z.string(),
    status: statusEnum,
    revised: z.string(),
    cluster: clusterEnum,
    associatedGlossaryTerms: z.array(z.string()).default([]),
  }),
});

const orientation = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/orientation' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    status: statusEnum,
    canonical: z.boolean().default(false),
    canonicalLockDate: z.string().optional(),
    revised: z.string(),
  }),
});

const boxes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/boxes' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    status: statusEnum,
    associatedPages: z.array(z.string()).default([]),
  }),
});

const diagrams = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/diagrams' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    svgFile: z.string(),
    caption: z.string(),
    description: z.string(),
    status: statusEnum,
    revised: z.string(),
    figureNumber: z.string().optional(),
    crossReferences: z.array(z.string()).default([]),
  }),
});

export const collections = {
  glossary,
  articles,
  streams,
  orientation,
  boxes,
  diagrams,
};
