import { describe, expect, it, vi } from 'vitest';
import { normalize, plan } from './normalize-desk-labels.mjs';

const ev = (name: string, at: string) => ({ event: 'labeled', label: { name }, created_at: at });
const issue = (number: number, labels: string[]) => ({
  number, title: 't', html_url: 'u', state: 'open', created_at: '2026-10-01T00:00:00Z',
  labels: labels.map((name) => ({ name })),
});

function harness(issues: unknown[], events: Record<number, unknown[]>) {
  const api = vi.fn(async (path: string) => {
    const m = path.match(/issues\/(\d+)\/events/);
    if (m) return events[Number(m[1])] ?? [];
    return issues;
  });
  const gh = vi.fn(async () => ({ stdout: '' }));
  return { api, gh, log: vi.fn() };
}

describe('plan', () => {
  it('keeps the most recently added desk label', () => {
    expect(plan(['desk:ops', 'desk:ops-fix'], [ev('desk:ops', '2026-10-01T00:00:00Z'), ev('desk:ops-fix', '2026-10-02T00:00:00Z')]))
      .toEqual({ keep: 'desk:ops-fix', remove: ['desk:ops'] });
  });
  it('skips ties', () => {
    expect(plan(['desk:a', 'desk:b'], [ev('desk:a', '2026-10-01T00:00:00Z'), ev('desk:b', '2026-10-01T00:00:00Z')])).toHaveProperty('skip');
  });
});

describe('normalize', () => {
  it('removes the older desk label with --apply', async () => {
    const h = harness([issue(1, ['desk:ops', 'desk:build'])], { 1: [ev('desk:ops', '2026-10-01T00:00:00Z'), ev('desk:build', '2026-10-03T00:00:00Z')] });
    const out = await normalize({ apply: true, ...h });
    expect(out).toHaveLength(1);
    expect(h.gh).toHaveBeenCalledWith(['issue', 'edit', '1', '--repo', 'JW-Incorporated/swift2', '--remove-label', 'desk:ops']);
  });
  it('leaves desk:unowned issues untouched', async () => {
    const h = harness([issue(2, ['desk:unowned', 'desk:ops'])], { 2: [ev('desk:unowned', '2026-10-01T00:00:00Z'), ev('desk:ops', '2026-10-02T00:00:00Z')] });
    expect(await normalize({ apply: true, ...h })).toHaveLength(0);
    expect(h.gh).not.toHaveBeenCalled();
  });
  it('leaves issues with missing events untouched', async () => {
    const h = harness([issue(3, ['desk:ops', 'desk:build'])], { 3: [ev('desk:ops', '2026-10-01T00:00:00Z')] });
    expect(await normalize({ apply: true, ...h })).toHaveLength(0);
    expect(h.gh).not.toHaveBeenCalled();
  });
  it('makes no writes in dry-run', async () => {
    const h = harness([issue(4, ['desk:ops', 'desk:build'])], { 4: [ev('desk:ops', '2026-10-01T00:00:00Z'), ev('desk:build', '2026-10-03T00:00:00Z')] });
    expect(await normalize({ apply: false, ...h })).toHaveLength(1);
    expect(h.gh).not.toHaveBeenCalled();
  });
  it('continues past a per-issue API error', async () => {
    const h = harness([issue(5, ['desk:ops', 'desk:build']), issue(6, ['desk:ops', 'desk:build'])], { 6: [ev('desk:ops', '2026-10-01T00:00:00Z'), ev('desk:build', '2026-10-03T00:00:00Z')] });
    const inner = h.api;
    const api = vi.fn(async (path: string) => {
      if (path.includes('/issues/5/events')) throw new Error('boom');
      return inner(path);
    });
    expect(await normalize({ apply: true, ...h, api })).toHaveLength(1);
  });
});
