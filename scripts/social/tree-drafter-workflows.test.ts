// Bots v2 W8: pin the shape of the workflows that bound Tree's daily/event
// runs (plain-text assertions, the repo convention — no YAML parser).
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(resolve(p), 'utf8').replace(/\r\n/g, '\n');
const jobBlock = (text: string, job: string) => {
  const m = new RegExp(`^  ${job}:\\n([\\s\\S]*?)(?=^  [a-z][\\w-]*:\\n|(?![\\s\\S]))`, 'm').exec(text);
  return m ? m[1] : '';
};

// routine-tree-daily-draft.yml was deleted 2026-10-09: Tree drafts from its Hermes daily loop
// (docs/agents/runner-prompts/tree-hermes-daily.md), which raced the routine on tree/draft/<date>.
// The stale-draft sweep its `prepare` job ran lives on in social-retire-stale-drafts.yml.
describe('social-retire-stale-drafts.yml (the retired daily routine stale-draft sweep)', () => {
  const wf = read('.github/workflows/social-retire-stale-drafts.yml');

  it('retires stale drafts with --apply on the workflow token (never the PAT), no agent, no secret', () => {
    expect(wf).toMatch(/retire-stale-drafts\.mjs --apply/);
    expect(wf).toMatch(/pull-requests: write/);
    expect(wf).not.toMatch(/SOCIAL_POSTER_PAT|claude-code-action|SOCIAL_APPROVAL_KEY|DISCORD/);
    expect(wf).toMatch(/ref: main/);
  });

  it('is serialised and runs daily by cron and by workflow_dispatch', () => {
    expect(wf).toMatch(/cron: "41 10 \* \* \*"/);
    expect(wf).toMatch(/^ {2}workflow_dispatch:/m);
    expect(wf).toContain('concurrency:');
    expect(wf).toContain('group: social-retire-stale-drafts');
    expect(wf).toContain('cancel-in-progress: false');
  });

  it('the retired daily routine is gone', () => {
    expect(existsSync(resolve('.github/workflows/routine-tree-daily-draft.yml'))).toBe(false);
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
