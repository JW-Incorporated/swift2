// The page's change ping, the daily traffic cache and the fan recap, end to end
// with fake GitHub, Discord, mail and Vercel — nothing leaves the process.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { main } from './status-page.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { main as noteMain } from './status-note.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { main as trafficMain } from './status-traffic.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { readPingState } from './lib/status-ping.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { readTraffic } from './lib/status-traffic.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { readRecap } from './lib/status-fans.mjs';

const REPO = 'o/r';
const T0 = Date.parse('2026-10-01T12:00:00Z');
const MIN = 60_000;
const HA = `## #88 🔴 [BLOCKING] Store the login (~5 min)
<!-- ha filed=2026-09-30 -->

**Why:** Needs the owner.
**Steps:**
1. Do it.
**Worked if:** done.
`;

const dirs: string[] = [];
afterAll(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }); });
function repoRoot(ha = HA) {
  const root = mkdtempSync(path.join(tmpdir(), 'status-notify-'));
  dirs.push(root);
  writeFileSync(path.join(root, 'HUMAN-ACTIONS.md'), ha);
  for (const d of ['metrics', 'posted']) mkdirSync(path.join(root, 'social', d), { recursive: true });
  return root;
}
const pull = (n: number, title: string, mergedAt = '2026-10-01T10:00:00Z') => ({
  number: n, title, html_url: `https://github.com/${REPO}/pull/${n}`, user: { login: 'a' }, head: { ref: `b${n}` }, labels: [], merged_at: mergedAt, updated_at: mergedAt, draft: false, body: '',
});

/** A tiny stateful GitHub: one status issue whose body is whatever was last PATCHed. */
function world({ merged = [] as unknown[] } = {}) {
  const state = { body: '# first\n', merged };
  const api = vi.fn(async (p: string) => {
    if (p.includes('/issues?') && p.includes('labels=status-page')) return [{ number: 4, title: 'status', html_url: `https://github.com/${REPO}/issues/4`, body: state.body, state: 'open', labels: [{ name: 'status-page' }] }];
    if (p.includes('/pulls?state=closed')) return state.merged;
    if (/\/pulls\/\d+\/files/.test(p)) return [{ filename: 'apps/web/components/A.tsx' }];
    return [];
  });
  const gh = vi.fn(async (args: string[]) => {
    const file = args.find((a) => a.startsWith('body=@'));
    if (file) state.body = readFileSync(file.slice(6), 'utf8');
    return { stdout: '{}' };
  });
  return { state, api, gh };
}

describe('status-page.mjs --apply --notify', () => {
  const run = (w: ReturnType<typeof world>, root: string, now: number, over: Record<string, unknown> = {}) => {
    const post = vi.fn(async () => ({ ok: true }));
    const log = vi.fn();
    return main(['--apply', '--notify'], { api: w.api, gh: w.gh, root, now, log, post, env: { GITHUB_REPOSITORY: REPO, DISCORD_MARJORIE_WEBHOOK_URL: 'https://discord.test/hook' }, ...over, ...(over.post ? {} : { post }) })
      .then((code: number) => ({ code, post: (over.post || post) as ReturnType<typeof vi.fn>, log }));
  };

  it('records a baseline silently the first time, then pings once on a material change, with the link', async () => {
    const root = repoRoot();
    const w = world();
    const first = await run(w, root, T0);
    expect(first.post).not.toHaveBeenCalled();
    expect(readPingState(w.state.body)).toMatchObject({ at: new Date(T0).toISOString() });

    w.state.merged = [pull(20, 'feat(web): era page share button')];
    const second = await run(w, root, T0 + 120 * MIN);
    expect(second.post).toHaveBeenCalledTimes(1);
    expect(second.post.mock.calls[0][0]).toBe(`📋 Status updated — 1 shipped — https://github.com/${REPO}/issues/4`);
    expect(second.post.mock.calls[0][1]).toEqual({ webhook: 'https://discord.test/hook' });
    expect(readPingState(w.state.body)).toMatchObject({ at: new Date(T0 + 120 * MIN).toISOString() });
    expect(w.state.body).toContain('## 🎉 For fans');
    expect(w.state.body).toContain('[era page share button](https://github.com/o/r/pull/20)');
  });

  it('stays quiet when nothing changed, and ignores the timestamp, in-flight PRs and growth', async () => {
    const root = repoRoot();
    const w = world({ merged: [pull(20, 'feat(web): x')] });
    await run(w, root, T0);
    const again = await run(w, root, T0 + 180 * MIN);
    expect(again.post).not.toHaveBeenCalled();
    expect(readPingState(w.state.body)).toMatchObject({ at: new Date(T0).toISOString() });
    expect(again.log.mock.calls.flat().join(' ')).toContain('status ping: none (unchanged)');
  });

  it('debounces to one ping an hour, then folds the held changes into the next one; a new Needs-you item always goes through', async () => {
    const root = repoRoot();
    const w = world();
    await run(w, root, T0);
    w.state.merged = [pull(20, 'feat(web): a')];
    expect((await run(w, root, T0 + 10 * MIN)).post).not.toHaveBeenCalled();
    w.state.merged = [pull(21, 'feat(web): b'), pull(20, 'feat(web): a')];
    const later = await run(w, root, T0 + 61 * MIN);
    expect(later.post).toHaveBeenCalledTimes(1);
    expect(later.post.mock.calls[0][0]).toContain('2 shipped');

    writeFileSync(path.join(root, 'HUMAN-ACTIONS.md'), `${HA}\n## #92 🟡 [DECIDE] New (~5 min)\n<!-- ha filed=2026-10-01 -->\n\n**Why:** n.\n**Steps:**\n1. d.\n**Worked if:** r.\n`);
    const added = await run(w, root, T0 + 65 * MIN);
    expect(added.post).toHaveBeenCalledTimes(1);
    expect(added.post.mock.calls[0][0]).toContain('+1 needs you');
  });

  it('keeps the baseline (so the next render retries) when Discord refuses or no webhook is set', async () => {
    const root = repoRoot();
    const w = world();
    await run(w, root, T0);
    w.state.merged = [pull(20, 'feat(web): a')];
    const refused = await run(w, root, T0 + 120 * MIN, { post: vi.fn(async () => ({ ok: false })) });
    expect(refused.post).toHaveBeenCalledTimes(1);
    expect(readPingState(w.state.body)).toMatchObject({ at: new Date(T0).toISOString() });
    const noHook = await run(w, root, T0 + 121 * MIN, { env: { GITHUB_REPOSITORY: REPO } });
    expect(noHook.post).not.toHaveBeenCalled();
    expect(readPingState(w.state.body)).toMatchObject({ at: new Date(T0).toISOString() });
    const retried = await run(w, root, T0 + 122 * MIN);
    expect(retried.post).toHaveBeenCalledTimes(1);
    expect(readPingState(w.state.body)).toMatchObject({ at: new Date(T0 + 122 * MIN).toISOString() });
  });

  it('falls back to email only where the mail credentials are present (the morning brief)', async () => {
    const root = repoRoot();
    const w = world();
    await run(w, root, T0);
    w.state.merged = [pull(20, 'feat(web): a')];
    const mail = vi.fn(() => 'email');
    const env = { GITHUB_REPOSITORY: REPO, DISCORD_MARJORIE_WEBHOOK_URL: 'https://discord.test/hook', MARJORIE_EMAIL: 'a@b.c', GMAIL_APP_PASSWORD: 'x' };
    const out = await run(w, root, T0 + 120 * MIN, { post: vi.fn(async () => ({ ok: false })), env, mail });
    expect(mail).toHaveBeenCalledWith('Status updated', expect.stringContaining('1 shipped'), `https://github.com/${REPO}/issues/4`, expect.anything());
    expect(readPingState(w.state.body)).toMatchObject({ at: new Date(T0 + 120 * MIN).toISOString() });
    expect(out.code).toBe(0);
  });

  it('a plain --apply (the reply job) never posts and never moves the baseline', async () => {
    const root = repoRoot();
    const w = world();
    await run(w, root, T0);
    const before = readPingState(w.state.body);
    w.state.merged = [pull(20, 'feat(web): a')];
    const post = vi.fn();
    await main(['--apply'], { api: w.api, gh: w.gh, root, now: T0 + 300 * MIN, log: vi.fn(), post, env: { GITHUB_REPOSITORY: REPO, DISCORD_MARJORIE_WEBHOOK_URL: 'x' } });
    expect(post).not.toHaveBeenCalled();
    expect(readPingState(w.state.body)).toEqual(before);
  });
});

describe('status-traffic.mjs (the only code that holds VERCEL_TOKEN)', () => {
  const vercel = (over: Record<string, unknown> = {}) => vi.fn(async (url: URL) => {
    const u = String(url);
    const dim = new URL(u).searchParams.get('by');
    const data = u.includes('/count')
      ? { pageviews: 300, visitors: 90 }
      : [{ [dim as string]: dim === 'requestPath' ? '/era/midnights' : 'google.com', pageviews: 40, visitors: 20 }];
    return { ok: true, status: 200, json: async () => ({ data }), ...over };
  });
  const go = (w: ReturnType<typeof world>, now: number, env: Record<string, string>, fetchImpl: unknown) => {
    const log = vi.fn();
    return trafficMain({ api: w.api, gh: w.gh, now, log, env: { GITHUB_REPOSITORY: REPO, VERCEL_PROJECT_ID: 'prj_1', ...env }, fetchImpl, root: repoRoot() }).then(() => log);
  };

  it('caches the numbers in the status issue, then leaves a fresh cache alone', async () => {
    const w = world();
    const fetchImpl = vercel();
    const log = await go(w, T0, { VERCEL_TOKEN: 'tok-secret' }, fetchImpl);
    expect(readTraffic(w.state.body)).toMatchObject({ v: 90, pv: 300 });
    expect(readTraffic(w.state.body).paths).toEqual([{ l: '/era/midnights', v: 40 }]);
    expect(fetchImpl).toHaveBeenCalled();
    const calls = fetchImpl.mock.calls.length;
    const again = await go(w, T0 + 5 * 60 * MIN, { VERCEL_TOKEN: 'tok-secret' }, fetchImpl);
    expect(fetchImpl.mock.calls.length).toBe(calls);
    expect(again.mock.calls.flat().join(' ')).toContain('fresh');
    expect(log.mock.calls.flat().join(' ')).not.toContain('tok-secret');
  });
  it('refreshes after twenty hours', async () => {
    const w = world();
    await go(w, T0, { VERCEL_TOKEN: 't' }, vercel());
    const next = vercel();
    await go(w, T0 + 21 * 60 * MIN, { VERCEL_TOKEN: 't' }, next);
    expect(next).toHaveBeenCalled();
    expect(readTraffic(w.state.body).at).toBe(new Date(T0 + 21 * 60 * MIN).toISOString());
  });
  it('without a token, or when Vercel fails, keeps what it had and never prints the token', async () => {
    const w = world();
    const none = await go(w, T0, {}, vercel());
    expect(none.mock.calls.flat().join(' ')).toContain('VERCEL_TOKEN is not set');
    expect(readTraffic(w.state.body)).toBeNull();
    await go(w, T0, { VERCEL_TOKEN: 'tok-secret' }, vercel());
    const kept = readTraffic(w.state.body);
    const failing = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    const fail = await go(w, T0 + 30 * 60 * MIN, { VERCEL_TOKEN: 'tok-secret' }, failing);
    expect(fail.mock.calls.flat().join(' ')).toContain('keeping the previous numbers');
    expect(fail.mock.calls.flat().join(' ')).not.toContain('tok-secret');
    expect(readTraffic(w.state.body)).toEqual(kept);
  });
  it('the page then shows the site numbers under Growth', async () => {
    const w = world();
    await go(w, T0, { VERCEL_TOKEN: 't' }, vercel());
    await main(['--apply'], { api: w.api, gh: w.gh, root: repoRoot(), now: T0 + MIN, log: vi.fn(), env: { GITHUB_REPOSITORY: REPO } });
    expect(w.state.body).toContain('- Visitors: **90**');
    expect(w.state.body).toContain('- Top pages: /era/midnights (40)');
    expect(readTraffic(w.state.body)).toMatchObject({ v: 90 });
  });
});

describe('status-note.mjs write-recap', () => {
  it('writes the fan recap, which then survives a re-render', async () => {
    const w = world();
    await noteMain(['write-recap', '--body-file', 'r.md'], { api: w.api, gh: w.gh, log: vi.fn(), env: { GITHUB_REPOSITORY: REPO }, read: () => '- Midnights has a new moment\n- Sharing is easier @bob' });
    expect(readRecap(w.state.body)).toBe('- Midnights has a new moment\n- Sharing is easier @​bob');
    await main(['--apply'], { api: w.api, gh: w.gh, root: repoRoot(), now: T0, log: vi.fn(), env: { GITHUB_REPOSITORY: REPO } });
    expect(readRecap(w.state.body)).toBe('- Midnights has a new moment\n- Sharing is easier @​bob');
    expect(w.state.body).toContain('<!-- fan-recap:start -->\n- Midnights has a new moment');
  });
});
