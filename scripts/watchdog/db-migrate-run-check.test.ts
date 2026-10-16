import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateDbMigrateRuns } from './db-migrate-run-check.mjs';

type Run = {
  databaseId: number;
  event: string;
  headBranch: string;
  conclusion: string;
  createdAt: string;
  url: string;
};

const fixtures = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'db-migrate-runs.json'), 'utf8'),
) as Record<string, Run[]>;

describe('db-migrate latest-run watchdog', () => {
  it('alerts when the latest settled main run failed', () => {
    expect(evaluateDbMigrateRuns(fixtures.failure)).toEqual({
      state: 'alert',
      run: fixtures.failure[0],
    });
  });

  it('closes as soon as a newer main run succeeds', () => {
    expect(evaluateDbMigrateRuns(fixtures.recovered)).toEqual({
      state: 'ok',
      run: fixtures.recovered[0],
    });
  });

  it('does not change alert state without a relevant main run', () => {
    expect(evaluateDbMigrateRuns(fixtures.irrelevant)).toEqual({ state: 'unknown', run: null });
    expect(evaluateDbMigrateRuns([])).toEqual({ state: 'unknown', run: null });
  });

  it('sorts defensively instead of trusting API order', () => {
    expect(evaluateDbMigrateRuns([...fixtures.recovered].reverse()).state).toBe('ok');
  });

  it('treats a cancelled run as unknown rather than recovered', () => {
    const cancelled = {
      ...fixtures.failure[0],
      databaseId: 105,
      conclusion: 'cancelled',
      createdAt: '2026-10-15T21:00:00Z',
    };
    expect(evaluateDbMigrateRuns([cancelled, ...fixtures.failure])).toEqual({
      state: 'unknown',
      run: cancelled,
    });
  });

  it('is wired to the dedicated self-closing watchdog alert', () => {
    const workflow = readFileSync('.github/workflows/watchdog.yml', 'utf8');
    expect(workflow).toContain('name: DB migrate latest-run failure');
    expect(workflow).toContain('--workflow db-migrate.yml --branch main');
    expect(workflow).toContain('scripts/watchdog/db-migrate-run-check.mjs evaluate');
    expect(workflow).toContain('upsert-alert.sh open "$ALERT_TITLE" /tmp/db-migrate-alert.md');
    expect(workflow).toContain('upsert-alert.sh close "$ALERT_TITLE" /tmp/db-migrate-alert.md');
  });
});
