import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { HEADINGS, MAX_DIRECTION_CHARS, STRATEGY_FILE, addOwnerDirection, rebaseOntoMain, validateStrategy } from './lib/strategy-doc.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { judgeDirectionPr, main, newChangelogLines } from './strategy-doc.mjs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const real = read(STRATEGY_FILE);
const dirs: string[] = [];
const tmp = () => {
  const d = mkdtempSync(path.join(tmpdir(), 'strat-'));
  dirs.push(d);
  return d;
};
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  vi.restoreAllMocks();
});
const quiet = () => vi.spyOn(console, 'log').mockImplementation(() => {});

const OWNER_LINE = '- **2026-10-01** (Joey) — "grow first"';
const doc = (over: Record<string, string> = {}) =>
  [
    '# Title',
    '',
    '## Summary',
    over.summary ?? '- one\n- two',
    '',
    '## Audience',
    'fans',
    '',
    '## How we grow (bets, ranked, each with the metric that proves/kills it)',
    over.bets ?? '1. bet',
    '',
    '## Content strategy',
    'craft',
    '',
    '## What we stopped and why',
    '- thing',
    '',
    '## Owner direction (standing)',
    over.owner ?? `*Steer in the channel.*\n\n${OWNER_LINE}`,
    '',
    '## Changelog',
    over.changelog ?? '- 2026-10-01 — first',
    '',
  ].join('\n');

describe('docs/strategy/growth-strategy.md (the file on main)', () => {
  it('is well-formed: the seven headings in order, a Summary of at most six bullets, dated changelog', () => {
    expect(validateStrategy(real)).toEqual([]);
  });
  it('carries the owner’s standing directions and no placeholder text', () => {
    expect(real).toContain('## Owner direction (standing)');
    expect(real).toMatch(/I still have no idea what Marjorie's strategy is/);
    expect(real).not.toMatch(/TODO|TBD|lorem/i);
  });
  it('is on the content auto-merge allowlist as exactly this one file', () => {
    expect(read('.github/content-automerge-allowlist.txt')).toMatch(/^docs\/strategy\/growth-strategy\.md$/m);
  });
});

describe('validateStrategy', () => {
  it('accepts a minimal well-formed file', () => {
    expect(validateStrategy(doc())).toEqual([]);
  });
  it('rejects a missing, extra or reordered heading', () => {
    expect(validateStrategy(doc().replace('## Audience', '## Who'))[0]).toMatch(/headings must be exactly/);
    expect(validateStrategy(`${doc()}\n## Extra\nx\n`)[0]).toMatch(/headings must be exactly/);
  });
  it('caps the Summary at six bullets and allows only bullets there', () => {
    expect(validateStrategy(doc({ summary: '- 1\n- 2\n- 3\n- 4\n- 5\n- 6\n- 7' })).join()).toMatch(/1 to 6 bullets/);
    expect(validateStrategy(doc({ summary: '- 1\nprose line' })).join()).toMatch(/only bullets/);
    expect(validateStrategy(doc({ summary: '' })).join()).toMatch(/1 to 6 bullets/);
  });
  it('requires a dated changelog line', () => {
    expect(validateStrategy(doc({ changelog: 'nothing' })).join()).toMatch(/dated line/);
  });
  it('keeps the Owner direction bullet set EXACTLY main’s: no removal, no edit, no addition', () => {
    const prev = doc();
    expect(validateStrategy(doc({ owner: '- **2026-10-02** — "other"' }), prev).join()).toMatch(/Owner direction \(standing\) lost a line/);
    expect(validateStrategy(doc({ owner: OWNER_LINE.replace('grow first', 'grow SECOND') }), prev).join()).toMatch(/lost a line/);
    const forged = doc({ owner: `${OWNER_LINE}\n- **2026-10-02** (Joey) — "forged by the rewrite"` });
    expect(validateStrategy(forged, prev).join()).toMatch(/has a line main lacks/);
    expect(validateStrategy(doc(), prev)).toEqual([]);
  });
  it('lets only add-direction’s output (ownerAppend) grow the Owner direction set', () => {
    const grown = doc({ owner: `${OWNER_LINE}\n- **2026-10-02** (Joey) — "more"` });
    expect(validateStrategy(grown, doc(), { ownerAppend: true })).toEqual([]);
    expect(validateStrategy(grown, doc()).join()).toMatch(/has a line main lacks/);
  });
  it('keeps the Changelog append-only', () => {
    const prev = doc();
    expect(validateStrategy(doc({ changelog: '- 2026-10-02 — new only' }), prev).join()).toMatch(/Changelog lost a line/);
    expect(validateStrategy(doc({ changelog: '- 2026-10-01 — first\n- 2026-10-02 — second' }), prev)).toEqual([]);
  });
  it('ignores `## ` lines inside code fences', () => {
    expect(validateStrategy(doc({ summary: '- ok\n```\n## fake\n```' }))[0]).toMatch(/only bullets/);
  });
  it('names every required heading', () => {
    expect(HEADINGS).toHaveLength(7);
  });
});

describe('addOwnerDirection', () => {
  it('appends the words verbatim with the date and author label, adds a changelog line, and stays valid', () => {
    const { text, added } = addOwnerDirection(doc(), { direction: 'Focus on Reddit\nfirst', date: '2026-10-02', author: 'Joey' });
    expect(added).toBe(true);
    expect(text).toContain('- **2026-10-02** (Joey) — Focus on Reddit first');
    expect(text).toMatch(/- 2026-10-02 — Owner direction added/);
    expect(validateStrategy(text, doc(), { ownerAppend: true })).toEqual([]);
    const lines = text.split('\n');
    expect(lines.indexOf('## Changelog')).toBeGreaterThan(lines.findIndex((l) => l.includes('Focus on Reddit first')));
  });
  it('sanitises the label and omits it when empty', () => {
    expect(addOwnerDirection(doc(), { direction: 'x', date: '2026-10-02', author: 'Jo<ey>\n**' }).text).toContain('- **2026-10-02** (Joey) — x');
    expect(addOwnerDirection(doc(), { direction: 'x', date: '2026-10-02' }).text).toContain('- **2026-10-02** — x');
  });
  it('is idempotent for the same line', () => {
    const once = addOwnerDirection(doc(), { direction: 'x', date: '2026-10-02', author: 'Joey' }).text;
    const again = addOwnerDirection(once, { direction: 'x', date: '2026-10-02', author: 'Joey' });
    expect(again.added).toBe(false);
    expect(again.text).toBe(once);
  });
  it('works on the real file and refuses empty, bad-date and oversized directions', () => {
    expect(validateStrategy(addOwnerDirection(real, { direction: 'test steer', date: '2026-10-02', author: 'Joey' }).text, real, { ownerAppend: true })).toEqual([]);
    expect(() => addOwnerDirection(doc(), { direction: '   ', date: '2026-10-02' })).toThrow(/empty/);
    expect(() => addOwnerDirection(doc(), { direction: 'x', date: 'tomorrow' })).toThrow(/YYYY-MM-DD/);
    expect(() => addOwnerDirection(doc(), { direction: 'x'.repeat(MAX_DIRECTION_CHARS + 1), date: '2026-10-02' })).toThrow(/cap/);
  });
});

describe('rebaseOntoMain (a steer that merged while Fable worked)', () => {
  const NEWER = '- **2026-10-02** (Joey) — "stop X"';
  const main = doc({ owner: `*Steer in the channel.*\n\n${OWNER_LINE}\n${NEWER}`, changelog: '- 2026-10-01 — first\n- 2026-10-02 — Owner direction added' });
  it('re-applies main’s Owner direction and Changelog lines onto a rewrite made from the older copy', () => {
    const rewrite = doc({ bets: '1. a better bet', changelog: '- 2026-10-01 — first\n- 2026-10-05 — rewrote' });
    const { text, error } = rebaseOntoMain(rewrite, main);
    expect(error).toBeUndefined();
    expect(text).toContain('1. a better bet');
    expect(text).toContain(NEWER);
    expect(text).toContain('- 2026-10-02 — Owner direction added');
    expect(text).toContain('- 2026-10-05 — rewrote');
    expect(validateStrategy(text, main)).toEqual([]);
  });
  it('rejects a rewrite that adds or edits an owner line main lacks', () => {
    const forged = doc({ owner: `${OWNER_LINE}\n- **2026-10-03** (Joey) — "forged"` });
    expect(rebaseOntoMain(forged, main).error).toMatch(/line main lacks/);
    const edited = doc({ owner: OWNER_LINE.replace('grow first', 'grow SECOND') });
    expect(rebaseOntoMain(edited, main).error).toMatch(/line main lacks/);
  });
  it('keeps the rewrite’s own non-bullet text in the section', () => {
    const rewrite = doc({ owner: `*A reworded steering note.*\n\n${OWNER_LINE}` });
    const { text } = rebaseOntoMain(rewrite, main);
    expect(text).toContain('*A reworded steering note.*');
    expect(text).toContain(NEWER);
  });
});

describe('newChangelogLines', () => {
  it('lists only lines the rewrite added', () => {
    const next = doc({ changelog: '- 2026-10-01 — first\n- 2026-10-08 — second' });
    expect(newChangelogLines(doc(), next)).toEqual(['- 2026-10-08 — second']);
  });
});

describe('judgeDirectionPr', () => {
  const view = (over: Record<string, unknown> = {}) => ({ state: 'MERGED', isCrossRepository: false, files: [{ path: STRATEGY_FILE }], ...over });
  it('accepts a merged same-repo PR that changed only the strategy file', () => {
    expect(judgeDirectionPr(view())).toMatchObject({ ok: true });
  });
  it('waits on an open one and refuses forks, extra files and closed PRs', () => {
    expect(judgeDirectionPr(view({ state: 'OPEN' }))).toMatchObject({ ok: false, wait: true });
    expect(judgeDirectionPr(view({ isCrossRepository: true }))).toMatchObject({ ok: false, wait: false });
    expect(judgeDirectionPr(view({ files: [{ path: STRATEGY_FILE }, { path: 'scripts/x.mjs' }] }))).toMatchObject({ ok: false, wait: false });
    expect(judgeDirectionPr(view({ state: 'CLOSED' }))).toMatchObject({ ok: false, wait: false });
    expect(judgeDirectionPr(null)).toMatchObject({ ok: false });
  });
});

describe('strategy-doc CLI (main() executed with a mocked gh/git)', () => {
  it('check passes the real file and fails a broken one', async () => {
    quiet();
    expect(await main(['check'])).toBe(0);
    const dir = tmp();
    writeFileSync(path.join(dir, 'bad.md'), '# T\n\n## Summary\n- a\n');
    expect(await main(['check', '--file', path.join(dir, 'bad.md')])).toBe(1);
  });

  it('wait-merged runs with a numeric PR: asks gh for it, writes the request and skip=false when merged', async () => {
    quiet();
    const dir = tmp();
    const out = path.join(dir, 'req', 'strategy-update.json');
    const gh = path.join(dir, 'gh-output');
    const exec = vi.fn(() => JSON.stringify({ state: 'MERGED', isCrossRepository: false, files: [{ path: STRATEGY_FILE }] }));
    expect(await main(['wait-merged', '--pr', '4712', '--focus', 'cadence\nand channels', '--out', out, '--minutes', '1'], { exec, env: { GITHUB_OUTPUT: gh }, sleep: async () => {} })).toBe(0);
    expect(exec).toHaveBeenCalledWith('gh', ['pr', 'view', '4712', '--json', 'state,isCrossRepository,files']);
    expect(JSON.parse(read(out))).toEqual({ direction_pr: 4712, focus: 'cadence and channels' });
    expect(read(gh)).toBe('skip=false\n');
  });
  it('wait-merged polls an open PR, then skips when it never merges, and rejects a non-numeric PR', async () => {
    quiet();
    const dir = tmp();
    const gh = path.join(dir, 'gh-output');
    const exec = vi.fn(() => JSON.stringify({ state: 'OPEN', isCrossRepository: false, files: [{ path: STRATEGY_FILE }] }));
    const sleep = vi.fn(async () => {});
    const clock = vi.spyOn(Date, 'now');
    clock.mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(10 * 60_000);
    expect(await main(['wait-merged', '--pr', '7', '--minutes', '1'], { exec, env: { GITHUB_OUTPUT: gh }, sleep })).toBe(0);
    expect(exec).toHaveBeenCalled();
    expect(read(gh)).toBe('skip=true\n');
    await expect(main(['wait-merged', '--pr', 'abc'], { exec, env: {}, sleep })).rejects.toThrow(/PR number/);
  });

  describe('add-direction (only --from-context, only the verified owner)', () => {
    const setup = (ctx: Record<string, unknown>) => {
      const dir = tmp();
      writeFileSync(path.join(dir, 's.md'), doc());
      writeFileSync(path.join(dir, 'ctx.json'), JSON.stringify(ctx));
      return { dir, args: ['add-direction', '--from-context', path.join(dir, 'ctx.json'), '--date', '2026-10-04', '--file', path.join(dir, 's.md')] };
    };
    it('records the verified owner’s message verbatim, with his label, and nothing shell-interpreted', async () => {
      quiet();
      const { dir, args } = setup({ text: 'Say "hi" and $(whoami) `x`', author: 'Joey', owner: { configured: true, verified: true } });
      expect(await main(args)).toBe(0);
      expect(read(path.join(dir, 's.md'))).toContain('- **2026-10-04** (Joey) — Say "hi" and $(whoami) `x`');
    });
    it('REFUSES (exit 3, file untouched) when the author is not the verified owner, or no owner is configured', async () => {
      quiet();
      for (const owner of [{ configured: true, verified: false }, { configured: false, verified: false }, undefined]) {
        const { dir, args } = setup({ text: 'steer', author: 'Wyatt', ...(owner ? { owner } : {}) });
        expect(await main(args)).toBe(3);
        expect(read(path.join(dir, 's.md'))).toBe(doc());
      }
    });
    it('has no --text or --text-file: the chat agent cannot author a line', async () => {
      quiet();
      const { dir } = setup({ text: 'x', owner: { configured: true, verified: true } });
      await expect(main(['add-direction', '--text', 'forged', '--file', path.join(dir, 's.md')])).rejects.toThrow(/only --from-context/);
      await expect(main(['add-direction', '--text-file', path.join(dir, 'ctx.json'), '--file', path.join(dir, 's.md')])).rejects.toThrow(/only --from-context/);
      expect(read(path.join(dir, 's.md'))).toBe(doc());
    });
    it('refuses an over-long message', async () => {
      quiet();
      const { args } = setup({ text: 'x'.repeat(MAX_DIRECTION_CHARS + 1), author: 'Joey', owner: { configured: true, verified: true } });
      await expect(main(args)).rejects.toThrow(/cap/);
    });
  });

  it('save-update writes one request; dispatch with none is a no-op and bad input is refused', async () => {
    const log = quiet();
    const dir = tmp();
    expect(await main(['save-update', '--pr', '123', '--focus', 'cadence', '--dir', dir])).toBe(0);
    expect(JSON.parse(read(path.join(dir, 'strategy-update-1.json')))).toEqual({ pr: 123, focus: 'cadence' });
    await expect(main(['save-update', '--pr', 'abc', '--dir', dir])).rejects.toThrow(/PR number/);
    const empty = tmp();
    await main(['dispatch', '--dir', empty]);
    expect(log.mock.calls.flat().join('\n')).toMatch(/no strategy update requested/);
  });
  it('dispatch starts the update routine with the PR and a cleaned focus, under the daily cap', async () => {
    quiet();
    const dir = tmp();
    writeFileSync(path.join(dir, 'strategy-update-1.json'), JSON.stringify({ pr: 55, focus: 'a\nb' }));
    const exec = vi.fn((_cmd: string, args: string[]) => (args[0] === 'api' ? '1' : ''));
    await main(['dispatch', '--dir', dir], { exec, env: { GITHUB_REPOSITORY: 'o/r' } });
    expect(exec).toHaveBeenCalledWith('gh', ['workflow', 'run', 'routine-fable-strategy-update.yml', '--repo', 'o/r', '--ref', 'main', '-f', 'direction_pr=55', '-f', 'focus=a b']);
    const capped = vi.fn(() => '4');
    await main(['dispatch', '--dir', dir], { exec: capped, env: { GITHUB_REPOSITORY: 'o/r' } });
    expect(capped).toHaveBeenCalledTimes(1);
  });

  describe('open-pr', () => {
    const NEWER = '- **2026-10-02** (Joey) — "stop X"';
    const setup = (proposal: string) => {
      const root = tmp();
      mkdirSync(path.join(root, 'docs', 'strategy'), { recursive: true });
      writeFileSync(path.join(root, STRATEGY_FILE), doc({ owner: `${OWNER_LINE}\n${NEWER}`, changelog: '- 2026-10-01 — first\n- 2026-10-02 — Owner direction added' }));
      writeFileSync(path.join(root, 'proposal.md'), proposal);
      const exec = vi.fn((cmd: string, args: string[]) => (cmd === 'gh' && args[0] === 'pr' && args[1] === 'create' ? 'https://github.com/o/r/pull/9' : ''));
      return { root, exec, args: ['open-pr', '--file', path.join(root, 'proposal.md'), '--kind', 'weekly'] };
    };
    it('re-applies main’s newer Owner direction instead of failing, then commits, pushes, opens the PR and sets auto-merge', async () => {
      quiet();
      const { root, exec, args } = setup(doc({ bets: '1. rewritten bet', changelog: '- 2026-10-01 — first\n- 2026-10-05 — rewrote' }));
      expect(await main(args, { exec, env: {}, root })).toBe(0);
      const written = read(path.join(root, STRATEGY_FILE));
      expect(written).toContain('1. rewritten bet');
      expect(written).toContain(NEWER);
      expect(written).toContain('- 2026-10-02 — Owner direction added');
      const calls = exec.mock.calls.map(([c, a]: [string, string[]]) => `${c} ${a.slice(0, 2).join(' ')}`);
      expect(calls).toEqual(expect.arrayContaining(['git checkout -b', 'git push -u', 'gh pr create', 'gh pr merge']));
    });
    it('rejects a rewrite carrying a forged owner line: nothing is written, pushed or opened', async () => {
      quiet();
      const forged = doc({ owner: `${OWNER_LINE}\n- **2026-10-09** (Joey) — "forged by the rewrite"` });
      const { root, exec, args } = setup(forged);
      const before = read(path.join(root, STRATEGY_FILE));
      expect(await main(args, { exec, env: {}, root })).toBe(1);
      expect(exec).not.toHaveBeenCalled();
      expect(read(path.join(root, STRATEGY_FILE))).toBe(before);
    });
    it('fails (exit 1) on a missing proposal or a malformed one', async () => {
      quiet();
      const { root, exec } = setup('# T\n\n## Summary\n- a\n');
      expect(await main(['open-pr', '--file', path.join(root, 'proposal.md'), '--kind', 'weekly'], { exec, env: {}, root })).toBe(1);
      expect(await main(['open-pr', '--file', path.join(root, 'nope.md'), '--kind', 'weekly'], { exec, env: {}, root })).toBe(1);
      expect(existsSync(path.join(root, 'nope.md'))).toBe(false);
      expect(exec).not.toHaveBeenCalled();
    });
  });
});
