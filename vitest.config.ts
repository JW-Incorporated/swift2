import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // apps/web's own tsconfig maps "@/*" to its root; mirrored here so
      // tests can import components/lib files the same way app code does.
      '@': fileURLToPath(new URL('./apps/web', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts', 'apps/web/**/*.test.ts', 'apps/worker/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
