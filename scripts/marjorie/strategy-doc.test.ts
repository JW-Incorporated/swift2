import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { HEADINGS, MAX_DIRECTION_CHARS, STRATEGY_FILE, addOwnerDirection, validateStrategy } from './lib/strategy-doc.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { judgeDirectionPr, newChangelogLines } from './strategy-doc.mjs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const real = read(STRATEGY_FILE);

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
    '1. bet',
    '',
    '## Content strategy',
    'craft',
    '',
    '## What we stopped and why',
    '- thing',
    '',
    '## Owner direction (standing)',
    over.owner ?? '- **2026-10-01** — "grow first"',
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
  it('is append-only for Owner direction and Changelog lines the previous version had', () => {
    const prev = doc();
    expect(validateStrategy(doc({ owner: '- **2026-10-02** — "other"' }), prev).join()).toMatch(/Owner direction \(standing\) lost a line/);
    expect(validateStrategy(doc({ changelog: '- 2026-10-02 — new only' }), prev).join()).toMatch(/Changelog lost a line/);
    const grown = doc({ owner: '- **2026-10-01** — "grow first"\n- **2026-10-02** — "more"', changelog: '- 2026-10-01 — first\n- 2026-10-02 — second' });
    expect(validateStrategy(grown, prev)).toEqual([]);
  });
  it('ignores `## ` lines inside code fences', () => {
    expect(validateStrategy(doc({ summary: '- ok\n```\n## fake\n```' }))[0]).toMatch(/only bullets/);
  });
  it('names every required heading', () => {
    expect(HEADINGS).toHaveLength(7);
  });
});

describe('addOwnerDirection', () => {
  it('appends the words verbatim with the date, adds a changelog line, and stays valid', () => {
    const { text, added } = addOwnerDirection(doc(), { direction: 'Focus on Reddit\nfirst', date: '2026-10-02' });
    expect(added).toBe(true);
    expect(text).toContain('- **2026-10-02** — Focus on Reddit first');
    expect(text).toMatch(/- 2026-10-02 — Owner direction added/);
    expect(validateStrategy(text, doc())).toEqual([]);
    const lines = text.split('\n');
    expect(lines.indexOf('## Changelog')).toBeGreaterThan(lines.findIndex((l) => l.includes('Focus on Reddit first')));
  });
  it('is idempotent for the same line', () => {
    const once = addOwnerDirection(doc(), { direction: 'x', date: '2026-10-02' }).text;
    const again = addOwnerDirection(once, { direction: 'x', date: '2026-10-02' });
    expect(again.added).toBe(false);
    expect(again.text).toBe(once);
  });
  it('works on the real file and refuses empty, bad-date and oversized directions', () => {
    expect(validateStrategy(addOwnerDirection(real, { direction: 'test steer', date: '2026-10-02' }).text, real)).toEqual([]);
    expect(() => addOwnerDirection(doc(), { direction: '   ', date: '2026-10-02' })).toThrow(/--text/);
    expect(() => addOwnerDirection(doc(), { direction: 'x', date: 'tomorrow' })).toThrow(/YYYY-MM-DD/);
    expect(() => addOwnerDirection(doc(), { direction: 'x'.repeat(MAX_DIRECTION_CHARS + 1), date: '2026-10-02' })).toThrow(/cap/);
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

describe('strategy-doc CLI', () => {
  const cli = (args: string[], cwd: string) => {
    try {
      return { code: 0, out: execFileSync('node', [path.resolve('scripts/marjorie/strategy-doc.mjs'), ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
    } catch (e) {
      const err = e as { status: number; stdout: string };
      return { code: err.status, out: err.stdout };
    }
  };
  it('check passes the real file and fails a broken one', () => {
    expect(cli(['check'], process.cwd()).code).toBe(0);
    const dir = mkdtempSync(path.join(tmpdir(), 'strat-'));
    try {
      writeFileSync(path.join(dir, 'bad.md'), '# T\n\n## Summary\n- a\n');
      const r = cli(['check', '--file', path.join(dir, 'bad.md')], process.cwd());
      expect(r.code).toBe(1);
      expect(r.out).toMatch(/headings must be exactly/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('add-direction edits the file in place; save-update writes one request; dispatch with none is a no-op', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'strat-'));
    try {
      writeFileSync(path.join(dir, 's.md'), doc());
      expect(cli(['add-direction', '--text', 'ship daily', '--date', '2026-10-03', '--file', path.join(dir, 's.md')], process.cwd()).code).toBe(0);
      expect(read(path.join(dir, 's.md'))).toContain('- **2026-10-03** — ship daily');
      writeFileSync(path.join(dir, 'ctx.json'), JSON.stringify({ text: 'Say "hi" and $(whoami) `x`' }));
      expect(cli(['add-direction', '--from-context', path.join(dir, 'ctx.json'), '--date', '2026-10-04', '--file', path.join(dir, 's.md')], process.cwd()).code).toBe(0);
      expect(read(path.join(dir, 's.md'))).toContain('- **2026-10-04** — Say "hi" and $(whoami) `x`');
      expect(cli(['save-update', '--pr', '123', '--focus', 'cadence', '--dir', dir], process.cwd()).code).toBe(0);
      expect(JSON.parse(read(path.join(dir, 'strategy-update-1.json')))).toEqual({ pr: 123, focus: 'cadence' });
      expect(cli(['save-update', '--pr', 'abc', '--dir', dir], process.cwd()).code).toBe(1);
      const empty = mkdtempSync(path.join(tmpdir(), 'strat-'));
      expect(cli(['dispatch', '--dir', empty], process.cwd()).out).toMatch(/no strategy update requested/);
      rmSync(empty, { recursive: true, force: true });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
