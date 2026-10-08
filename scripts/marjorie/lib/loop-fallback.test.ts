import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { fallbackBody, isAnswered, postMissingDispositions, queueNumbers } from './loop-fallback.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { FALLBACK_MARKER, parseDisposition } from './loop-queue.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { guardDispositions } from '../loop-live.mjs';

const claude = (body: string) => ({ id: 1, user: { login: 'claude' }, body });
const workflow = (body: string) => ({ id: 2, user: { login: 'github-actions' }, body });
const stranger = (body: string) => ({ id: 3, user: { login: 'someone' }, body });

function fakeGh(comments: Record<number, unknown[]>, { failComment = [] as number[] } = {}) {
  const calls: string[][] = [];
  const gh = vi.fn(async (args: string[]) => {
    calls.push(args);
    if (args[0] === 'api') {
      const m = /issues\/(\d+)\/comments/.exec(args[1]);
      if (!m) return { stdout: '[]' };
      if (comments[Number(m[1])] === undefined) throw new Error('404');
      return { stdout: JSON.stringify(comments[Number(m[1])]) };
    }
    if (args[0] === 'issue' && args[1] === 'comment' && failComment.includes(Number(args[2]))) throw new Error('403 forbidden');
    return { stdout: '' };
  });
  return { gh, calls };
}
const writes = (calls: string[][]) => calls.filter((c) => c[0] === 'issue').map((c) => c.slice(0, 3).join(' '));
const quiet = () => vi.fn();

describe('fallbackBody', () => {
  it('opens with a parseable Disposition line and names the right bots', () => {
    expect(fallbackBody('tree')).toMatch(/^Disposition: NEEDS HELP — Tree's run ended without answering this ask; Marjorie will re-raise it\./);
    expect(fallbackBody('marjorie')).toMatch(/^Disposition: NEEDS HELP — Marjorie's run ended without answering this ask; Tree will re-raise it\./);
    expect(fallbackBody('tree')).toContain(FALLBACK_MARKER);
  });
});

describe('answered detection', () => {
  it('counts claude Dispositions of any word and the workflow fallback, nothing else', () => {
    expect(isAnswered([claude('Disposition: DOING IT\nx')], 'tree')).toBe(true);
    expect(isAnswered([claude('Disposition: NEEDS HELP')], 'marjorie')).toBe(true); // a word outside Marjorie's set is still an answer
    expect(isAnswered([workflow(fallbackBody('tree'))], 'tree')).toBe(true);
    expect(isAnswered([workflow(fallbackBody('marjorie'))], 'marjorie')).toBe(true);
    expect(isAnswered([], 'tree')).toBe(false);
    expect(isAnswered([claude('thinking about it')], 'tree')).toBe(false);
    expect(isAnswered([stranger('Disposition: CAN\'T'), stranger(fallbackBody('tree'))], 'tree')).toBe(false);
    expect(isAnswered([workflow('Disposition: CAN\'T')], 'tree')).toBe(false);
  });
  it('lets parseDisposition treat the workflow fallback as NEEDS HELP, but only from the workflow identity', () => {
    expect(parseDisposition([workflow(fallbackBody('marjorie'))], 'marjorie')).toMatchObject({ disposition: 'NEEDS HELP', fallback: true });
    expect(parseDisposition([stranger(fallbackBody('tree'))], 'tree')).toBeNull();
  });
});

describe('queueNumbers', () => {
  it('reads item numbers, deduplicated, and shrugs at malformed files', () => {
    expect(queueNumbers({ items: [{ number: 4675 }, { number: 4675 }, { number: 'x' }, {}, { number: 9 }] })).toEqual([4675, 9]);
    expect(queueNumbers({ items: [], error: 'boom' })).toEqual([]);
    expect(queueNumbers(null)).toEqual([]);
    expect(queueNumbers({ items: 'nope' })).toEqual([]);
  });
});

describe('postMissingDispositions', () => {
  it('comments and labels only the asks with no Disposition', async () => {
    const { gh, calls } = fakeGh({ 1: [claude('Disposition: DOING IT')], 2: [{ id: 5, user: { login: 'github-actions' }, body: 'Started Tree\'s response routine' }], 3: [stranger('Disposition: DECLINE')] });
    const out = await postMissingDispositions('tree', [1, 2, 3], { repo: 'o/r', gh, log: quiet() });
    expect(out).toEqual({ posted: [2, 3], answered: [1], failed: [] });
    expect(writes(calls)).toEqual(['issue comment 2', 'issue edit 2', 'issue comment 3', 'issue edit 3']);
    expect(calls.find((c) => c[1] === 'edit')).toEqual(['issue', 'edit', '2', '--repo', 'o/r', '--add-label', 'loop:needs-help']);
    expect(calls.find((c) => c[1] === 'comment')?.[6]).toBe(fallbackBody('tree'));
  });

  it('is idempotent: a second pass finds its own fallback and posts nothing', async () => {
    const { gh, calls } = fakeGh({ 7: [workflow(fallbackBody('marjorie'))] });
    const out = await postMissingDispositions('marjorie', [7], { repo: 'o/r', gh, log: quiet() });
    expect(out.posted).toEqual([]);
    expect(writes(calls)).toEqual([]);
  });

  it('never throws: an unreadable ask is skipped unposted, a failed comment is not labelled', async () => {
    const { gh, calls } = fakeGh({ 2: [], 3: [] }, { failComment: [3] });
    const log = quiet();
    const out = await postMissingDispositions('tree', [1, 2, 3], { repo: 'o/r', gh, log });
    expect(out).toEqual({ posted: [2], answered: [], failed: [1, 3] });
    expect(writes(calls)).toEqual(['issue comment 2', 'issue edit 2', 'issue comment 3']);
    expect(log.mock.calls.flat().join('\n')).toContain('::warning::loop-fallback: #1');
  });

  it('a label failure after the comment still counts as posted', async () => {
    const { gh } = fakeGh({ 2: [] });
    gh.mockImplementation(async (args: string[]) => {
      if (args[0] === 'api') return { stdout: '[]' };
      if (args[1] === 'edit') throw new Error('label missing');
      return { stdout: '' };
    });
    const out = await postMissingDispositions('tree', [2], { repo: 'o/r', gh, log: quiet() });
    expect(out.posted).toEqual([2]);
  });
});

describe('guard-dispositions CLI', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'loop-fallback-'));
  const log = () => vi.spyOn(console, 'log').mockImplementation(() => {});

  it('reads the queue artifact and posts the fallback for an unanswered ask', async () => {
    const file = path.join(dir, 'ask-queue.json');
    writeFileSync(file, JSON.stringify({ bot: 'tree', items: [{ number: 4675 }] }));
    const { gh, calls } = fakeGh({ 4675: [workflow('Started Tree\'s response routine for this ask.\n\n<!-- loop-dispatched: to-tree depth=0 -->')] });
    const spy = log();
    expect(await guardDispositions({ for: 'tree', queue: file }, { gh })).toBe(0);
    spy.mockRestore();
    expect(writes(calls)).toContain('issue comment 4675');
    expect(calls.some((c) => c[0] === 'label' && c.includes('loop:needs-help'))).toBe(true);
  });

  it('exits 0 with nothing posted when the queue file is missing or empty', async () => {
    const { gh, calls } = fakeGh({});
    const spy = log();
    expect(await guardDispositions({ for: 'tree', queue: path.join(dir, 'missing.json') }, { gh })).toBe(0);
    const empty = path.join(dir, 'empty.json');
    writeFileSync(empty, JSON.stringify({ items: [] }));
    expect(await guardDispositions({ for: 'marjorie', queue: empty }, { gh })).toBe(0);
    spy.mockRestore();
    expect(calls).toEqual([]);
  });

  it('rejects a bad --for', async () => {
    await expect(guardDispositions({ for: 'nobody', queue: 'x' }, { gh: vi.fn() })).rejects.toThrow('--for');
  });
});
