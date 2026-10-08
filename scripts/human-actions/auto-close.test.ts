import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { closeRecord, evaluate, evaluateAll, main, parseVerify, skippedNumbers } from './auto-close.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { warnings } from './check.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { closeHumanAction } from '../marjorie/ha-close.mjs';

const item = (n: number, extra = '', worked = 'it works') =>
  [`## #${n} 🟢 [UPGRADE] Item ${n} (~5 min)`, '<!-- ha filed=2026-10-01 -->', ...(extra ? [extra] : []), '', '**Why:** r', `**Worked if:** ${worked}`, ''].join('\n');
const OPEN = ['# Human actions — Swift2', '', '> **5 open.** Closed items', '', item(5, '<!-- ha verify: secret-exists FOO_KEY -->'), item(4), item(3, '<!-- ha verify: issue-closed 12 -->'), item(2, '<!-- ha verify: rm -rf / -->')].join('\n');
const DONE = ['# Done', '', '- #6 · 2026-10-01 · skip · Old — "no" · by owner'].join('\n');

const fakeGh = (answers: Record<string, string | Error>) => (args: string[]) => {
  const key = args.slice(0, 2).join(' ');
  const a = answers[key];
  if (a === undefined || a instanceof Error) throw a ?? new Error('no answer');
  return a;
};

describe('parseVerify', () => {
  it('accepts each safe kind and rejects anything else', () => {
    expect(parseVerify('secret-exists FOO_KEY')?.label).toBe('secret-exists FOO_KEY');
    expect(parseVerify('variable-equals MODE live')?.args).toEqual(['MODE', 'live']);
    expect(parseVerify('pr-merged 12')).toBeTruthy();
    expect(parseVerify('issue-closed 12')).toBeTruthy();
    expect(parseVerify('workflow-green db-seed.yml')).toBeTruthy();
    for (const bad of ['rm -rf /', 'secret-exists a b', 'pr-merged x', 'workflow-green ../x.yml', 'workflow-green -x.yml', 'variable-equals A -x', 'variable-equals A $(id)', 'secret-exists A;ls', '']) {
      expect(parseVerify(bad)).toBeNull();
    }
  });
});

describe('evaluate', () => {
  const repo = 'o/r';
  it('secret-exists pass / fail / unreadable', () => {
    const v = parseVerify('secret-exists FOO_KEY');
    expect(evaluate(v, { repo, gh: fakeGh({ 'secret list': '[{"name":"FOO_KEY"}]' }) })).toBe('pass');
    expect(evaluate(v, { repo, gh: fakeGh({ 'secret list': '[{"name":"OTHER"}]' }) })).toBe('fail');
    expect(evaluate(v, { repo, gh: fakeGh({ 'secret list': new Error('403') }) })).toBe('skip');
  });
  it('variable-equals pass / fail / unreadable', () => {
    const v = parseVerify('variable-equals MODE live');
    expect(evaluate(v, { repo, gh: fakeGh({ 'variable get': 'live\n' }) })).toBe('pass');
    expect(evaluate(v, { repo, gh: fakeGh({ 'variable get': 'dry' }) })).toBe('fail');
    expect(evaluate(v, { repo, gh: fakeGh({}) })).toBe('skip');
  });
  it('pr-merged pass / fail', () => {
    const v = parseVerify('pr-merged 7');
    expect(evaluate(v, { repo, gh: fakeGh({ 'pr view': '{"state":"MERGED"}' }) })).toBe('pass');
    expect(evaluate(v, { repo, gh: fakeGh({ 'pr view': '{"state":"OPEN"}' }) })).toBe('fail');
  });
  it('issue-closed pass / fail', () => {
    const v = parseVerify('issue-closed 7');
    expect(evaluate(v, { repo, gh: fakeGh({ 'issue view': '{"state":"CLOSED","stateReason":"COMPLETED"}' }) })).toBe('pass');
    expect(evaluate(v, { repo, gh: fakeGh({ 'issue view': '{"state":"OPEN"}' }) })).toBe('fail');
  });
  it('issue-closed requires COMPLETED, not not-planned', () => {
    const v = parseVerify('issue-closed 7');
    expect(evaluate(v, { repo, gh: fakeGh({ 'issue view': '{"state":"CLOSED","stateReason":"NOT_PLANNED"}' }) })).toBe('fail');
  });
  it('workflow-green reads main only and ignores pull_request runs', () => {
    const v = parseVerify('workflow-green db-seed.yml');
    let seen: string[] = [];
    const gh = (args: string[]) => {
      seen = args;
      return '[{"conclusion":"success","event":"pull_request"},{"conclusion":"failure","event":"push"}]';
    };
    expect(evaluate(v, { repo, gh })).toBe('fail');
    expect(seen).toContain('--branch');
    expect(seen[seen.indexOf('--branch') + 1]).toBe('main');
    const ok = () => '[{"conclusion":"failure","event":"pull_request"},{"conclusion":"success","event":"schedule"}]';
    expect(evaluate(v, { repo, gh: ok })).toBe('pass');
  });
  it('workflow-green pass / fail / no runs', () => {
    const v = parseVerify('workflow-green db-seed.yml');
    expect(evaluate(v, { repo, gh: fakeGh({ 'run list': '[{"conclusion":"success"}]' }) })).toBe('pass');
    expect(evaluate(v, { repo, gh: fakeGh({ 'run list': '[{"conclusion":"failure"}]' }) })).toBe('fail');
    expect(evaluate(v, { repo, gh: fakeGh({ 'run list': '[]' }) })).toBe('fail');
  });
});

describe('evaluateAll', () => {
  const gh = fakeGh({ 'secret list': '[{"name":"FOO_KEY"}]', 'issue view': '{"state":"OPEN"}' });
  it('passes only entries whose check passes; no verify line, bad line untouched', () => {
    const r = evaluateAll(OPEN, DONE, { gh, repo: 'o/r' });
    expect(r.passed).toEqual([{ number: 5, label: 'secret-exists FOO_KEY' }]);
    expect(r.failed).toEqual([3]);
    expect(r.ignored).toEqual([4]);
    expect(r.skipped.map((s: { number: number }) => s.number)).toEqual([2]);
  });
  it('never touches an entry the owner skipped', () => {
    expect(skippedNumbers(DONE)).toEqual(new Set([6]));
    const open = `${OPEN}\n${item(6, '<!-- ha verify: secret-exists FOO_KEY -->')}`;
    const r = evaluateAll(open, DONE, { gh, repo: 'o/r' });
    expect(r.passed.map((p: { number: number }) => p.number)).toEqual([5]);
  });
});

describe('closing through the shared close path', () => {
  it('writes the ledger line and is idempotent', () => {
    const rec = closeRecord({ number: 5, label: 'secret-exists FOO_KEY' }, '2026-10-06');
    expect(rec.note).toBe('auto-closed: secret-exists FOO_KEY passed 2026-10-06');
    const first = closeHumanAction(OPEN, DONE, { number: rec.n, date: rec.d, note: rec.note, by: rec.by, outcome: rec.o });
    expect(first.ok).toBe(true);
    expect(first.done).toContain('#5 · 2026-10-06 · done');
    expect(first.done).toContain('auto-closed: secret-exists FOO_KEY passed 2026-10-06');
    expect(first.open).toContain('**4 open.**'.replace('4', String((first.open.match(/^## #/gm) || []).length)));
    const again = closeHumanAction(first.open, first.done, { number: rec.n, date: rec.d, note: rec.note, by: rec.by, outcome: rec.o });
    expect(again.ok).toBe(false);
    expect(evaluateAll(first.open, first.done, { gh: fakeGh({ 'secret list': '[{"name":"FOO_KEY"}]', 'issue view': '{"state":"OPEN"}' }), repo: 'o/r' }).passed).toEqual([]);
  });
});

describe('check:human-actions warnings', () => {
  it('warns on a checkable Worked-if with no verify line, and on a bad kind; quiet otherwise', () => {
    const md = [
      item(9, '', 'the secret FOO_KEY exists in repo settings'),
      item(8, '<!-- ha verify: pr-merged 3 -->', 'PR #3 is merged'),
      item(7, '', 'Joey replies with a choice'),
      item(6, '<!-- ha verify: shell echo hi -->', 'x'),
    ].join('\n');
    const w = warnings(md);
    expect(w).toHaveLength(2);
    expect(w[0]).toContain('#9');
    expect(w[1]).toContain('#6');
  });
});

describe('main: OPS_FIXER_PAT scoping', () => {
  it('gives the PAT only to the settings read, never to git/PR calls', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ha-auto-'));
    writeFileSync(join(root, 'HUMAN-ACTIONS.md'), OPEN);
    writeFileSync(join(root, 'HUMAN-ACTIONS-DONE.md'), DONE);
    const calls: { cmd: string; args: string[]; env: Record<string, string | undefined> }[] = [];
    const exec = (cmd: string, args: string[], opts: { env: Record<string, string | undefined> }) => {
      calls.push({ cmd, args, env: opts.env });
      if (cmd === 'gh' && args[0] === 'secret') return '[{"name":"FOO_KEY"}]';
      if (cmd === 'gh' && args[0] === 'issue') return '{"state":"OPEN"}';
      if (cmd === 'gh' && args[0] === 'pr' && args[1] === 'list') return '[]';
      if (cmd === 'gh' && args[0] === 'pr' && args[1] === 'create') return 'https://github.com/o/r/pull/1';
      return '';
    };
    const env = { GH_TOKEN: 'wf', PR_TOKEN: 'pr', OPS_FIXER_PAT: 'pat', GITHUB_REPOSITORY: 'o/r' };
    const code = await main({ env, root, exec, log: () => {}, now: new Date('2026-10-06T00:00:00Z'), argv: [] });
    expect(code).toBe(0);
    const withPat = calls.filter((c) => Object.values(c.env).includes('pat'));
    expect(withPat).toHaveLength(1);
    expect(withPat[0].args.slice(0, 2)).toEqual(['secret', 'list']);
    expect(withPat[0].env.GH_TOKEN).toBe('pat');
    expect(calls.some((c) => c.cmd === 'git' && c.args[0] === 'push')).toBe(true);
    expect(calls.filter((c) => c.env.OPS_FIXER_PAT !== undefined)).toEqual([]);
  });
});
