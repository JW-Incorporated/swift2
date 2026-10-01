// Invariants for the one-click OTA rollback workflow. Parses the YAML so the
// safety properties (serialised with the release train, pinned CLI, no
// script injection) cannot be dropped in an unrelated cleanup.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { ROOT } from '../lib/generated-content.mjs';

const load = (rel: string) => parse(readFileSync(join(ROOT, ...rel.split('/')), 'utf8'));
const wf = load('.github/workflows/mobile-rollback.yml');
const release = load('.github/workflows/mobile-release.yml');

const steps: Array<Record<string, unknown>> = Object.values<{
  steps: Array<Record<string, unknown>>;
}>(wf.jobs).flatMap((j) => j.steps);
const runs = steps.map((s) => s.run).filter((r): r is string => typeof r === 'string');

describe('mobile-rollback.yml', () => {
  it('is workflow_dispatch only', () => {
    expect(Object.keys(wf.on)).toEqual(['workflow_dispatch']);
  });

  it('has the expected inputs, mode being a list|republish choice', () => {
    const inputs = wf.on.workflow_dispatch.inputs;
    expect(inputs.mode.type).toBe('choice');
    expect(inputs.mode.options).toEqual(['list', 'republish']);
    expect(inputs.mode.default).toBe('list');
    for (const k of ['ios_group', 'android_group', 'message']) expect(inputs[k]).toBeDefined();
  });

  it('serialises with the release train and never cancels in flight', () => {
    expect(wf.concurrency.group).toBe(release.concurrency.group);
    expect(wf.concurrency['cancel-in-progress']).toBe(false);
  });

  it('has read-only permissions', () => {
    expect(wf.permissions).toEqual({ contents: 'read' });
  });

  it('pins eas-cli at 23.2.0', () => {
    expect(runs.some((r) => r.includes('eas-cli@23.2.0'))).toBe(true);
  });

  it('guards a missing EXPO_TOKEN', () => {
    expect(runs.some((r) => r.includes('-z "$EXPO_TOKEN"') && r.includes('exit 1'))).toBe(true);
  });

  it('every republish command targets production, non-interactive, with a group', () => {
    const cmds = runs
      .flatMap((r) => r.split('\n'))
      .filter((l) => l.includes('eas update:republish'));
    expect(cmds.length).toBeGreaterThan(0);
    for (const c of cmds) {
      expect(c).toContain('--branch production');
      expect(c).toContain('--non-interactive');
      expect(c).toContain('--group');
    }
  });

  it('never interpolates inputs into a run: script', () => {
    for (const r of runs) expect(r).not.toContain('${{ inputs.');
  });

  it('validates group ids before use', () => {
    expect(runs.some((r) => r.includes('^[0-9a-fA-F-]{36}$'))).toBe(true);
  });
});
