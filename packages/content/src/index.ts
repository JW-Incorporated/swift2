/**
 * `packages/content` public entry point. Re-exports every schema + inferred
 * type from `./schema` so consumers (`packages/content`'s own loader in
 * OS-013, `scripts/build-content-bundle.mjs` in OS-011, and eventually
 * `apps/web`/`apps/mobile`) import from one stable path (`@swift2/content`)
 * rather than reaching into `schema.ts` directly.
 */
export * from './schema';
export * from './compat';
