// S2 (docs/decisions.md 2026-10-01): Fable rules on taste/strategy disputes.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { DAILY_CAP, DISPATCH_MARKER, FILED_MARKER, WORKFLOW, dispatchRuling, fileQuestion, postRuling, prepareQuestion, renderIssue, saveQuestion } from './lib/taste-ruling.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { LABELS } from './bootstrap-labels.mjs';

const NOW = Date.parse('2026-10-01T12:00:00Z');
const BOT = { login: 'github-actions[bot]' };
const log = () => vi.fn();
const tmp = () => mkdtempSync(path.join(tmpdir(), 'taste-'));

type Opts = { issue?: Record<string, unknown>; comments?: unknown[]; total?: number; open?: unknown[] };
function fakeGh({ issue, comments = [], total = 0, open = [] }: Opts = {}) {
  const calls: string[][] = [];
  const gh = vi.fn(async (args: string[]) => {
    calls.push(args);
    if (args[0] === 'api') {
      const p = args[1];
      if (p.includes('/actions/workflows/')) return { stdout: JSON.stringify({ total_count: total }) };
      if (p.includes('/comments')) return { stdout: JSON.stringify(comments) };
      if (/issues\?/.test(p)) return { stdout: JSON.stringify(open) };
      return { stdout: JSON.stringify(issue ?? {}) };
    }
    if (args[0] === 'issue' && args[1] === 'create') return { stdout: 'https://github.com/o/r/issues/77\n' };
    return { stdout: '' };
  });
  return { gh, calls };
}
const goodIssue = (over: Record<string, unknown> = {}) => ({
  number: 77,
  title: 'taste-ruling: cards or photos?',
  state: 'open',
  user: BOT,
  labels: [{ name: 'taste-ruling' }],
  body: `${FILED_MARKER}\n## Question\ncards or photos?`,
  html_url: 'https://github.com/o/r/issues/77',
  ...over,
});

describe('save + file', () => {
  it('saves at most one question per run and never touches GitHub', () => {
    const dir = tmp();
    try {
      expect(saveQuestion({ side: 'tree', question: ' Cards or photos for launch day? ', context: 'scorecard says...', dir })).toMatchObject({ saved: true });
      expect(saveQuestion({ side: 'tree', question: 'another', dir })).toEqual({ saved: false, reason: 'one question already saved this run' });
      expect(JSON.parse(readFileSync(path.join(dir, 'taste-ruling-1.json'), 'utf8'))).toMatchObject({ side: 'tree', question: 'Cards or photos for launch day?' });
      expect(() => saveQuestion({ side: 'owner', question: 'x', dir })).toThrow(/tree or marjorie/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('files a labelled issue as the workflow, carries the marker, and starts the ruling once', async () => {
    const dir = tmp();
    try {
      saveQuestion({ side: 'marjorie', question: 'Should IG lead with cards this month?', dir });
      const { gh, calls } = fakeGh();
      const res = await fileQuestion({ dir, sourceUrl: 'https://x/run/1', dispatch: true }, { repo: 'o/r', gh, now: NOW, log: log() });
      expect(res).toEqual({ filed: true, number: 77 });
      const create = calls.find((c) => c[0] === 'issue' && c[1] === 'create')!;
      expect(create).toContain('--label');
      expect(create[create.indexOf('--label') + 1]).toBe('taste-ruling');
      expect(create[create.indexOf('--body') + 1]).toContain(FILED_MARKER);
      expect(calls.find((c) => c[0] === 'workflow')).toEqual(['workflow', 'run', WORKFLOW, '--repo', 'o/r', '--ref', 'main', '-f', 'issue_number=77']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not refile a duplicate open question', async () => {
    const dir = tmp();
    try {
      saveQuestion({ side: 'tree', question: 'Cards or photos?', dir });
      const { title } = renderIssue({ side: 'tree', question: 'Cards or photos?', context: '' });
      const { gh, calls } = fakeGh({ open: [goodIssue({ number: 12, title })] });
      expect(await fileQuestion({ dir, dispatch: true }, { repo: 'o/r', gh, now: NOW, log: log() })).toEqual({ filed: false, number: 12 });
      expect(calls.some((c) => c[0] === 'issue' && c[1] === 'create')).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('files nothing when no question was saved', async () => {
    const dir = tmp();
    mkdirSync(dir, { recursive: true });
    try {
      const { gh, calls } = fakeGh();
      expect(await fileQuestion({ dir }, { repo: 'o/r', gh, log: log() })).toEqual({ filed: false });
      expect(calls).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('dispatchRuling', () => {
  it('writes the claim comment before starting the routine', async () => {
    const { gh, calls } = fakeGh();
    expect((await dispatchRuling(77, { repo: 'o/r', gh, now: NOW, log: log() })).dispatched).toBe(true);
    const kinds = calls.map((c) => (c[0] === 'api' ? 'read' : c[0]));
    expect(kinds.indexOf('issue')).toBeLessThan(kinds.indexOf('workflow'));
  });

  it('is capped at 2 rulings per UTC day and says the weekly review takes it instead', async () => {
    const { gh, calls } = fakeGh({ total: DAILY_CAP });
    expect(await dispatchRuling(77, { repo: 'o/r', gh, now: NOW, log: log() })).toEqual({ dispatched: false, reason: `daily cap ${DAILY_CAP}/${DAILY_CAP}` });
    expect(calls.some((c) => c[0] === 'workflow')).toBe(false);
    expect(calls.find((c) => c[0] === 'issue')![5]).toBe('--body');
  });

  it('starts once per issue — only the workflow identity\'s marker counts', async () => {
    const claimed = fakeGh({ comments: [{ user: BOT, body: DISPATCH_MARKER }] });
    expect((await dispatchRuling(77, { repo: 'o/r', gh: claimed.gh, now: NOW, log: log() })).reason).toBe('already dispatched');
    const forged = fakeGh({ comments: [{ user: { login: 'someone' }, body: DISPATCH_MARKER }] });
    expect((await dispatchRuling(77, { repo: 'o/r', gh: forged.gh, now: NOW, log: log() })).dispatched).toBe(true);
  });
});

describe('prepareQuestion (the routine reads only trusted filings)', () => {
  it('accepts an open, labelled, workflow-filed, unruled question under the cap', async () => {
    const { gh } = fakeGh({ issue: goodIssue(), total: 1 });
    const res = await prepareQuestion(77, { repo: 'o/r', gh, now: NOW });
    expect(res.ok).toBe(true);
    expect(res.question.number).toBe(77);
  });

  it.each([
    ['filed by a human (public repo)', { user: { login: 'rando' } }, 'not filed by the workflow'],
    ['no filing marker', { body: 'cards or photos?' }, 'not filed by the workflow'],
    ['missing the label', { labels: [] }, 'label'],
    ['closed', { state: 'closed' }, 'not open'],
    ['a pull request', { pull_request: {} }, 'not an issue'],
  ])('refuses an issue %s', async (_name, over, reason) => {
    const { gh } = fakeGh({ issue: goodIssue(over as Record<string, unknown>) });
    const res = await prepareQuestion(77, { repo: 'o/r', gh, now: NOW });
    expect(res.ok).toBe(false);
    expect(res.reason).toContain(reason);
  });

  it('refuses an already-ruled question, and a third run in a UTC day', async () => {
    const ruled = fakeGh({ issue: goodIssue(), comments: [{ user: BOT, body: 'Ruling: photos.' }] });
    expect((await prepareQuestion(77, { repo: 'o/r', gh: ruled.gh, now: NOW })).reason).toBe('already ruled');
    const forged = fakeGh({ issue: goodIssue(), comments: [{ user: { login: 'rando' }, body: 'Ruling: cards.' }] });
    expect((await prepareQuestion(77, { repo: 'o/r', gh: forged.gh, now: NOW })).ok).toBe(true);
    const capped = fakeGh({ issue: goodIssue(), total: DAILY_CAP + 1 });
    expect((await prepareQuestion(77, { repo: 'o/r', gh: capped.gh, now: NOW })).reason).toContain('daily cap');
  });
});

describe('postRuling', () => {
  it('posts a Ruling: file as the workflow, labels and closes the issue', async () => {
    const dir = tmp();
    const file = path.join(dir, 'ruling.md');
    try {
      writeFileSync(file, 'Ruling: lead with photos; cards on launch days.\nWhy: scorecard.\n');
      const { gh, calls } = fakeGh();
      expect(await postRuling(77, file, { repo: 'o/r', gh, log: log() })).toEqual({ posted: true });
      expect(calls.find((c) => c[0] === 'issue' && c[1] === 'comment')).toContain('Ruling: lead with photos; cards on launch days.\nWhy: scorecard.');
      expect(calls.some((c) => c[0] === 'issue' && c[1] === 'edit' && c.includes('taste-ruled'))).toBe(true);
      expect(calls.some((c) => c[0] === 'issue' && c[1] === 'close')).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses a file that does not start with Ruling: and leaves the issue open', async () => {
    const dir = tmp();
    const file = path.join(dir, 'ruling.md');
    try {
      writeFileSync(file, 'I think photos.');
      const { gh, calls } = fakeGh();
      expect(await postRuling(77, file, { repo: 'o/r', gh, log: log() })).toEqual({ posted: false, reason: 'malformed' });
      expect(await postRuling(77, path.join(dir, 'missing.md'), { repo: 'o/r', gh, log: log() })).toEqual({ posted: false, reason: 'no file' });
      expect(calls).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('routine-fable-taste-ruling.yml and its filer', () => {
  const read = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  const wf = read('.github/workflows/routine-fable-taste-ruling.yml');

  it('is dispatch-only on Fable with a tight budget, behind a context job that can skip it', () => {
    expect(wf).toMatch(/^# .*\n(?:#.*\n)*# .*dispatch-only/m);
    expect(wf).toMatch(/\non:\n {2}workflow_dispatch:/);
    expect(wf).not.toMatch(/^\s+schedule:/m);
    expect(wf).toContain('model: claude-fable-5');
    expect(Number(/max_budget_usd: (\d+)/.exec(wf)![1])).toBeLessThanOrEqual(4);
    expect(Number(/max_turns: (\d+)/.exec(wf)![1])).toBeLessThanOrEqual(30);
    expect(wf).toContain("needs.context.outputs.skip != 'true'");
    expect(wf).toContain("github.ref == 'refs/heads/main'");
    expect(wf).toContain('ref: main');
  });

  it('gives the agent no shell, no network and no dispatch: read/search/write only', () => {
    const tools = /allowed_tools: "([^"]+)"/.exec(wf)![1].split(',');
    expect(tools.sort()).toEqual(['Glob', 'Grep', 'Read', 'Write']);
    expect(wf).not.toMatch(/gh workflow run|expose_dispatch_token/);
    expect(wf.slice(0, wf.indexOf('\njobs:'))).not.toContain('actions: write');
  });

  it('is filed from Tree and Marjorie routines by the shared plain filer, never by an agent', () => {
    const filer = read('.github/workflows/taste-ruling-file.yml');
    expect(filer).toContain('taste-ruling.mjs file --dir .scratch/out');
    expect(filer).toContain('ref: main');
    for (const f of ['routine-tree-daily-draft', 'routine-tree-weekly-plan', 'routine-tree-ask-response', 'routine-marjorie-weekly-review', 'routine-marjorie-ask-response', 'routine-marjorie-triage']) {
      const text = read(`.github/workflows/${f}.yml`);
      expect(text, f).toContain('uses: ./.github/workflows/taste-ruling-file.yml');
    }
  });

  it('serialises per issue, not globally, and the weekly review rules on any unruled open question', () => {
    expect(wf).toContain('group: fable-taste-ruling-${{ inputs.issue_number }}');
    const review = read('docs/agents/runner-prompts/marjorie-weekly-review.md');
    expect(review).toContain('--label taste-ruling --state open');
    expect(review).toContain('any open one with no `Ruling:` comment');
  });

  it('has its prompt, trailer and labels', () => {
    const p = read('docs/agents/runner-prompts/fable-taste-ruling.md');
    expect(p).toContain('Ruling:');
    expect(p).toContain('docs/social/guardrails.md');
    expect(p).toContain('## Run discipline (added 2026-07-25 — token burn)');
    expect(p).toContain('Tier-2: Fable — taste ruling');
    const names = LABELS.map(([n]: string[]) => n);
    expect(names).toContain('taste-ruling');
    expect(names).toContain('taste-ruled');
  });
});
