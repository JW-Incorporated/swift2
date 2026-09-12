// MEDIUM (Codex round 3): two consecutive review rounds found HIGH bugs in
// routine-tree-weekly-plan.yml/tree-mail.yml with nothing but human
// re-reading as the regression gate. These assertions parse the raw YAML
// text (no YAML-parser dependency -- `js-yaml` is only a transitive
// dependency of this repo, never a declared one, matching the existing
// convention in scripts/merch-engine/*-workflow.test.ts of asserting
// against workflow files as plain text) so a future edit that reintroduces
// any of these three specific vulnerability classes fails CI instead of
// waiting for a fourth review round to catch it.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const WORKFLOWS = ['.github/workflows/routine-tree-weekly-plan.yml', '.github/workflows/tree-mail.yml'];

function readWorkflow(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

function countOccurrences(text: string, re: RegExp): number {
  return (text.match(re) ?? []).length;
}

/** Every `run:` step's own content -- single-line (`run: cmd`), literal
 * block (`run: |`), and folded block (`run: >`) alike -- keyed off
 * indentation the same way YAML itself does, never a fixed line count.
 * Normalizes CRLF/LF first: tree-mail.yml is CRLF, routine-tree-weekly-
 * plan.yml is LF, and a bare `$` anchor per line silently stops matching
 * on a CRLF file otherwise (a real trap hit while writing this test --
 * `.` never matches `\r`, so `(.*)$` fails on a line ending `...|\r`). */
function extractRunBlocks(text: string): string[] {
  const lines = text.split(/\r\n|\n/);
  const blocks: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    // 6+ spaces: a step's own `run:` key, never the 2-space `jobs.run:` job name.
    const m = lines[i].match(/^( {6,})run:(.*)$/);
    if (!m) continue;
    const indent = m[1].length;
    const inline = m[2].trim();
    if (inline && !inline.startsWith('|') && !inline.startsWith('>')) {
      blocks.push(inline); // single-line `run: some command`
      continue;
    }
    const content: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.trim() === '') {
        content.push(line);
        continue;
      }
      const lineIndent = line.match(/^( *)/)?.[1].length ?? 0;
      if (lineIndent <= indent) break;
      content.push(line);
    }
    blocks.push(content.join('\n'));
  }
  return blocks;
}

describe('HIGH-1 (Codex rounds 1-3): every secret-holding checkout is pinned to main', () => {
  it.each(WORKFLOWS)('%s: every actions/checkout step is followed by an explicit ref: main', (path) => {
    const workflow = readWorkflow(path);
    const totalCheckouts = countOccurrences(workflow, /uses:\s*actions\/checkout@v\d+/g);
    const pinnedCheckouts = countOccurrences(workflow, /uses:\s*actions\/checkout@v\d+\s*\n\s*with:\s*\n\s*ref:\s*main\b/g);
    expect(totalCheckouts).toBeGreaterThan(0); // sanity: this file actually has checkouts to check
    expect(pinnedCheckouts).toBe(totalCheckouts);
  });
});

describe('HIGH-1, third finding (Codex round 3): the privileged jobs are also gated by a branch-locked environment', () => {
  it('routine-tree-weekly-plan.yml: send-brief declares environment: social-brief', () => {
    const workflow = readWorkflow('.github/workflows/routine-tree-weekly-plan.yml');
    const sendBriefJob = workflow.split(/^ {2}send-brief:/m)[1];
    expect(sendBriefJob).toBeDefined();
    expect(sendBriefJob).toMatch(/^\s*environment:\s*social-brief\s*$/m);
  });

  it('tree-mail.yml: both tree-pr-mail and founder-task-digest declare environment: tree-mail', () => {
    const workflow = readWorkflow('.github/workflows/tree-mail.yml');
    for (const jobName of ['tree-pr-mail', 'founder-task-digest']) {
      const nextJobBoundary = new RegExp(`^ {2}(?!${jobName}:)[a-zA-Z0-9_-]+:`, 'm');
      const afterJob = workflow.split(new RegExp(`^ {2}${jobName}:`, 'm'))[1];
      expect(afterJob, `job ${jobName} not found`).toBeDefined();
      const jobBlock = afterJob.split(nextJobBoundary)[0];
      expect(jobBlock).toMatch(/^\s*environment:\s*tree-mail\s*$/m);
    }
  });
});

describe('HIGH (output-injection, Codex round 2): no run: block ever interpolates ${{ }} directly', () => {
  it.each(WORKFLOWS)('%s: zero run: blocks contain ${{ -- every dynamic value goes through env:', (path) => {
    const workflow = readWorkflow(path);
    const runBlocks = extractRunBlocks(workflow);
    expect(runBlocks.length).toBeGreaterThan(0); // sanity: this file actually has run: steps to check
    const offenders = runBlocks.filter((block) => block.includes('${{'));
    expect(offenders).toEqual([]);
  });

  it('the $GITHUB_OUTPUT heredoc delimiter is generated fresh per run, never a hardcoded literal', () => {
    const workflow = readWorkflow('.github/workflows/routine-tree-weekly-plan.yml');
    // The specific line that broke this: `echo 'body<<PR_BODY_EOF'` (a
    // fixed string an attacker-controlled PR body can contain verbatim).
    // A random per-run suffix is what makes the delimiter unguessable.
    expect(workflow).toMatch(/BODY_DELIM=.*openssl rand -hex/);
    expect(workflow).not.toMatch(/<<PR_BODY_EOF['"\s]/); // the old fixed literal must never come back verbatim
  });
});

describe('LOW (Codex round 3): the permalink line always resolves to the LAST occurrence, not the first', () => {
  it('routine-tree-weekly-plan.yml uses tail -1, never head -1, for the Discord brief: line', () => {
    const workflow = readWorkflow('.github/workflows/routine-tree-weekly-plan.yml');
    expect(workflow).toMatch(/Discord brief:[\s\S]*?\|\s*tail -1/);
    expect(workflow).not.toMatch(/Discord brief:[\s\S]*?\|\s*head -1/);
  });

  // The tree-mail.yml counterpart to this test (a "takes the last regex
  // match" guard on the "Build payload from the plan PR" step) was removed
  // along with that step (Marjorie Overhaul C3, docs/specs/marjorie-overhaul/
  // c3-email-retired.md): the weekly-plan email is deleted outright, not
  // re-routed, so there is no more permalink-substitution logic in this file
  // to regress.
});
