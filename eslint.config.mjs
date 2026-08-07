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
      },
    },
  },
);
