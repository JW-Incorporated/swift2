import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Web (apps/web) and mobile (apps/mobile) are linted by their own framework
// tooling (Next / Expo); this root config covers the TypeScript packages +
// worker + Node scripts.
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      'apps/web/**',
      'apps/mobile/**',
      '.claude/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
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
          ],
          patterns: [
            { group: ['next/*', 'react-native-*', 'react-native/*'], message: 'packages/ui is host-agnostic: use useHost() instead of next/* or react-native*.' },
            { group: ['**/apps/**'], message: 'packages/ui must not import from apps/*: apps depend on packages/ui, never the reverse.' },
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
