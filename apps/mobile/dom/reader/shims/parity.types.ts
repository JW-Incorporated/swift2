// Compile-time export-shape check (runs in the mobile typecheck): each shim must
// provide every value export of the web module it replaces, with an assignable
// type, and the shared exports must be assignable back the other way too.
// Relative paths on purpose: the mobile tsconfig has no '@/' alias.
// `Loose` names exports that are deliberately wider in the shim (mutable where
// the web type is readonly), so only the shim-to-web direction is checked for them.
type Same<W, S, Loose extends PropertyKey = never> = [S] extends [W]
  ? [Pick<W, Exclude<keyof W & keyof S, Loose>>] extends [Pick<S, Exclude<keyof W & keyof S, Loose>>]
    ? true
    : false
  : false;

export const parity: {
  content: Same<typeof import('../../../../web/lib/longlive/content'), typeof import('./content')>;
  videos: Same<typeof import('../../../../web/lib/longlive/videos'), typeof import('./videos')>;
  tracks: Same<typeof import('../../../../web/lib/longlive/tracks'), typeof import('./tracks')>;
  eraSecrets: Same<typeof import('../../../../web/lib/longlive/era-secrets'), typeof import('./era-secrets')>;
  merch: Same<typeof import('../../../../web/lib/longlive/merch'), typeof import('./merch'), 'MERCH_CATALOGUE'>;
  theories: Same<typeof import('../../../../web/lib/longlive/theories'), typeof import('./theories')>;
} = { content: true, videos: true, tracks: true, eraSecrets: true, merch: true, theories: true };
