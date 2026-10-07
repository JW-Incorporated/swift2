import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { main } from './status-page.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { main as noteMain } from './status-note.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { ensureStatusIssue, findStatusIssue, pinIssue, replaceNote, stampPing, STATUS_TITLE } from './lib/status-issue.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { readPreserved, renderStatusPage } from './lib/status-render.mjs';

const REPO = 'o/r';
const NOW = Date.parse('2026-09-30T20:00:00Z');
const issueRow = (number: number, body = '', over: Record<string, unknown> = {}) => ({
  number, title: STATUS_TITLE, html_url: `https://github.com/${REPO}/issues/${number}`, body, state: 'open', labels: [{ name: 'status-page' }], ...over,
});

function fakeApi(issues: unknown[] = []) {
  return vi.fn(async (p: string) => {
    if (p.includes('/issues?')) return issues;
    return [];
  });
}

describe('status issue lifecycle', () => {
  it('uses the oldest open status issue when there is more than one', async () => {
    const found = await findStatusIssue(fakeApi([issueRow(9), issueRow(4)]), REPO);
    expect(found.number).toBe(4);
  });

  it('creates the issue once when missing, labeled, and tries to pin it', async () => {
    const gh = vi.fn(async (args: string[]) => {
      if (args.includes('POST')) return { stdout: JSON.stringify({ number: 77, node_id: 'NODE', html_url: 'https://github.com/o/r/issues/77' }) };
      return { stdout: '{}' };
    });
    const log = vi.fn();
    const out = await ensureStatusIssue({ api: fakeApi([]), gh, repo: REPO, log });
    expect(out).toMatchObject({ created: true, pinned: true, issue: { number: 77 } });
    const create = gh.mock.calls[0][0] as string[];
    expect(create).toContain(`title=${STATUS_TITLE}`);
    expect(create).toContain('labels[]=status-page');
    expect((gh.mock.calls[1][0] as string[]).join(' ')).toContain('pinIssue');
  });

  it('tolerates a failed pin', async () => {
    const gh = vi.fn(async (args: string[]) => {
      if (args.includes('graphql')) throw new Error('Resource not accessible by integration');
      return { stdout: JSON.stringify({ number: 3, node_id: 'N', html_url: 'u' }) };
    });
    const out = await ensureStatusIssue({ api: fakeApi([]), gh, repo: REPO });
    expect(out).toMatchObject({ created: true, pinned: false });
    expect(await pinIssue(gh, 'x')).toBe(false);
  });

  it('does not create a second issue when one exists', async () => {
    const gh = vi.fn();
    const out = await ensureStatusIssue({ api: fakeApi([issueRow(4)]), gh, repo: REPO });
    expect(out.created).toBe(false);
    expect(gh).not.toHaveBeenCalled();
  });
});

describe('note and ping regions', () => {
  const page = renderStatusPage({
    haMarkdown: '', mergedPrs: [], openPrs: [], plan: null, posted: [], draftPrs: [], metricsLatest: null, metricsPrior: null,
    note: { text: '', date: '' }, ping: null, warnings: [],
  }, { now: NOW, repo: REPO });

  it('replaces only the note region and dates it', () => {
    const next = replaceNote(page, { text: 'Today: ship it @sffan15-sys', date: '2026-09-30' });
    expect(readPreserved(next).note).toEqual({ text: 'Today: ship it @​sffan15-sys', date: '2026-09-30' });
    expect(next.replace(/<!-- marjorie-note:start[\s\S]*<!-- marjorie-note:end -->/, '')).toBe(page.replace(/<!-- marjorie-note:start[\s\S]*<!-- marjorie-note:end -->/, ''));
  });
  it('adds the section when a body has none', () => {
    expect(readPreserved(replaceNote('# bare\n', { text: 'hello', date: '2026-09-30' })).note.text).toBe('hello');
  });
  it('stamps the ping once per body, replacing an earlier stamp', () => {
    const once = stampPing(page, { date: '2026-09-29', msg: '5' });
    const twice = stampPing(once, { date: '2026-09-30', msg: '' });
    expect(readPreserved(twice).ping).toEqual({ date: '2026-09-30', msg: '' });
    expect(twice.match(/marjorie-ping/g)).toHaveLength(1);
  });
});

describe('status-page.mjs', () => {
  it('--dry-run prints the body and never writes', async () => {
    const gh = vi.fn();
    const log = vi.fn();
    const code = await main(['--dry-run'], { api: fakeApi([]), gh, root: process.cwd(), now: NOW, log, env: { GITHUB_REPOSITORY: REPO } });
    expect(code).toBe(0);
    expect(gh).not.toHaveBeenCalled();
    expect(log.mock.calls[0][0]).toContain('# 📋 Long Live — Status');
  });
  it('--apply rewrites the existing issue body, keeping its note', async () => {
    const existing = replaceNote('# old\n', { text: 'keep me', date: '2026-09-30' });
    const gh = vi.fn(async () => ({ stdout: '{}' }));
    const code = await main(['--apply'], { api: fakeApi([issueRow(4, existing)]), gh, root: process.cwd(), now: NOW, log: vi.fn(), env: { GITHUB_REPOSITORY: REPO } });
    expect(code).toBe(0);
    const patch = gh.mock.calls.find(([args]) => (args as string[]).includes('PATCH'))![0] as string[];
    expect(patch).toContain('repos/o/r/issues/4');
    expect(patch.some((a) => a.startsWith('body=@'))).toBe(true);
  });
  it('refuses without a mode', async () => {
    expect(await main([], { api: fakeApi(), gh: vi.fn(), log: vi.fn(), env: {} })).toBe(2);
  });
});

describe('status-note.mjs', () => {
  const stateful = (body: string) => {
    let current = body;
    const api = vi.fn(async () => [issueRow(4, current)]);
    const gh = vi.fn(async (args: string[]) => {
      const file = args.find((a) => a.startsWith('body=@'))!.slice(6);
      current = readFileSync(file, 'utf8');
      return { stdout: '{}' };
    });
    return { api, gh, get body() { return current; } };
  };
  const NOTE_NOW = new Date('2026-09-30T20:00:00Z');

  it('write sets today\'s note and verifies it stuck', async () => {
    const s = stateful('# page\n');
    const log = vi.fn();
    await noteMain(['write', '--body-file', 'n.md'], { api: s.api, gh: s.gh, log, now: NOTE_NOW, env: { GITHUB_REPOSITORY: REPO }, read: () => 'Judgment.' });
    expect(readPreserved(s.body).note).toEqual({ text: 'Judgment.', date: '2026-09-30' });
  });
  it('write fails loudly when a concurrent render keeps overwriting it', async () => {
    const api = vi.fn(async () => [issueRow(4, '# stale\n')]);
    const gh = vi.fn(async () => ({ stdout: '{}' }));
    await expect(noteMain(['write', '--body-file', 'n.md'], { api, gh, log: vi.fn(), now: NOTE_NOW, env: { GITHUB_REPOSITORY: REPO }, read: () => 'x' })).rejects.toThrow(/did not stick/);
  });
  it('today is 1 only for a note or ping dated today', async () => {
    const dated = (d: string) => replaceNote('# p\n', { text: 't', date: d });
    const run = async (body: string | null) => {
      const log = vi.fn();
      await noteMain(['today'], { api: fakeApi(body === null ? [] : [issueRow(4, body)]), gh: vi.fn(), log, now: NOTE_NOW, env: { GITHUB_REPOSITORY: REPO } });
      return log.mock.calls[0][0];
    };
    expect(await run(dated('2026-09-30'))).toBe('1');
    expect(await run(dated('2026-09-29'))).toBe('0');
    expect(await run(stampPing('# p\n', { date: '2026-09-30', msg: '' }))).toBe('1');
    expect(await run(null)).toBe('0');
  });
  it('extract saves the note text and prints the issue url', async () => {
    const write = vi.fn();
    const log = vi.fn();
    await noteMain(['extract', '--out', 'o.md'], { api: fakeApi([issueRow(4, replaceNote('# p\n', { text: 'the note', date: '2026-09-30' }))]), gh: vi.fn(), log, write, now: NOTE_NOW, env: { GITHUB_REPOSITORY: REPO } });
    expect(write).toHaveBeenCalledWith('o.md', 'the note\n');
    expect(log).toHaveBeenCalledWith(`status-issue: 4 https://github.com/${REPO}/issues/4`);
  });
});
