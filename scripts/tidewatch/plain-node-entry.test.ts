import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

describe('tidewatch.yml entry scripts load under plain node', () => {
  for (const script of ['collect', 'classify', 'route']) {
    it(`imports scripts/tidewatch/${script}.mjs without a TS loader`, () => {
      const href = pathToFileURL(path.join(ROOT, 'scripts', 'tidewatch', `${script}.mjs`)).href;
      const result = spawnSync(process.execPath,
        ['--input-type=module', '-e', `await import(${JSON.stringify(href)})`],
        { cwd: ROOT, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' } });
      expect(result.stderr.slice(0, 600)).not.toMatch(/ERR_MODULE_NOT_FOUND/);
      expect(result.status).toBe(0);
    });
  }
});
