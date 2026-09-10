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
