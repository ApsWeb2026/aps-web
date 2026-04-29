// src/scripts/make-reference.ts

type ReferenceType = 'book' | 'journal';

const ref: {
  type: ReferenceType;
  authors: string;
  year: number;
  title: string;
  journal?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
} = {
  type: 'journal',
  authors: 'Montévil, M., & Mossio, M.',
  year: 2015,
  title: 'Biological organisation as closure of constraints',
  journal: 'Journal of Theoretical Biology',
  volume: '372',
  pages: '179–191',
  doi: '10.1016/j.jtbi.2015.02.029',
};

// For a book, use:
// const ref = {
//   type: 'book',
//   authors: 'Moreno, A., & Mossio, M.',
//   year: 2015,
//   title: 'Biological Autonomy: A Philosophical and Theoretical Enquiry',
//   publisher: 'Springer',
// };

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function yamlEscape(value: string) {
  return value.replace(/"/g, '\\"');
}

const firstAuthor = ref.authors.split(',')[0];
const id = `${slugify(firstAuthor)}-${ref.year}`;

console.log(`  - id: "${id}"`);
console.log(`    authors: "${yamlEscape(ref.authors)}"`);
console.log(`    year: ${ref.year}`);
console.log(`    title: "${yamlEscape(ref.title)}"`);

if (ref.type === 'journal') {
  if (ref.journal) console.log(`    journal: "${yamlEscape(ref.journal)}"`);
  if (ref.volume) console.log(`    volume: "${yamlEscape(ref.volume)}"`);
  if (ref.issue) console.log(`    issue: "${yamlEscape(ref.issue)}"`);
  if (ref.pages) console.log(`    pages: "${yamlEscape(ref.pages)}"`);
}

if (ref.type === 'book') {
  if (ref.publisher) console.log(`    publisher: "${yamlEscape(ref.publisher)}"`);
}

if (ref.doi) {
  console.log(`    doi: "${yamlEscape(ref.doi)}"`);
}