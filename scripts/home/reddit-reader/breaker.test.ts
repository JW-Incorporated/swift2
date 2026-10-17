import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
// @ts-expect-error plain .mjs module
import { beginCircuitRun, loadCircuitState, tripCircuit } from './breaker.mjs';

const temporary: string[] = [];

async function stateFile() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'reddit-breaker-'));
  temporary.push(directory);
  return path.join(directory, 'state.json');
}

afterEach(async () => {
  await Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('Reddit circuit backoff', () => {
  it('skips three runs after the first trip and doubles after the next trip', async () => {
    const file = await stateFile();
    await tripCircuit(file, 'blocked', { status: 429, now: new Date('2026-10-17T00:00:00Z') });
    await expect(beginCircuitRun(file)).resolves.toMatchObject({
      skipped: true,
      state: { backoffRuns: 3, remainingSkips: 2 },
    });
    await expect(beginCircuitRun(file)).resolves.toMatchObject({ skipped: true });
    await expect(beginCircuitRun(file)).resolves.toMatchObject({ skipped: true });
    await expect(beginCircuitRun(file)).resolves.toMatchObject({ skipped: false });

    await tripCircuit(file, 'blocked', { status: 403, now: new Date('2026-10-17T01:00:00Z') });
    expect(await loadCircuitState(file)).toMatchObject({
      backoffRuns: 6,
      remainingSkips: 6,
      tripCount: 2,
      lastReason: 'blocked (HTTP 403)',
    });
  });
});
