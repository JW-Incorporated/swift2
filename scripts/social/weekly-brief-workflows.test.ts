// The weekly brief is retired (owner decision 2026-10-09: ONE daily digest, from
// Tree's Hermes loop). routine-tree-weekly-plan.yml used to carry a `send-brief`
// job holding the Discord webhook and dispatching tree-mail.yml; two review rounds
// had found HIGH bugs there (checkout pinning, ${{ }} in run: blocks, environment
// gating, heredoc delimiters, permalink order). Those risks left with the job.
// This file now pins that they STAY gone: nothing in the weekly plan can message
// the owner, and the plan run that remains (it writes social/calendar.md, which
// Tree's daily loop reads) cannot grow a secret-holding job back unnoticed.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const PLAN = '.github/workflows/routine-tree-weekly-plan.yml';
const read = (path: string): string => readFileSync(resolve(path), 'utf8').replace(/\r\n/g, '\n');

describe('routine-tree-weekly-plan.yml keeps the plan run and sends nothing', () => {
  const workflow = read(PLAN);

  it('still runs the plan (the only writer of social/calendar.md) and the taste filer', () => {
    expect(workflow).toMatch(/^ {2}run:\n {4}uses: \.\/\.github\/workflows\/routine-template\.yml/m);
    expect(workflow).toContain('prompt_file: docs/agents/runner-prompts/tree-weekly-plan.md');
    expect(workflow).toMatch(/^ {2}taste:\n/m);
    expect(workflow).toContain('uses: ./.github/workflows/taste-ruling-file.yml');
  });

  it('keeps mode=replan, which social-event-status.yml and check-event-transition.mjs dispatch', () => {
    expect(workflow).toMatch(/workflow_dispatch:\n {4}inputs:\n {6}mode:/);
    expect(workflow).toContain('- replan');
  });

  it('has no send-brief job, no webhook, no Discord post, no tree-mail dispatch, no workflow-level actions: write', () => {
    expect(workflow).not.toMatch(/^ {2}send-brief:/m);
    expect(workflow).not.toMatch(/weekly-brief\.mjs|loop-asks\.mjs|tree-mail|social-brief|WEBHOOK|DISCORD/);
    // The workflow-level grant stays read-mostly; only the taste filer job holds actions: write (its own dispatch).
    expect(workflow.slice(0, workflow.indexOf('\njobs:'))).not.toMatch(/actions: write/);
  });

  it('declares no job other than run and taste, so no secret-holding step can slip in', () => {
    const body = workflow.slice(workflow.indexOf('\njobs:\n') + 7);
    const names = [...body.matchAll(/^ {2}([a-z][\w-]*):\s*$/gm)].map((m) => m[1]);
    expect(names).toEqual(['run', 'taste']);
  });
});

describe('the retired mail workflow stays retired', () => {
  it('tree-mail.yml is gone and nothing dispatches it', () => {
    expect(existsSync(resolve('.github/workflows/tree-mail.yml'))).toBe(false);
    expect(read(PLAN)).not.toContain('tree-mail.yml');
  });
});
