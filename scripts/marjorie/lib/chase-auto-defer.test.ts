import { describe, expect, it } from 'vitest';
import { applyAutoDefers, planAutoDefers, AUTO_DEFER_NOTE } from './chase-auto-defer.mjs';
import { applyDispatchChase } from './dispatch-chase-apply.mjs';
import { actionMarker } from './chase-action.mjs';

const NOW = Date.parse('2026-10-13T12:00:00Z');

const block = (ha: number, issue: number, filed: string) =>
  `## #${ha} 🟡 [DECIDE] #${issue} has had no activity for 4 days (~2 min)\n<!-- ha filed=${filed} -->\n<!-- marjorie-chase: 96h issue=${issue} -->\n\n**Why:** x.\n\n**Steps:**\n1. Reply.\n\n**Worked if:** y.\n`;
const openMd = (...blocks: string[]) => `# Human actions\n\n> **${blocks.length} open.**\n\n${blocks.join('\n')}`;
const DONE = '# Done\n\n- #1 · 2026-01-01 · done · old — "x" · by chat\n';
const issue = (number: number, labels: string[] = [], comments: { body: string }[] = []) => ({ number, labels: labels.map((name) => ({ name })), comments });

function harness(files: Record<string, string>) {
  const calls: string[][] = [];
  const exec = async (cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    return cmd === 'gh' && args[0] === 'pr' && args[1] === 'create' ? 'https://github.com/o/r/pull/9\n' : '';
  };
  return {
    calls, files, exec,
    readFileImpl: async (name: string) => files[name],
    writeFileImpl: async (name: string, value: string) => { files[name] = value; },
  };
}

describe('planAutoDefers', () => {
  it('leaves a 6-day-old chase untouched', () => {
    expect(planAutoDefers({ issues: [issue(4324)], openActions: openMd(block(109, 4324, '2026-10-07')), now: NOW })).toEqual([]);
  });
  it('selects a 7-day-old chase', () => {
    const due = planAutoDefers({ issues: [issue(4324)], openActions: openMd(block(109, 4324, '2026-10-06')), now: NOW });
    expect(due).toEqual([{ ha: 109, issue: 4324, commented: false, labeled: false }]);
  });
  it('never auto-defers a founder/product decision', () => {
    for (const label of ['founder-decision', 'desk:founder', 'founder-task']) {
      expect(planAutoDefers({ issues: [issue(4324, [label])], openActions: openMd(block(109, 4324, '2026-10-01')), now: NOW })).toEqual([]);
    }
  });
  it('leaves an already-replied chase to the reply path', () => {
    const open = openMd(block(109, 4324, '2026-10-01'));
    const reply = { body: `Founder assigned.\n\n${actionMarker({ ha: 109, issue: 4324, action: 'assign', messageId: '123456789012345678' })}` };
    expect(planAutoDefers({ issues: [issue(4324, [], [reply])], openActions: open, now: NOW })).toEqual([]);
    expect(planAutoDefers({ issues: [issue(4324, ['deferred'])], openActions: open, now: NOW })).toEqual([]);
    expect(planAutoDefers({ issues: [issue(4324, ['founder-assigned'])], openActions: open, now: NOW })).toEqual([]);
  });
  it('resumes only the HA close once the auto marker exists', () => {
    const body = `x\n\n${actionMarker({ ha: 109, issue: 4324, action: 'defer', messageId: 'auto-7d' })}`;
    const due = planAutoDefers({ issues: [issue(4324, ['deferred'], [{ body }])], openActions: openMd(block(109, 4324, '2026-10-01')), now: NOW });
    expect(due).toEqual([{ ha: 109, issue: 4324, commented: true, labeled: true }]);
  });
});

describe('applyAutoDefers', () => {
  const files = () => ({ 'HUMAN-ACTIONS.md': openMd(block(109, 4324, '2026-10-06'), block(110, 4720, '2026-10-06')), 'HUMAN-ACTIONS-DONE.md': DONE });

  it('defers the issue, comments once, closes the HA as skip, opens an auto-merged PR', async () => {
    const h = harness(files());
    const out = await applyAutoDefers('o/r', [{ ha: 109, issue: 4324, commented: false, labeled: false }], { ...h, now: NOW });
    expect(out.status).toBe('auto-deferred');
    const comment = h.calls.find((c) => c[1] === 'issue' && c[2] === 'comment')!;
    expect(comment[comment.indexOf('--body') + 1]).toContain(actionMarker({ ha: 109, issue: 4324, action: 'defer', messageId: 'auto-7d' }));
    expect(h.calls).toContainEqual(['gh', 'issue', 'edit', '4324', '--repo', 'o/r', '--add-label', 'deferred']);
    expect(h.files['HUMAN-ACTIONS.md']).not.toContain('## #109');
    expect(h.files['HUMAN-ACTIONS.md']).toContain('## #110');
    expect(h.files['HUMAN-ACTIONS-DONE.md']).toMatch(/- #109 · .* · skip · .*auto-deferred after 7 days of silence/);
    expect(h.files['HUMAN-ACTIONS-DONE.md']).toContain('marjorie-chase: 96h issue=4324');
    expect(AUTO_DEFER_NOTE).toContain('founder decision 2026-10-06');
    expect(h.calls.some((c) => c[1] === 'pr' && c[2] === 'merge' && c.includes('--auto'))).toBe(true);
  });

  it('a re-run with the auto marker adds no second comment or label, and a pending PR is not duplicated', async () => {
    const h = harness(files());
    const out = await applyAutoDefers('o/r', [{ ha: 109, issue: 4324, commented: true, labeled: true }],
      { ...h, now: NOW, pendingHaPrs: [{ headRef: 'marjorie/chase-auto-defer-ha-109' }] });
    expect(out.status).toBe('close-pending');
    expect(h.calls).toEqual([]);
  });

  it('does nothing without candidates', async () => {
    const h = harness(files());
    expect((await applyAutoDefers('o/r', [], { ...h, now: NOW })).status).toBe('none');
    expect(h.calls).toEqual([]);
  });
});

describe('applyDispatchChase wiring', () => {
  it('runs the auto-defer on a due chase HA', async () => {
    const h = harness({ 'HUMAN-ACTIONS.md': openMd(block(109, 4324, '2026-10-06')), 'HUMAN-ACTIONS-DONE.md': DONE });
    const state = { issues: [{ ...issue(4324), createdAt: '2026-09-14T00:00:00Z', updatedAt: '2026-10-12T00:00:00Z', title: 't' }], prs: [], openActions: h.files['HUMAN-ACTIONS.md'], doneActions: DONE, pendingHaPrs: [], now: NOW };
    await applyDispatchChase('o/r', { exec: h.exec, fetchState: async () => state, readFileImpl: h.readFileImpl, writeFileImpl: h.writeFileImpl });
    expect(h.calls.filter((c) => c[1] === 'issue' && c[2] === 'comment')).toHaveLength(1);
    expect(h.files['HUMAN-ACTIONS.md']).not.toContain('## #109');
  });
});
