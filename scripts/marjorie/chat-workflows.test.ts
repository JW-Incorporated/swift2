// Text assertions over the M5 chat routines (no YAML parser, matching
// scripts/social/weekly-brief-workflows.test.ts): the properties a later
// edit could silently break and no unit test of a script would catch.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { BOTS, runTitle } from './lib/chat-inbox.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { STAGES } from './chat-alarm.mjs';

const read = (file: string) => readFileSync(resolve(file), 'utf8').replace(/\r\n/g, '\n');

/** Each top-level job's text, keyed by job name (2-space keys under `jobs:`). */
function jobs(text: string): Record<string, string> {
  const body = text.slice(text.indexOf('\njobs:\n') + 7);
  const out: Record<string, string> = {};
  let name = '';
  for (const line of body.split('\n')) {
    const m = /^ {2}([a-z][\w-]*):\s*$/.exec(line);
    if (m) name = m[1];
    else if (name) out[name] = `${out[name] || ''}${line}\n`;
  }
  return out;
}

const deployed = (Object.entries(BOTS) as Array<[string, { workflow: string }]>).filter(([, cfg]) => existsSync(resolve('.github/workflows', cfg.workflow)));

describe.each(deployed)('%s chat routine', (bot, cfg) => {
  const file = `.github/workflows/${cfg.workflow}`;
  const text = read(file);
  const byJob = jobs(text);

  it('names each run exactly as the poll looks it up', () => {
    const title = runTitle(bot, '${{ inputs.message_id }}');
    expect(text).toContain(`run-name: "${title}"`);
  });

  it('is dispatch-only, with a per-message concurrency group', () => {
    expect(text).not.toMatch(/^\s*schedule:/m);
    expect(text).toMatch(/^concurrency:\n {2}group: [a-z]+-chat-\$\{\{ inputs\.message_id \}\}/m);
  });

  it('never hands a Discord secret to the agent job', () => {
    expect(byJob.run).toContain('uses: ./.github/workflows/routine-template.yml');
    expect(byJob.run).not.toMatch(/DISCORD_|WEBHOOK/);
  });

  it('holds Discord secrets only in environment-scoped jobs that check out main', () => {
    for (const [name, job] of Object.entries(byJob)) {
      if (!/secrets\.DISCORD_/.test(job)) continue;
      expect(job, name).toMatch(/environment: (social|ops)\n/);
      expect(job, name).toMatch(/ref: main\n/);
    }
  });

  it('deletes its chat artifacts when the run is done', () => {
    const cleaner = Object.values(byJob).find((job) => job.includes('actions/artifacts'));
    expect(cleaner).toMatch(/if: always\(\)[\s\S]*actions\/artifacts/);
  });

  it('acts and posts only on a first attempt, so a re-run can only settle (Codex R2 findings 1-2)', () => {
    const firstAttempt = (text: string) => /^\s+if: (?:always\(\) && )?github\.run_attempt == '1' && /m.test(text);
    expect(firstAttempt(byJob.run), 'run').toBe(true);
    let posts = 0;
    for (const [name, job] of Object.entries(byJob)) {
      const [head, ...steps] = job.split('\n      - ');
      for (const step of steps.filter((s) => /WEBHOOK_URL|chat-post\.mjs post /.test(s))) {
        posts += 1;
        expect(firstAttempt(head) || firstAttempt(step), `${name}: ${step.split('\n')[0]}`).toBe(true);
      }
    }
    expect(posts).toBe(1);
  });

  it('takes every delivery guard from inputs and context outputs, never the context artifact', () => {
    expect(byJob.context).toContain('message_url: ${{ steps.thread.outputs.message_url }}');
    const delivery = Object.entries(byJob).filter(([name]) => name !== 'context' && name !== 'run').map(([, job]) => job).join('\n');
    expect(delivery).not.toMatch(/name: chat-context|--context /);
    expect(delivery).toMatch(/chat-post\.mjs finish [^\n]*--reply-thread-id "\$REPLY_THREAD_ID" --message-url "\$MESSAGE_URL"/);
    expect(delivery).toMatch(/chat-post\.mjs post [^\n]*--message-url "\$MESSAGE_URL"/);
  });

  it('lets the poll-dispatched agent run: allowed_bots names the github-actions bot and nothing wider', () => {
    // The poll dispatches on its GITHUB_TOKEN, a bot actor; without this the
    // agent step fails "Workflow initiated by non-human actor" (runs
    // 34783453078 / 34783456730). Never '*' — the repo is public.
    expect(byJob.run).toMatch(/^\s+allowed_bots: github-actions(\s|$)/m);
    const template = read('.github/workflows/routine-template.yml');
    expect(template).toMatch(/^\s+allowed_bots: \$\{\{ inputs\.allowed_bots \}\}$/m);
    expect(template).toMatch(/allowed_bots:\n(?: {8}.*\n)+? {8}default: ""/);
  });

  it('gives Tree no push, dispatch or PAT rights (read-mostly)', () => {
    if (bot !== 'tree') return;
    expect(byJob.run).not.toMatch(/SOCIAL_POSTER_PAT|expose_dispatch_token|Bash\(git/);
  });
});

describe('bot-chat-alarm.yml (M7, m7-doorbell.md Mechanics 7)', () => {
  const text = read('.github/workflows/bot-chat-alarm.yml');
  const byJob = jobs(text);
  const steps = (job: string) => job.split('\n      - ').slice(1);

  it('is dispatch-only, named by stage and message, one group per message', () => {
    expect(text).not.toMatch(/^\s*schedule:/m);
    expect(text).toMatch(/^ {2}workflow_dispatch:/m);
    expect(text).toContain('run-name: "Chat alarm · ${{ inputs.stage }} · ${{ inputs.message_id }}"');
    // Per stage for a standing alert, so two alarms never both create it (Codex R1 #1).
    expect(text).toMatch(/^concurrency:\n {2}group: bot-chat-alarm-\$\{\{ inputs\.stage == 'stuck' && inputs\.message_id \|\| inputs\.stage \}\}/m);
    expect(text).toContain(`options: [${STAGES.join(', ')}]`);
  });

  it('has no agent job', () => {
    expect(text).not.toMatch(/routine-template\.yml|claude-code-action|CLAUDE_CODE_OAUTH_TOKEN/);
    expect(Object.keys(byJob)).toEqual(['check', 'alert']);
  });

  it('holds secrets only in run: steps of social/ops jobs that check out main', () => {
    for (const [name, job] of Object.entries(byJob)) {
      expect(job, name).toMatch(/environment: (social|ops)\n/);
      expect(job, name).toMatch(/ref: main\n/);
      for (const step of steps(job).filter((s) => s.includes('secrets.'))) {
        expect(step, `${name}: ${step.split('\n')[0]}`).toMatch(/\n {8}run: /);
        expect(step, name).not.toMatch(/^uses:/);
      }
    }
    expect(byJob.check).not.toMatch(/WEBHOOK|issues: write/);
  });

  it('opens an alert and starts Marjorie only on a first attempt, never on a dry run', () => {
    expect(byJob.alert).toMatch(/^ {4}if: github\.run_attempt == '1' && needs\.check\.outputs\.alert == 'true' && !inputs\.dry_run$/m);
    expect(byJob.alert).toContain('run: node scripts/marjorie/chat-alarm.mjs alert');
    expect(byJob.alert).not.toMatch(/set -e/);
  });

  it('never interpolates an expression into a script', () => {
    const scripts = [...text.matchAll(/\n {8}run: (\|\n(?: {10}.*\n?)+|.*)/g)].map((m) => m[1]);
    expect(scripts.length).toBe(2);
    for (const script of scripts) expect(script).not.toContain('${{');
  });

  it("lets the alarm's GITHUB_TOKEN dispatch start Marjorie's ops agent", () => {
    expect(jobs(read('.github/workflows/routine-marjorie-ops.yml')).run).toMatch(/^\s+allowed_bots: github-actions(\s|$)/m);
  });
});
