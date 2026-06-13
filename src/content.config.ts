import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const statusEnum = z.enum(['draft', 'evolving', 'canonical']);

const dateString = z.preprocess(
  (val) => (val instanceof Date ? val.toISOString().split('T')[0] : val),
  z.string(),
);

const optionalDateString = z.preprocess(
  (val) => {
    if (val instanceof Date) return val.toISOString().split('T')[0];
    if (val === null || val === '') return undefined;
    return val;
  },
  z.string().optional(),
);

const clusterEnum = z.enum([
  'conceptual-foundations',
  'developmental-organisation',
  'evolutionary-dynamics',
  'cognition-and-mind',
  'ecological-organisation',
  'social-organisation',
  'diagnostics-and-empirical-tractability',
  'philosophy-of-biology',
  'methodology-and-explanation',
  'artificial-systems-and-boundaries',
]);

const referenceSchema = z.object({
  id: z.string(),
  authors: z.string(),
  year: z.union([z.number(), z.string()]),
  title: z.string(),

  // Journal article fields
  journal: z.string().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  doi: z.string().optional(),

  // Book / preprint / general source fields
  source: z.string().optional(),
  publisher: z.string().optional(),
  url: z.string().optional(),
  note: z.string().optional(),
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
    canonicalLockDate: optionalDateString,
    date: dateString.optional(),
    revised: dateString,
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
    canonicalLockDate: optionalDateString,
    date: dateString.optional(),
    revised: dateString,
    cluster: clusterEnum,
    role: z.enum(['anchor', 'synthesis', 'core', 'clarification', 'extension']).optional(),
    keyPoints: z.array(z.string()).default([]),
    relatedGlossaryTerms: z.array(z.string()).default([]),
    relatedArticles: z.array(z.string()).default([]),
    researchStreams: z.array(z.string()).default([]),
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
    date: dateString.optional(),
    revised: dateString,
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
    canonicalLockDate: optionalDateString,
    date: dateString.optional(),
    revised: dateString,
    cluster: clusterEnum.optional(),
    relatedGlossaryTerms: z.array(z.string()).default([]),
    relatedArticles: z.array(z.string()).default([]),
    references: z.array(referenceSchema).default([]),
  }),
});

const boxes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/boxes' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    status: statusEnum,
    canonical: z.boolean().default(false),
    canonicalLockDate: optionalDateString,
    date: dateString.optional(),
    revised: dateString,
    seeAlso: z.array(z.string()).default([]),
    associatedPages: z.array(z.string()).default([]),
  }),
});

const diagrams = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/diagrams' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    code: z.string().optional(),
    svgFile: z.string(),
    caption: z.string(),
    description: z.string(),
    status: statusEnum,
    date: dateString.optional(),
    revised: dateString,
    figureNumber: z.string().optional(),
    sequence: z.number().optional(),
    orientation: z.string().optional(),
    cluster: clusterEnum.optional(),
    keyPoint: z.string().optional(),
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