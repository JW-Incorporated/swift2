// Static checks on the W7 live loop: the two response routines, the shared
// filer workflow, who may dispatch, and the prompts' Disposition vocabulary.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { DIRECTIONS, DAILY_CAP, MAX_DEPTH } from './lib/loop-dispatch.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { DISPOSITIONS, LOOP_LABELS } from './lib/loop-queue.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { LABELS } from './bootstrap-labels.mjs';

const read = (file: string) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const wf = (name: string) => read(`.github/workflows/${name}`);
const job = (text: string, name: string) => {
  const start = text.indexOf(`\n  ${name}:`);
  const rest = text.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z][\w-]*:/);
  return next === -1 ? rest : rest.slice(0, next + 1);
};

const RESPONSES = [
  { file: 'routine-marjorie-ask-response.yml', prompt: 'marjorie-ask-response.md', trailer: 'Tier-2: Marjorie — ask response', kind: 'marjorie', queue: '--for marjorie' },
  { file: 'routine-tree-ask-response.yml', prompt: 'tree-ask-response.md', trailer: 'Tier-2: Tree — ask response', kind: 'tree', queue: '--for tree' },
] as const;

describe.each(RESPONSES)('$file', ({ file, prompt, trailer, queue }) => {
  const text = wf(file);
  it('is dispatch-only: no schedule, no issue or comment trigger, and it says so', () => {
    expect(text).toMatch(/^# .*\n(?:#.*\n)*# .*dispatch-only/m);
    expect(text).toMatch(/\non:\n {2}workflow_dispatch:/);
    expect(text).not.toMatch(/^\s+schedule:/m);
    expect(text).not.toMatch(/^\s+issues:\s*$/m);
    expect(text).not.toMatch(/issue_comment|pull_request|\bpush:/);
  });
  it('can never start anything itself: no dispatch token, no gh workflow run, no actions: write on the agent', () => {
    expect(text).not.toContain('expose_dispatch_token');
    expect(text).not.toMatch(/gh workflow run/);
    expect(job(text, 'run')).not.toContain('actions: write');
    expect(text.slice(0, text.indexOf('\njobs:'))).not.toContain('actions: write');
  });
  it('runs the agent on Opus with a small cap, only on main, behind a plain context job that can skip it', () => {
    const run = job(text, 'run');
    expect(run).toMatch(/model: claude-opus-5/);
    expect(Number(/max_budget_usd: (\d+)/.exec(run)?.[1])).toBeGreaterThan(0);
    expect(Number(/max_budget_usd: (\d+)/.exec(run)?.[1])).toBeLessThanOrEqual(8);
    expect(run).toContain("needs.context.outputs.skip != 'true'");
    expect(run).toContain('allowed_bots: github-actions');
    expect(run).toContain(`prompt_file: docs/agents/runner-prompts/${prompt}`);
    const context = job(text, 'context');
    expect(context).toContain("github.ref == 'refs/heads/main'");
    expect(context).toContain('ref: main');
    expect(context).toContain(`loop-live.mjs pending ${queue}`);
  });
  it('keeps one lane and never cancels a running response', () => {
    expect(text).toMatch(/concurrency:\n {2}group: [\w-]+\n {2}cancel-in-progress: false/);
  });
  it('hands help asks to the shared filer in response mode (each ask names its parent; none means no dispatch)', () => {
    const asks = job(text, 'asks');
    expect(asks).toContain('uses: ./.github/workflows/loop-file-asks.yml');
    expect(asks).toContain('response: true');
    expect(asks).toMatch(/actions: write/);
  });
  it('keeps issues and comments off the agent: space-free tools (the template passes them unquoted) and a prompt that says everything is in the queue file', () => {
    const tools = /allowed_tools: "([^"]+)"/.exec(job(text, 'run'))![1].split(',');
    for (const t of tools) expect(t).not.toMatch(/\s/);
    const p = read(`docs/agents/runner-prompts/${prompt}`);
    expect(p).toContain('Never fetch an issue or its comments yourself');
    expect(p).toContain('.scratch/ask-queue.json');
    expect(p).not.toMatch(/gh issue view <|--json body,comments/);
    expect(p).not.toContain('held: true');
  });
  it('has a prompt with the Disposition vocabulary, the run discipline block and the Tier-2 trailer', () => {
    const p = read(`docs/agents/runner-prompts/${prompt}`);
    const kind = prompt.startsWith('marjorie') ? 'marjorie' : 'tree';
    for (const word of DISPOSITIONS[kind as 'marjorie' | 'tree']) expect(p, word).toContain(word);
    expect(p).toContain('Disposition:');
    expect(p).toContain('## Run discipline (added 2026-07-25 — token burn)');
    expect(p).toContain(trailer);
    for (const label of LOOP_LABELS.map(([n]: string[]) => n)) {
      // every label a prompt tells the agent to apply must exist
      if (p.includes(label)) expect(LABELS.map(([n]: string[]) => n)).toContain(label);
    }
    expect(p).not.toMatch(/gh workflow run/);
  });
});

describe('the shared filer workflow', () => {
  const text = wf('loop-file-asks.yml');
  it('runs as the workflow token on main, reads saved files as data, and soft-fails', () => {
    expect(text).toMatch(/permissions:\n {2}contents: read\n {2}issues: write\n {2}actions: write/);
    expect(text).toContain('ref: main');
    expect(text).toContain('GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
    expect(text).not.toMatch(/secrets\.(?!GITHUB_TOKEN)/);
    expect(text).toContain('--dispatch');
    expect(text).toContain('|| echo "::warning::');
    expect(text).not.toContain('github.event.');
  });
});

describe('who may start the response routines', () => {
  const dispatchers = [
    ['routine-marjorie-weekly-review.yml', 'file-tree-feedback'],
    ['routine-marjorie-brief.yml', 'deliver'],
    ['routine-tree-weekly-plan.yml', 'send-brief'],
  ] as const;
  it.each(dispatchers)('%s files with --dispatch from a plain job that holds actions: write', (file, name) => {
    const text = wf(file);
    expect(text).toContain('--dispatch');
    const j = job(text, name);
    expect(j).toContain('actions: write');
    expect(j).toContain('--dispatch');
    expect(j).not.toContain('claude-code-action');
    expect(job(text, 'run')).not.toContain('--dispatch');
  });

  it.each([
    ['routine-tree-daily-draft.yml', 'tree-daily-draft-out', 'tree'],
    ['routine-marjorie-triage.yml', 'marjorie-triage-out', 'marjorie'],
    ['routine-marjorie-ask-response.yml', 'marjorie-ask-response-out', 'marjorie'],
    ['routine-tree-ask-response.yml', 'tree-ask-response-out', 'tree'],
  ] as const)('%s files its saved asks through loop-file-asks.yml', (file, artifact, side) => {
    const text = wf(file);
    const j = text.includes('\n  help:') ? job(text, 'help') : job(text, 'asks');
    expect(j).toContain('uses: ./.github/workflows/loop-file-asks.yml');
    expect(j).toContain(`artifact: ${artifact}`);
    expect(j).toContain(`side: ${side}`);
    expect(j).toContain("needs.run.result == 'success'");
    expect(j).toContain('actions: write');
    expect(text).toContain(`post_run_artifact: ${artifact}`);
  });

  it.each([
    ['routine-tree-chat.yml', 'tree'],
    ['routine-marjorie-chat.yml', 'marjorie'],
  ] as const)('%s files a saved ask from its plain finishing job, never from the agent job', (file, side) => {
    const text = wf(file);
    const step = text.slice(text.indexOf('# Bots v2 W7'));
    expect(step).toContain(`file-help --side ${side}`);
    expect(step).toContain('--dispatch');
    expect(step).toContain('GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
    expect(job(text, 'run')).not.toContain('--dispatch');
    // Marjorie's chat agent already holds GH_DISPATCH_TOKEN for routine runs (#4223); Tree's never does.
    if (side === 'tree') expect(job(text, 'run')).not.toContain('expose_dispatch_token');
  });
});

describe('the loop guards are what the docs say', () => {
  it('has one workflow per direction, a daily cap and a depth cap', () => {
    expect(Object.fromEntries(Object.entries(DIRECTIONS).map(([k, v]: [string, { workflow: string }]) => [k, v.workflow]))).toEqual({
      'to-marjorie': 'routine-marjorie-ask-response.yml',
      'to-tree': 'routine-tree-ask-response.yml',
    });
    expect(DAILY_CAP).toBe(6);
    expect(MAX_DEPTH).toBe(2);
    const spec = read('docs/specs/marjorie-overhaul/l1-loop.md');
    expect(spec).toContain('Live loop');
    expect(spec).toContain('6 per UTC day');
  });
  it('bootstraps every loop label', () => {
    for (const [name] of LOOP_LABELS) expect(LABELS.map(([n]: string[]) => n)).toContain(name);
  });
});
