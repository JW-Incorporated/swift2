import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { checkRoutineWorkflows, extractAllowedTools, extractCron } from '../check-routine-workflows.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { LABELS } from './bootstrap-labels.mjs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const review = read('.github/workflows/routine-marjorie-weekly-review.yml');
const bridge = read('.github/workflows/marjorie-bot1-bridge.yml');
const treePlan = read('.github/workflows/routine-tree-weekly-plan.yml');
const austin = read('.github/workflows/routine-austin-build.yml');
const prompt = read('docs/agents/runner-prompts/marjorie-weekly-review.md');
const charter = read('docs/agents/marjorie.md');
const skill = read('.claude/skills/prompting-bot1/SKILL.md');
const cadence = JSON.parse(read('scripts/marjorie/runner-cadence.json'));
const TRAILER = 'Tier-2: Marjorie — weekly growth review';

// One job's text: from `  <name>:` at job indent to the next job header.
function job(text: string, name: string) {
  const start = text.indexOf(`\n  ${name}:\n`);
  expect(start, `job ${name}`).toBeGreaterThan(-1);
  const rest = text.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

// Minutes from Monday 00:00 UTC; cron day 0 (Sunday) is the END of the week, day 7.
function weekMinute(cron: string) {
  const [m, h, , , d] = cron.split(' ').map(Number);
  return (d === 0 ? 7 : d) * 1440 + h * 60 + m;
}

describe('routine-marjorie-weekly-review.yml', () => {
  it('runs Sundays, before Tree’s Monday plan, and can be dispatched', () => {
    const cron = extractCron(review);
    expect(cron).toBe('13 20 * * 0');
    const tree = extractCron(treePlan);
    // Tree = Monday 10:00; Marjorie's Sunday 20:13 is the end of the previous week, ~14h before it.
    const gap = weekMinute(tree) + 7 * 1440 - weekMinute(cron);
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(24 * 60);
    expect(review).toMatch(/workflow_dispatch:/);
  });

  it('uses the Fable model the working Austin routine uses, bounded by turns, budget input and timeout', () => {
    const model = /model: (claude-fable-[\w-]+)/.exec(review)?.[1];
    expect(model).toBe('claude-fable-5');
    expect(austin).toContain(`model: ${model}`);
    expect(review).toMatch(/max_turns: \d+/);
    expect(Number(/max_turns: (\d+)/.exec(review)![1])).toBeLessThanOrEqual(100);
    expect(review).toMatch(/timeout_minutes: \d+/);
    expect(review).toContain('inputs.max_budget_usd');
  });

  it('caps scheduled runs with a nonzero budget (manual 0 falls back to it)', () => {
    const expr = /max_budget_usd: \$\{\{ fromJSON\(format\('\{0\}', (.+)\)\) \}\}/.exec(review)![1];
    expect(expr).toBe("github.event_name == 'workflow_dispatch' && inputs.max_budget_usd > 0 && inputs.max_budget_usd || 12");
    expect(review).not.toMatch(/inputs\.max_budget_usd \|\| 0/);
  });

  it('gives the agent no Write/Edit/Task and no secret beyond the OAuth token', () => {
    const tools = extractAllowedTools(review);
    expect(tools).toEqual(expect.arrayContaining(['Bash', 'Read', 'Grep', 'Glob']));
    for (const forbidden of ['Write', 'Edit', 'Task', 'MultiEdit', 'NotebookEdit']) expect(tools).not.toContain(forbidden);
    const agentJob = job(review, 'run');
    expect(agentJob).toContain('CLAUDE_CODE_OAUTH_TOKEN');
    expect(agentJob).not.toMatch(/SOCIAL_POSTER_PAT|DISCORD_|webhook/i);
    expect(review).not.toContain('DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL');
    expect(agentJob).toContain('post_run_artifact: marjorie-weekly-review-out');
    expect(agentJob).toContain('pre_run_artifact: marjorie-growth-data');
    expect(agentJob).not.toContain('VERCEL');
  });

  it('reads VERCEL_TOKEN only in the plain collect job, on main, via env', () => {
    const collect = job(review, 'collect');
    expect(collect).toContain('ref: main');
    expect(collect).toContain('VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}');
    expect(collect).toContain('scripts/marjorie/growth-data.mjs');
    expect(collect).not.toContain('claude-code-action');
    expect(collect).toContain('name: marjorie-growth-data');
    expect(review.match(/secrets\.VERCEL_TOKEN/g)).toHaveLength(1);
    expect(job(review, 'run')).toContain('needs: collect');
  });

  it('files Tree asks from a plain job on the workflow token with main pinned, then calls the bridge', () => {
    const filing = job(review, 'file-tree-feedback');
    expect(filing).toContain('ref: main');
    expect(filing).toContain('loop-asks.mjs file-marjorie');
    expect(filing).toContain('--no-edit');
    expect(filing).toContain('secrets.GITHUB_TOKEN');
    expect(filing).not.toContain('claude-code-action');
    expect(review).toContain('uses: ./.github/workflows/marjorie-bot1-bridge.yml');
  });

  it('passes the repo routine-workflow invariants', () => {
    const { problems } = checkRoutineWorkflows({ '.github/workflows/routine-marjorie-weekly-review.yml': review });
    expect(problems).toEqual([]);
  });
});

describe('marjorie-bot1-bridge.yml', () => {
  it('holds the webhook only under the ops environment, with main checked out, and never on the agent path', () => {
    expect(bridge).toMatch(/environment: ops/);
    expect(bridge).toMatch(/ref: main/);
    expect(bridge).toContain('DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL: ${{ secrets.DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL }}');
    expect(bridge).not.toContain('claude-code-action');
  });
  it('sends at most three files per run, via the script, and dry-runs by default when typed in', () => {
    expect(bridge).toContain('${files[@]:0:3}');
    expect(bridge).toContain('scripts/marjorie/prompt-bot1.mjs send');
    expect(bridge).toMatch(/dry_run:[\s\S]*?default: true/);
    expect(bridge).toContain('concurrency:');
  });
});

describe('weekly review prompt', () => {
  it('asks the six questions, each answered with verdict, why, evidence', () => {
    for (const q of [
      'Are we growing?', 'Is our content top tier?', 'Is our social strategy good?',
      'Are we catching time-sensitive content?', 'How do we make money?', "Are Tree's feedback and issues being addressed?",
    ]) expect(prompt).toContain(q);
    for (const part of ['**Verdict**', '**Why**', '**Evidence**']) expect(prompt).toContain(part);
    expect(prompt).toContain('Patient Zero');
  });
  it('carries the stable `## Next up` section, the weekly-plan title and label, and closes the previous plan', () => {
    expect(prompt).toContain('## Next up');
    expect(prompt).toContain('"Week of <YYYY-MM-DD> — plan"');
    expect(prompt).toContain('--label weekly-plan');
    expect(prompt).toMatch(/gh issue close <previous-number>/);
  });
  it('is bounded: 3–5 priorities, six issues, two Tree asks, three bot1 prompts, no self-check-ins', () => {
    expect(prompt).toMatch(/3 to 5 priorities/);
    expect(prompt).toMatch(/At most \*\*6 issues/);
    expect(prompt).toMatch(/at most 2 asks/);
    expect(prompt).toMatch(/At most \*\*3 prompts\*\*/);
    expect(prompt).toContain('## Run discipline');
    expect(prompt).toMatch(/Do not arm a self-check-in/);
  });
  it('uses the collector and the deterministic funnel, never invents traffic, dedupes, and gives Tree asks the loop-asks shape', () => {
    expect(prompt).toContain('scripts/marjorie/growth-data.mjs');
    expect(prompt).toMatch(/If `traffic` is `null`, say so plainly/);
    expect(prompt).toContain('previousWeek');
    expect(prompt).toContain('siteStateUnverified');
    expect(prompt).toContain('marjorie-triage.md');
    expect(prompt).toMatch(/dedupe/i);
    expect(prompt).toContain('.scratch/out/for-tree-1.md');
    expect(prompt).toContain('- For Tree:');
    expect(prompt).toContain('**Tree**');
    expect(prompt).toContain('.claude/skills/prompting-bot1/SKILL.md');
  });
  it('closes only asks it satisfied and files no HUMAN-ACTIONS entry itself', () => {
    expect(prompt).toMatch(/never close an ask you did not satisfy/i);
    expect(prompt).toMatch(/cannot edit `HUMAN-ACTIONS.md`/);
  });
  it('puts `## Next up` (the ranked priorities) directly after the TL;DR in the template', () => {
    const template = prompt.slice(prompt.indexOf('**Week of <YYYY-MM-DD>**'));
    const headings = [...template.matchAll(/^## .+$/gm)].map((m) => m[0]);
    expect(headings[0]).toBe('## Next up');
    expect(headings.filter((h) => h === '## Next up')).toHaveLength(1);
    expect(headings.indexOf('## Next up')).toBeLessThan(headings.indexOf('## The six questions'));
    expect(prompt).toMatch(/directly after the TL;DR/);
    expect(prompt).toContain('## Priority detail');
  });
  it('requires the exact attribution trailer', () => {
    expect(prompt).toContain(TRAILER);
  });
});

describe('charter, decision log and skill', () => {
  const mission = charter.slice(charter.indexOf('## Mission'), charter.indexOf('## Responsibilities'));
  it('mission leads with growth via fan value and names its five concerns, with no launch/email framing', () => {
    expect(mission).toMatch(/Growth is priority #1/);
    for (const concern of ['Content quality', 'Social reach', 'Time-sensitive coverage', 'Fashion monetisation', 'The machine']) expect(mission).toContain(concern);
    expect(mission).not.toMatch(/\bLAUNCH\b|12:45/);
  });
  it('records the amendment, the bridge limits, and the decisions entry', () => {
    expect(charter).toContain('## Amendment (2026-09-30, owner): growth first, and a bounded bridge to bot1');
    expect(charter).toMatch(/at most three prompts per UTC day/);
    const decisions = read('docs/decisions.md');
    expect(decisions).toContain('## 2026-09-30 — Growth-first mandate for Marjorie, a weekly Fable review, and a bounded bot1 bridge');
    expect(decisions).toMatch(/amends the\s+`#longlive` rule/);
  });
  it('the brief prompt no longer headlines launch', () => {
    const brief = read('docs/agents/runner-prompts/marjorie-brief.md');
    expect(brief).toContain('the company\'s goal is GROWTH');
    expect(brief).not.toContain("the company's goal is LAUNCH. docs/launch-readiness.md is the gate tracker — the org exists");
  });
  it('the bridge is on (Hermes#1 live 2026-10-01) and the skill covers when/how/what-not/examples', () => {
    expect(JSON.parse(read('scripts/marjorie/marjorie-config.json')).bot1Bridge.enabled).toBe(true);
    for (const section of ['## When to prompt bot1', '## How to write the prompt', '**Do not ask for:**', '## What to expect', '## Examples']) expect(skill).toContain(section);
    expect(skill).toMatch(/one outcome/i);
    expect(skill).toMatch(/Done when/);
  });
  it('the triage prompt sends via the artifact path and the chat prompt hands off by candidate comment, both through the skill', () => {
    const t = read('docs/agents/runner-prompts/marjorie-triage.md');
    const c = read('docs/agents/runner-prompts/marjorie-chat.md');
    for (const text of [t, c]) expect(text).toContain('.claude/skills/prompting-bot1/SKILL.md');
    expect(t).toContain('.scratch/out/bot1-prompt-1.md');
    expect(c).toContain('bot1-candidate:');
    expect(c).toContain('chat-post.mjs save-bot1');
  });
  it('the new labels are bootstrapped', () => {
    const names = LABELS.map(([n]: [string]) => n);
    expect(names).toEqual(expect.arrayContaining(['weekly-plan', 'bot1-bridge']));
  });
});

// routine-marjorie-triage.yml (and its bot1 sender job) was deleted 2026-10-09; the reference prompt checks above remain.
describe('cadence entries and the human action', () => {
  it('registers the weekly review and Tree plan in the standing cadence check', () => {
    const find = (name: string) => cadence.runners.find((r: { name: string }) => r.name === name);
    expect(find('Marjorie — weekly growth review')).toEqual({ name: 'Marjorie — weekly growth review', perDay: 0.14, maxAgeHours: 216, match: { kind: 'issue-label', value: 'weekly-plan' } });
    expect(find('Tree — weekly social plan').match).toEqual({ kind: 'pr-branch', value: 'tree/plan/' });
  });
  it('files the bridge human action in format v2 with the literal secret name and the Hermes tracking link', () => {
    const ha = read('HUMAN-ACTIONS.md');
    if (!ha.includes('## #89 ')) {
      // Closed: the item moves to the ledger (format v2), so assert it landed there instead.
      expect(read('HUMAN-ACTIONS-DONE.md')).toMatch(/^- #89 · \d{4}-\d{2}-\d{2} · (done|skip) · /m);
      return;
    }
    const entry = ha.slice(ha.indexOf('## #89 '), ha.indexOf('## #88 '));
    expect(entry).toMatch(/^## #89 🟢 \[UPGRADE\] /);
    for (const literal of ['DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL', '`ops`', 'https://github.com/JW-Incorporated/Hermes/issues/1', 'bot1Bridge.enabled', '`Marjorie`']) expect(entry).toContain(literal);
    for (const label of ['**Why:**', '**Steps:**', '**Worked if:**']) expect(entry).toContain(label);
    expect(entry).not.toMatch(/\*\*Status/);
    expect(Buffer.byteLength(entry)).toBeLessThanOrEqual(1500);
  });
  it('the brief prompt and charter no longer headline launch framing', () => {
    const brief = read('docs/agents/runner-prompts/marjorie-brief.md');
    expect(brief).not.toContain('failed org day');
    expect(brief).not.toContain('launch-gate ticket');
    expect(charter).not.toContain('days-to-launch');
    expect(charter).not.toContain('launch tracker shows a gate moved');
  });
});
