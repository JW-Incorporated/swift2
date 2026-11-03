// Invariants for the Vault Run publish job's PR step. Auto-merge can land the
// run PR and delete its branch before this step runs (issue #6591), and a squash
// merge leaves the triple-dot diff non-empty, so the step must treat an
// already-merged PR for the head as done instead of calling `gh pr create` and
// failing with "No commits between main and vault/<date>".

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { ROOT } from '../lib/generated-content.mjs';

const wf = parse(
  readFileSync(join(ROOT, '.github', 'workflows', 'routine-vault-run.yml'), 'utf8'),
) as {
  jobs: Record<string, { steps?: Array<{ name?: string; run?: string }> }>;
};

const prStep = Object.values(wf.jobs)
  .flatMap((job) => job.steps ?? [])
  .find((step) => step.name === 'Open or update the PR');

describe('routine-vault-run.yml — Open or update the PR', () => {
  it('exists and shells out to gh', () => {
    expect(prStep?.run).toContain('gh pr create');
  });

  it('checks for an already-merged PR for the head before creating one', () => {
    const run = prStep?.run ?? '';
    const merged = run.indexOf('--state merged');
    const create = run.indexOf('gh pr create');
    expect(merged).toBeGreaterThan(-1);
    expect(merged).toBeLessThan(create);
  });

  it('exits 0 on the already-merged path rather than failing the step', () => {
    const run = prStep?.run ?? '';
    const merged = run.slice(run.indexOf('--state merged'), run.indexOf('gh pr create'));
    expect(merged).toContain('exit 0');
    expect(merged).toMatch(/::notice::/);
  });
});
