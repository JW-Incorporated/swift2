import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain mjs
import { CLOCK_LIVE, CLOCK_LIVE_SINCE } from './lib/chat-inbox.mjs';
// @ts-expect-error plain mjs
import { flagProblems } from './lib/clock-flags.mjs';

describe('committed clock flags', () => {
  it('CLOCK_LIVE implies a valid non-future CLOCK_LIVE_SINCE; off clears since', () => {
    expect(flagProblems({ live: CLOCK_LIVE, since: CLOCK_LIVE_SINCE, now: Date.now() })).toEqual([]);
  });
  it('rejects future/missing since and requires a fresh since on reactivation', () => {
    const now = Date.parse('2026-09-14T15:00:00Z');
    const previous = { live: false, since: '' };
    for (const since of ['', 'invalid', '2026-09-15T15:00:00Z', '2026-09-14T12:00:00Z']) expect(flagProblems({ live: true, since, previous, now, changedAt: now }).length).toBeGreaterThan(0);
    expect(flagProblems({ live: true, since: '2026-09-14T14:59:00Z', previous, now, changedAt: now })).toEqual([]);
    expect(flagProblems({ live: true, since: '2026-09-14T12:00:00Z', previous: { live: true }, now, changedAt: now })).toEqual([]);
  });
  it('validates an activation PR against its base when CI supplies the event', async () => {
    if (process.env.GITHUB_EVENT_NAME !== 'pull_request' || !process.env.GITHUB_EVENT_PATH || !CLOCK_LIVE) return;
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const sha = event.pull_request?.base?.sha;
    expect(sha).toMatch(/^[a-f0-9]{40}$/);
    const file = 'scripts/marjorie/lib/chat-inbox.mjs';
    let source: string;
    try {
      source = execFileSync('git', ['show', `${sha}:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch {
      // CI uses a shallow checkout. Only public code at the immutable base,
      // no token or credential read, and no remote text printed on failure.
      const response = await fetch(`https://raw.githubusercontent.com/JW-Incorporated/swift2/${sha}/${file}`, { signal: AbortSignal.timeout(15_000) });
      expect(response.ok).toBe(true);
      source = await response.text();
    }
    const previous = { live: /^export const CLOCK_LIVE = true;\r?$/m.test(source), since: /^export const CLOCK_LIVE_SINCE = '([^']*)';\r?$/m.exec(source)?.[1] || '' };
    const changedAt = Number(execFileSync('git', ['log', '-1', '--format=%ct'], { encoding: 'utf8' }).trim()) * 1000;
    expect(flagProblems({ live: CLOCK_LIVE, since: CLOCK_LIVE_SINCE, previous, now: Date.now(), changedAt })).toEqual([]);
  }, 25_000);
});
