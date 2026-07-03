import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Web (apps/web) is linted by Next's own tooling in a later work package;
// this root config covers the TypeScript packages + worker.
export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', 'apps/web/**'],
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
      },
    },
  },
);
