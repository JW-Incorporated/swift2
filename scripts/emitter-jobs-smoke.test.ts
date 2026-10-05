// #5050: scheduled emitter jobs crashed with ERR_MODULE_NOT_FOUND because
// plain `node` cannot load @swift2/core's extensionless .ts source. Each case
// spawns the job with the runner prefix it ACTUALLY uses in its workflow
// (read from the YAML, so a regression to plain `node` fails here), with no
// credentials, so nothing real is contacted.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');

function productionCommand(workflow: string, script: string): string {
  const text = readFileSync(join(root, '.github/workflows', workflow), 'utf8');
  const line = text.split('\n').find((l) => l.includes(script) && /\b(node|tsx)\b/.test(l));
  if (!line) throw new Error(`${workflow}: no step runs ${script}`);
  return line.trim().replace(/^run:\s*/, '');
}

function run(command: string) {
  const env = { ...process.env };
  delete env.SUPABASE_URL;
  delete env.SUPABASE_SERVICE_ROLE_KEY;
  return spawnSync(command, { cwd: root, env, shell: true, encoding: 'utf8', timeout: 120_000 });
}

describe('event emitter jobs run under their production command', () => {
  it('official_merch emitter skips cleanly with no credentials', () => {
    const draft = join(mkdtempSync(join(tmpdir(), 'emit-')), 'draft.json');
    writeFileSync(draft, '{}');
    const cmd = productionCommand(
      'merch-official-sync.yml',
      'scripts/merch-engine/emit-official-merch-event.mjs',
    ).replace('.official-social-draft.json', JSON.stringify(draft));
    const r = run(cmd);
    expect(r.stderr).not.toMatch(/ERR_MODULE_NOT_FOUND/);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/skipping/);
  }, 130_000);

  it('official_youtube emitter (appearance-discovery) loads under the workflow runner', () => {
    const cmd = productionCommand(
      'appearance-discovery.yml',
      'scripts/appearance-discovery/discover.mjs',
    );
    const runner = cmd.split('scripts/appearance-discovery/discover.mjs')[0].trim();
    const target = pathToFileURL(
      join(root, 'scripts/appearance-discovery/lib/emit-official-youtube-event.mjs'),
    ).href;
    const dir = mkdtempSync(join(tmpdir(), 'emit-'));
    const probe = join(dir, 'probe.mjs');
    writeFileSync(probe, `await import(${JSON.stringify(target)});\nconsole.log('loaded');\n`);
    const r = run(`${runner} ${JSON.stringify(probe)}`);
    expect(r.stderr).not.toMatch(/ERR_MODULE_NOT_FOUND/);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/loaded/);
  }, 130_000);

  it('author-catalogs fails loudly when the fan-made emitter cannot load', () => {
    const src = readFileSync(join(root, 'scripts/merch-engine/author-catalogs.mjs'), 'utf8');
    expect(src).toMatch(/emitter failed to load/);
  });
});
