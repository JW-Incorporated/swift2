// Bots v2 W8: pin the shape of the workflows that bound Tree's daily/event
// runs (plain-text assertions, the repo convention — no YAML parser).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(resolve(p), 'utf8').replace(/\r\n/g, '\n');
const jobBlock = (text: string, job: string) => {
  const m = new RegExp(`^  ${job}:\\n([\\s\\S]*?)(?=^  [a-z][\\w-]*:\\n|(?![\\s\\S]))`, 'm').exec(text);
  return m ? m[1] : '';
};

describe('routine-tree-daily-draft.yml', () => {
  const wf = read('.github/workflows/routine-tree-daily-draft.yml');

  it('brackets the agent with prepare -> run -> receipt and hands it the pre-compute as an artifact', () => {
    expect(wf).toMatch(/^ {2}prepare:$/m);
    expect(wf).toMatch(/^ {2}run:\n {4}needs: prepare$/m);
    expect(wf).toMatch(/pre_run_artifact: tree-inputs/);
    expect(jobBlock(wf, 'prepare')).toMatch(/name: tree-inputs\n\s+path: \.scratch\/tree-inputs\.json/);
    expect(wf).toMatch(/^ {2}receipt:$/m);
  });

  it('keeps max_turns at 50 — the work is bounded, not the cap raised', () => {
    expect(wf).toMatch(/max_turns: 50\b/);
  });

  it('retires stale drafts with --apply in the prepare job only, on the workflow token (never the PAT)', () => {
    const prepare = jobBlock(wf, 'prepare');
    expect(prepare).toMatch(/retire-stale-drafts\.mjs --apply/);
    expect(prepare).toMatch(/pull-requests: write/);
    expect(prepare).not.toMatch(/SOCIAL_POSTER_PAT/);
    expect(jobBlock(wf, 'run')).not.toMatch(/retire-stale/);
  });

  it('degrades the pre-compute to an error stub instead of failing the run', () => {
    expect(jobBlock(wf, 'prepare')).toMatch(/prepare-draft-inputs\.mjs --out \.scratch\/tree-inputs\.json \|\| true/);
    expect(jobBlock(wf, 'prepare')).toMatch(/"error":"prepare-draft-inputs\.mjs failed/);
  });

  it('files the receipt only when the agent job failed or was cancelled', () => {
    const receipt = jobBlock(wf, 'receipt');
    expect(receipt).toMatch(/needs\.run\.result == 'failure' \|\| needs\.run\.result == 'cancelled'/);
    expect(receipt).toMatch(/draft-receipt\.mjs --kind daily/);
    expect(receipt).toMatch(/--file-issue/);
  });
});

describe('routine-tree-event-draft.yml', () => {
  const wf = read('.github/workflows/routine-tree-event-draft.yml');

  it('is dispatch-only (no schedule), takes a numeric issue, and is capped at 30 turns', () => {
    expect(wf).not.toMatch(/^\s+schedule:/m);
    expect(wf).toMatch(/dispatch-only/);
    expect(wf).toMatch(/case "\$ISSUE" in ''\|\*\[!0-9\]\*\)/);
    expect(wf).toMatch(/max_turns: 30\b/);
    expect(wf).toMatch(/concurrency_key: issue-\$\{\{ inputs\.issue \}\}/);
  });

  it('feeds the agent the issue text and the pre-compute, and files a receipt on failure', () => {
    expect(wf).toMatch(/pre_run_artifact: tree-event-inputs/);
    expect(jobBlock(wf, 'prepare')).toMatch(/\.scratch\/event\.json/);
    expect(jobBlock(wf, 'receipt')).toMatch(/draft-receipt\.mjs --kind event/);
  });

  it('points at a prompt file that exists and carries the attribution trailer', () => {
    const prompt = read('docs/agents/runner-prompts/tree-event-draft.md');
    expect(prompt).toContain('Tier-2: Tree — event draft');
    expect(prompt).toContain('UNTRUSTED DATA');
    expect(prompt).toContain('`singlePlatformReason`');
  });
});

describe('social-event-dispatch.yml and its producer', () => {
  const wf = read('.github/workflows/social-event-dispatch.yml');

  it('is a no-LLM dispatch scan on the workflow token — no PAT, no queue write', () => {
    expect(wf).toMatch(/dispatch-event-drafts\.mjs/);
    expect(wf).toMatch(/actions: write/);
    expect(wf).not.toMatch(/SOCIAL_POSTER_PAT/);
    expect(wf).not.toMatch(/claude-code-action/);
  });

  it('is also dispatched straight after the news desk files intake issues', () => {
    const triage = read('.github/workflows/routine-news-triage.yml');
    expect(triage).toMatch(/dispatch-social-events:/);
    expect(triage).toMatch(/gh workflow run social-event-dispatch\.yml/);
    expect(jobBlock(triage, 'dispatch-social-events')).toMatch(/needs\.run\.result == 'success'/);
  });
});

describe('the drafter prompts agree with check-drafts', () => {
  const daily = read('docs/agents/runner-prompts/tree-daily-draft.md');

  it('reads the pre-compute first, skips the long docs, and holds the listening scan until after the PR', () => {
    expect(daily).toContain('.scratch/tree-inputs.json');
    expect(daily).toContain('Skip `docs/marketing/social-strategy.md` and `social/calendar.md`');
    expect(daily).toContain('Listening scan — AFTER the PR is open');
    expect(daily).toContain('**≤30 tool calls**');
  });

  it('puts ONE photo on both halves of a pair and defers a beat rather than repeating a tile', () => {
    expect(daily).toContain('on BOTH halves of the pair');
    expect(daily).toContain('defer the beat');
    expect(daily).toContain('never drop X to text-only to dodge L001');
    expect(daily).not.toContain('Pull it from the repo\'s own credited corpus');
  });

  it('no longer tells the model to run the event sensor or hunt rejected PRs itself', () => {
    expect(daily).not.toContain('Run `node scripts/social/event-status.mjs`');
    expect(daily).not.toContain('gh pr list --state closed --label social-draft --search');
  });

  it('L001 in the ledger carries the same rule', () => {
    const lessons = read('social/lessons.md');
    expect(lessons).toContain('the IG and X halves of the SAME campaign carry the SAME photo');
    expect(lessons).not.toContain('never put the same `photoId` on both halves of an IG/X pair, and when no unused entry is left drop the X sibling to text-only');
  });
});
