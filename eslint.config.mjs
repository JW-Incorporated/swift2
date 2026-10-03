import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const READER_WRAPPERS = [
  'contentForThread',
  'threadPoints',
  'threadDoorwaysForEra',
  'eggDoorwaysForEra',
  'theoriesForEra',
  'eraSecretsForEra',
  'resolveEraSecretLink',
  'tracksForEra',
  'nextTrackOnAlbum',
  'keepExploring',
  'findTrack',
  'setDefaultSongCatalogue',
  'setContentGeneratedAtSource',
  'setContentItemLookup',
  'setEraSecretsRawProvider',
  'setSongTargetResolver',
  'setTheoriesRawProvider',
  'setThreadContentProvider',
  'setTracksRawProvider',
];
const BANNED_MODULES = [
  'content',
  'tracks',
  'theories',
  'era-secrets',
  'threads',
  'videos',
  'merch',
  'song-moods.generated',
  'vault-wiring',
  'baked-modules',
  'baked-modules-full',
  'content-vault.generated',
  '*.generated',
].map((m) => '**/lib/longlive/' + m);
const BANNED_RELATIVE_MODULES = BANNED_MODULES.map((m) => m.replace('**/lib/longlive/', '')).flatMap((m) => [
  './' + m,
  '../' + m,
]);
const READER_WRAPPER_BAN = {
  name: '@swift2/experience',
  importNames: READER_WRAPPERS,
  message: 'Read via useReader() - WP2.2. The injected module-global wrappers are replaced by the ReaderSnapshot.',
};
const READER_MODULE_BAN = {
  group: BANNED_MODULES,
  message: 'Read via useReader() - WP2.2. Module-global content accessors and baked data modules are server/snapshot-construction only.',
};

const stubPlugin = (...names) => ({
  rules: Object.fromEntries(names.map((n) => [n, { create: () => ({}) }])),
});

// Web (apps/web) and mobile (apps/mobile) are linted by their own framework
// tooling (Next / Expo); this root config covers the TypeScript packages +
// worker + Node scripts.
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      'apps/web/*',
      '!apps/web/components',
      'apps/web/components/*',
      '!apps/web/components/longlive',
      '!apps/web/lib',
      'apps/web/lib/*',
      '!apps/web/lib/longlive',
      'apps/mobile/**',
      '.claude/**',
    ],
  },
  // apps/web is linted by Next tooling; only the WP2.2-D reader ban below reaches it.
  ...[js.configs.recommended, ...tseslint.configs.recommended].map((c) => ({
    ...c,
    ignores: [...(c.ignores ?? []), 'apps/web/**'],
  })),
  {
    files: ['apps/web/components/longlive/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    // Inline disables name Next/react-hooks rules this root config does not load.
    plugins: {
      'react-hooks': stubPlugin('exhaustive-deps'),
      '@next/next': stubPlugin('no-img-element', 'no-html-link-for-pages'),
    },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
  },
  {
    // packages/experience is the headless core shared by apps/web (Next.js)
    // and apps/mobile (React Native) — see docs/specs/2026-09-05-one-source-
    // three-surfaces.md (D2). It must never depend on a renderer or a DOM,
    // so importing react-dom/next/react-native, or referencing browser
    // globals directly, is a lint error rather than a runtime surprise.
    files: ['packages/experience/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react-dom', message: 'packages/experience is headless: no react-dom.' },
            { name: 'next', message: 'packages/experience is headless: no next.' },
            { name: 'react-native', message: 'packages/experience is headless: no react-native.' },
          ],
          patterns: [
            { group: ['react-dom/*', 'next/*', 'react-native/*'], message: 'packages/experience is headless: no renderer-specific imports.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'packages/experience is headless: no window global.' },
        { name: 'document', message: 'packages/experience is headless: no document global.' },
      ],
    },
  },
  {
    // packages/ui is host-agnostic UI shared by apps/web and the apps/mobile
    // DOM host. Framework and renderer access goes through useHost() only.
    files: ['packages/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'next', message: 'packages/ui is host-agnostic: use useHost() instead of next.' },
            { name: 'react-native', message: 'packages/ui is host-agnostic: use useHost() instead of react-native.' },
            READER_WRAPPER_BAN,
          ],
          patterns: [
            { group: ['next/*', 'react-native-*', 'react-native/*'], message: 'packages/ui is host-agnostic: use useHost() instead of next/* or react-native*.' },
            { group: ['**/apps/**'], message: 'packages/ui must not import from apps/*: apps depend on packages/ui, never the reverse.' },
            READER_MODULE_BAN,
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "ImportExpression[source.value=/^(next$|next[^-a-zA-Z0-9]|react-native)/]",
          message: 'packages/ui is host-agnostic: use useHost() instead of dynamic import of next/react-native.',
        },
        {
          selector: "CallExpression[callee.name='require'][arguments.0.value=/^(next$|next[^-a-zA-Z0-9]|react-native)/]",
          message: 'packages/ui is host-agnostic: use useHost() instead of require of next/react-native.',
        },
        {
          selector: "ImportExpression[source.type!='Literal']",
          message: 'packages/ui forbids non-literal dynamic import(): the specifier must be a string literal so the host ban can be checked.',
        },
        {
          selector: "CallExpression[callee.name='require']:not([arguments.0.type='Literal'])",
          message: 'packages/ui forbids non-literal require(): the specifier must be a string literal so the host ban can be checked.',
        },
      ],
    },
  },
  {
    // WP2.2-D: the web reader reads only the ReaderSnapshot (useReader()), never
    // the module-global content accessors the snapshot replaced. Server code
    // (*.server.ts, API routes), snapshot construction (baked-modules*.ts,
    // reader-snapshot-provider.tsx) and tests live outside this override or are
    // exempted below. Remaining module-global readers: docs/longlive-experience.md.
    files: ['apps/web/components/longlive/**/*.{ts,tsx}'],
    ignores: [
      '**/*.test.{ts,tsx}',
      '**/*.server.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [READER_WRAPPER_BAN],
          patterns: [READER_MODULE_BAN],
        },
      ],
    },
  },
  {
    // WP2.2-D follow-up: the same ban for the CLIENT modules of apps/web/lib/longlive
    // (that folder mixes server and client code, so this is an explicit list, not a
    // folder glob). Client = 'use client' files + the pure helpers client components
    // import: store/, use*.ts hooks, share-payload, section-jump, etc.
    // Deliberately NOT covered (server / snapshot-construction / data, may read the
    // module-global accessors): the banned modules themselves, *.generated.ts,
    // baked-modules*.ts, vault-wiring.ts, reader-snapshot-provider.tsx,
    // render-with-reader.tsx, *.server.ts, clown-agent*/clown-index/clown-retrieve/
    // clown-client/clown-fallback/clown-answer (route-handler side), og-card.tsx,
    // share-card*.tsx, parity-queries.ts, search.ts, tests.
    // TODO(WP2.2): communities.ts, live-theories.ts and love-story.ts are `export * from
    // '@swift2/experience'` shims that re-export the banned wrappers; narrowing them to
    // explicit exports needs a consumer audit, so they are allow-listed here.
    // TODO(#4859): merch-filters.ts reads content/merch directly until merch moves
    // to ReaderExtensionsProvider; clown-board.ts reads THEORIES_RAW directly
    // (its snapshot migration is larger than a lint-follow-up).
    files: [
      'apps/web/lib/longlive/store/**/*.{ts,tsx}',
      'apps/web/lib/longlive/use-*.ts',
      'apps/web/lib/longlive/use[A-Z]*.ts',
      'apps/web/lib/longlive/{clown-chat-ui,clown-chat-helpers,clown-stream,clown-explain,clown-starters,local-storage-adapter,return-point-stack,chrome-offset,bottom-nav-focus,bottom-nav-layout,card-chrome,contain-fit,share-payload,share-action,share,section-jump,era-jump-landing,era-stream-pin,in-app,theme,tagBadges,tags,video-affordance,track-video,related,submit-link,legal,decode,social,share-card-params,mood-starters}.ts',
    ],
    ignores: ['**/*.test.{ts,tsx}', '**/*.server.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    plugins: {
      'react-hooks': stubPlugin('exhaustive-deps'),
      '@next/next': stubPlugin('no-img-element', 'no-html-link-for-pages'),
    },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [READER_WRAPPER_BAN],
          patterns: [
            READER_MODULE_BAN,
            {
              group: BANNED_RELATIVE_MODULES,
              message: READER_MODULE_BAN.message,
            },
          ],
        },
      ],
    },
  },
  {
    // Node tooling scripts (migrations, seeds) run under Node with ESM.
    files: ['scripts/**/*.mjs', 'supabase/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        AbortController: 'readonly',
        Intl: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
      },
    },
  },
);
