import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // apps/web's own tsconfig maps "@/*" to its root; mirrored here so
      // tests can import components/lib files the same way app code does.
      '@': fileURLToPath(new URL('./apps/web', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // Polyfills Promise.withResolvers (Node 24+) so the full suite runs on
    // Node 20 local sandboxes too — see scripts/lib/test/ and issue #3513.
    setupFiles: [
      './scripts/lib/test/promise-with-resolvers-polyfill.ts',
      './scripts/lib/test/jsdom-render-setup.ts',
    ],
    // Syncs the root node_modules react/react-dom to apps/web's versions
    // before any test runs — see the file's own header comment for why
    // this monorepo needs it (apps/web needs React 19; apps/mobile pins a
    // different exact React 19.x for Expo; npm hoists yet another version
    // to the root for everything else — Radix UI, Next.js, lucide-react,
    // @testing-library/react — whose own `require('react')` would
    // otherwise resolve the hoisted root copy instead of apps/web's,
    // breaking hooks in every apps/web/components render test).
    globalSetup: ['./scripts/lib/test/sync-web-react-globalSetup.ts'],
    include: [
      'packages/**/*.test.ts',
      'apps/web/**/*.test.ts',
      'apps/web/**/*.test.tsx',
      'apps/worker/**/*.test.ts',
      'apps/mobile/**/*.test.ts',
      'scripts/**/*.test.ts',
    ],
  },
});
