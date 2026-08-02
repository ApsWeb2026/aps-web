import {
  loadReferenceLibrary,
  retrieveReferences,
} from "../lib/references/retrieval";

const library = loadReferenceLibrary(
  "./src/data/aps-canonical-references.yaml"
);

const matches = retrieveReferences(library.references, {
  id: "varela-1979-principles-biological-autonomy",
});

console.log(JSON.stringify(matches, null, 2));
