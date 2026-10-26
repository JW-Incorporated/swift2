// Bots v2 W8: pin the shape of the workflows that bound Tree's daily/event
// runs (plain-text assertions, the repo convention — no YAML parser).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TREE_DISPATCHERS } from './tree-approve-gate.mjs';

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

  it('caps max_turns at 75 — draft days use 50–59 turns (decisions.md 2026-10-21)', () => {
    expect(wf).toMatch(/max_turns: 75\b/);
  });

  it('dispatches approval from a backstop job that survives an agent turn-cap failure but not a cancel', () => {
    expect(wf).toMatch(/approve-backstop:/);
    expect(wf).toMatch(/if: \$\{\{ !cancelled\(\) \}\}/);
    expect(wf).toMatch(/gh workflow run social-tree-approve\.yml/);
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

  // #5520: the agent's social-tree-approve dispatch 403'd on claude-code-action's
  // own installation token. Both halves are load-bearing — the workflow must hand
  // the PAT over as GH_DISPATCH_TOKEN, and the prompt must actually prefix the one
  // command with it (routine-template.yml does not change the agent's default gh).
  it('hands the agent GH_DISPATCH_TOKEN, paired with the PAT it exposes', () => {
    const run = jobBlock(wf, 'run');
    expect(run).toMatch(/expose_dispatch_token: true/);
    expect(run).toMatch(/checkout_token_secret: SOCIAL_POSTER_PAT/);
    expect(run).toMatch(/SOCIAL_POSTER_PAT: \$\{\{ secrets\.SOCIAL_POSTER_PAT \}\}/);
  });
});

describe('Tree clears its own drafts (#5520)', () => {
  const wf = read('.github/workflows/routine-tree-daily-draft.yml');
  const prompt = read('docs/agents/runner-prompts/tree-daily-draft.md');

  it('step 7 dispatches social-tree-approve with the GH_DISPATCH_TOKEN prefix the template documents', () => {
    expect(prompt).toMatch(/GH_TOKEN="\$GH_DISPATCH_TOKEN" gh workflow run social-tree-approve\.yml --ref main -f pr=/);
  });

  it('keeps the prefix scoped to that one command, so comments stay claude[bot]', () => {
    // Exactly one prefixed command in the prompt, and it is the approve dispatch.
    const prefixed = prompt.match(/GH_TOKEN="\$GH_DISPATCH_TOKEN"[^`\n]*/g) ?? [];
    expect(prefixed).toHaveLength(1);
    expect(prefixed[0]).toContain('social-tree-approve.yml');
  });

  it('the exposed PAT resolves to a dispatcher tree-approve-gate.mjs actually accepts', () => {
    // GH_DISPATCH_TOKEN is the job's SOCIAL_POSTER_PAT, whose login is
    // `sffan15-sys` (docs/social/RULINGS-SOCIAL-2.md; confirmed live on ops-fix
    // run 38162236364, triggering_actor=sffan15-sys for a GH_DISPATCH_TOKEN
    // dispatch). social-tree-approve.yml gates on github.triggering_actor, so
    // getting past the 403 is only a fix while that login stays a TREE_DISPATCHER.
    expect(TREE_DISPATCHERS).toContain('sffan15-sys');
    expect(jobBlock(wf, 'run')).toMatch(/checkout_token_secret: SOCIAL_POSTER_PAT/);
    expect(read('.github/workflows/social-tree-approve.yml')).toMatch(/ACTOR: \$\{\{ github\.triggering_actor \}\}/);
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

  it('step 4.5 never leaves a news reserve empty for the same-day event run (#6327, cost 2026-10-25)', () => {
    expect(daily).toContain('A news reserve is ALWAYS drafted in this run, and is NEVER left empty for the same-day event run');
    expect(daily).toContain('a reserve may never be held open in anticipation of a run that may not fire');
    // The withdrawn hedge: an uncovered event handed wholesale to the event run.
    expect(daily).not.toContain('a time-sensitive one is drafted by its own same-day run (`routine-tree-event-draft.yml`), so here only note a still-uncovered item in the PR body');
  });

  it('agrees with social-strategy §1(e2) on the reserve: fallback by default, own day only', () => {
    const strategy = read('docs/marketing/social-strategy.md');
    expect(strategy).toContain('a reserve beat always drafts its named fallback');
    expect(strategy).toContain('A reserve day\'s beat is never drafted a day early');
    expect(daily).toContain('draft the calendar\'s named fallback exactly as written');
    expect(daily).toContain('A reserve day\'s beat is never drafted a day early');
  });

  it('L001 in the ledger carries the same rule', () => {
    const lessons = read('social/lessons.md');
    expect(lessons).toContain('the IG and X halves of the SAME campaign carry the SAME photo');
    expect(lessons).not.toContain('never put the same `photoId` on both halves of an IG/X pair, and when no unused entry is left drop the X sibling to text-only');
  });
});
