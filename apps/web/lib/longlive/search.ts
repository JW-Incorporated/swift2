// The search index is no longer built here: it is `ReaderSnapshot.domains.searchIndex`
// (built by `buildSearchDocs` in `@swift2/experience/reader-snapshot`, read via
// `useReader().searchIndex`). This module re-exports the generic ranking engine
// (OS-025: it lives in `@swift2/experience`, `search-index.ts`) so existing
// imports of `./search` keep working unchanged.
export {
  flattenGroups,
  MAX_RESULTS_PER_TYPE,
  normalize,
  scoreDoc,
  searchDocs,
  tokenize,
  WEIGHT_DEFINING,
  WEIGHT_NOTABLE,
  type SearchDoc,
  type SearchDocType,
  type SearchGroup,
  type SearchResult,
  type SearchTarget,
} from '@swift2/experience';
