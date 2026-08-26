import { describe, expect, it } from 'vitest';
import {
  classifyLogText,
  evaluate,
  firstRunAfter,
  ROTATION_AT,
  WINDOW_END,
} from './news-worker-rotation-check.mjs';

const run = (id: number, createdAt: string, conclusion: string | null = 'success') => ({
  databaseId: id,
  createdAt,
  conclusion,
});

describe('firstRunAfter', () => {
  it('picks the earliest run after rotation, not the latest', () => {
    const found = firstRunAfter([
      run(3, '2026-08-16T01:10:00Z'),
      run(1, '2026-08-15T21:10:00Z'),
      run(2, '2026-08-16T05:10:00Z'),
    ]);
    expect(found?.databaseId).toBe(1);
  });

  it('ignores runs before the rotation', () => {
    const found = firstRunAfter([run(0, '2026-08-15T13:10:00Z')]);
    expect(found).toBeNull();
  });
});

describe('classifyLogText', () => {
  it('recognises an invalid-API-key auth failure', () => {
    expect(classifyLogText('news-worker: cycle crashed: Invalid API key')).toBe('auth');
  });

  it('recognises a 401 in log text', () => {
    expect(classifyLogText('PostgREST error: 401 Unauthorized')).toBe('auth');
  });

  it('does not classify an unrelated crash as auth', () => {
    expect(classifyLogText('news-worker: cycle crashed: TypeError: fetch failed (ECONNRESET)')).toBe('other');
  });

  it('returns null for no log text at all', () => {
    expect(classifyLogText(undefined)).toBeNull();
  });
});

describe('evaluate — no run yet', () => {
  it('is pending inside the window', () => {
    const result = evaluate({ runs: [], now: new Date('2026-08-15T20:00:00Z') });
    expect(result.status).toBe('pending');
  });

  it('stands down at window expiry instead of nagging forever', () => {
    const result = evaluate({ runs: [], now: new Date(WINDOW_END) });
    expect(result.status).toBe('window-expired');
  });
});

describe('evaluate — first run succeeded', () => {
  it('confirms ok', () => {
    const result = evaluate({
      runs: [run(1, '2026-08-15T21:10:00Z', 'success')],
      now: new Date('2026-08-16T14:35:00Z'),
    });
    expect(result.status).toBe('confirmed-ok');
  });
});

describe('evaluate — first run still in progress', () => {
  it('is pending, not a false alarm', () => {
    const result = evaluate({
      runs: [run(1, '2026-08-15T21:10:00Z', null)],
      now: new Date('2026-08-15T21:12:00Z'),
    });
    expect(result.status).toBe('pending');
  });
});

describe('evaluate — first run failed on auth', () => {
  it('flags an authentication-shaped failure distinctly', () => {
    const result = evaluate({
      runs: [run(1, '2026-08-15T21:10:00Z', 'failure')],
      logText: 'news-worker: could not load news_source rows: Invalid API key',
      now: new Date('2026-08-16T14:35:00Z'),
    });
    expect(result.status).toBe('confirmed-auth-failure');
  });
});

describe('evaluate — first run failed for an ordinary reason', () => {
  it('does not blame the rotation for an unrelated failure', () => {
    const result = evaluate({
      runs: [run(1, '2026-08-15T21:10:00Z', 'failure')],
      logText: 'news-worker: ingest failed for "Example Feed": TypeError: fetch failed (ECONNRESET)',
      now: new Date('2026-08-16T14:35:00Z'),
    });
    expect(result.status).toBe('confirmed-other-failure');
  });
});

it('ROTATION_AT matches the founder-specified rotation timestamp', () => {
  expect(ROTATION_AT).toBe('2026-08-15T18:31:50Z');
});
