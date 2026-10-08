import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from './lib/generated-content.mjs';

// #4680 — auto-merge-content.yml may only disarm an auto-merge IT armed.
// This runs the workflow's real own_arm()/verdict() shell (sliced out of the
// YAML, so the test cannot drift from it) against a stubbed `gh`.

const WORKFLOW = readFileSync(join(ROOT, '.github/workflows/auto-merge-content.yml'), 'utf8');
const START = WORKFLOW.indexOf('          own_arm() {');
const END = WORKFLOW.indexOf('          if [ -n "${FREEZE:-}" ]');
const FUNCS = WORKFLOW.slice(START, END);

interface Run {
  disabled: boolean;
  labelRemoved: boolean;
}

function run(opts: { labels: string | null; headRef: string; verdict: string }): Run {
  const ghStub =
    opts.labels === null
      ? 'return 1'
      : `printf '%s\\n' ${JSON.stringify(opts.labels)} | tr ',' '\\n' | sed '/^$/d'`;
  const script = `
set -euo pipefail
PR=1; REPO=o/r; HEAD_REF=${JSON.stringify(opts.headRef)}; LABEL_TOKEN=x
gh() {
  case "$*" in
    *"--disable-auto"*) echo DISABLED >>"$LOG" ;;
    *"--remove-label automerge:content"*) echo UNLABELED >>"$LOG" ;;
    "pr view"*) ${ghStub} ;;
  esac
}
${FUNCS}
verdict ${JSON.stringify(opts.verdict)} "msg" >/dev/null
`;
  const log = join(
    process.env.TMPDIR ?? process.env.TEMP ?? '/tmp',
    `own-arm-${process.pid}-${Math.random()}.log`,
  );
  const res = spawnSync('bash', ['-c', script], {
    env: { ...process.env, LOG: log.replace(/\\/g, '/') },
    encoding: 'utf8',
  });
  expect(res.status, res.stderr).toBe(0);
  let out: string;
  try {
    out = readFileSync(log, 'utf8');
  } catch {
    out = '';
  }
  return { disabled: out.includes('DISABLED'), labelRemoved: out.includes('UNLABELED') };
}

describe('auto-merge-content only disarms its own arms (#4680)', () => {
  it('slices the real functions out of the workflow', () => {
    expect(START).toBeGreaterThan(0);
    expect(END).toBeGreaterThan(START);
  });

  it('leaves an agent-set auto-merge alone on a declined verdict', () => {
    const r = run({
      labels: 'desk:ops',
      headRef: 'fix/some-agent-pr',
      verdict: 'declined — not a recognized content-lane branch/author',
    });
    expect(r).toEqual({ disabled: false, labelRemoved: false });
  });

  it('disarms and unlabels an arm the workflow made (automerge:content present)', () => {
    const r = run({
      labels: 'automerge:content,desk:ops',
      headRef: 'tree/2026-10-01',
      verdict: 'declined — needs a human merge',
    });
    expect(r).toEqual({ disabled: true, labelRemoved: true });
  });

  it('never disarms on the enabled verdict', () => {
    const r = run({ labels: 'automerge:content', headRef: 'tree/2026-10-01', verdict: 'enabled' });
    expect(r).toEqual({ disabled: false, labelRemoved: false });
  });

  it('always disarms a social-draft PR, label or not', () => {
    expect(run({ labels: 'social-draft', headRef: 'tree/x', verdict: 'frozen' }).disabled).toBe(
      true,
    );
    expect(
      run({
        labels: '',
        headRef: 'tree/x',
        verdict: 'declined — social draft awaiting founder approval',
      }).disabled,
    ).toBe(true);
  });

  it('always disarms the poster state PRs (#2039 protection)', () => {
    expect(
      run({
        labels: '',
        headRef: 'social-poster/state-20261001',
        verdict: 'declined — needs a human merge',
      }).disabled,
    ).toBe(true);
  });

  it('fails closed (disarms) when the label lookup fails', () => {
    expect(run({ labels: null, headRef: 'fix/x', verdict: 'BROKEN GATE' }).disabled).toBe(true);
  });

  it('stamps the label before arming', () => {
    const arm = WORKFLOW.indexOf('--squash --auto --delete-branch');
    const stamp = WORKFLOW.indexOf('--add-label automerge:content');
    expect(stamp).toBeGreaterThan(0);
    expect(stamp).toBeLessThan(arm);
  });
});
