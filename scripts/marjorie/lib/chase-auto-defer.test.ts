import { describe, expect, it } from 'vitest';
import { applyAutoDefers, planAutoDefers, AUTO_DEFER_NOTE } from './chase-auto-defer.mjs';
import { runAutoDefer } from './chase-auto-defer-run.mjs';
import { actionMarker } from './chase-action.mjs';

const NOW = Date.parse('2026-10-13T12:00:00Z');

const block = (ha: number, issue: number, filed: string) =>
  `## #${ha} 🟡 [DECIDE] #${issue} has had no activity for 4 days (~2 min)\n<!-- ha filed=${filed} -->\n<!-- marjorie-chase: 96h issue=${issue} -->\n\n**Why:** x.\n\n**Steps:**\n1. Reply.\n\n**Worked if:** y.\n`;
const openMd = (...blocks: string[]) => `# Human actions\n\n> **${blocks.length} open.**\n\n${blocks.join('\n')}`;
const DONE = '# Done\n\n- #1 · 2026-01-01 · done · old — "x" · by chat\n';
const BOT = { login: 'claude[bot]', type: 'Bot' };
const OWNER = { login: 'sffan15-sys', type: 'User' };
const issue = (number: number, labels: string[] = [], comments: { body: string; author?: { login: string; type: string } }[] = []) => ({ number, labels: labels.map((name) => ({ name })), comments });

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
    const reply = { body: `Founder assigned.\n\n${actionMarker({ ha: 109, issue: 4324, action: 'assign', messageId: '123456789012345678' })}`, author: BOT };
    expect(planAutoDefers({ issues: [issue(4324, [], [reply])], openActions: open, now: NOW })).toEqual([]);
    expect(planAutoDefers({ issues: [issue(4324, ['deferred'])], openActions: open, now: NOW })).toEqual([]);
    expect(planAutoDefers({ issues: [issue(4324, ['founder-assigned'])], openActions: open, now: NOW })).toEqual([]);
  });
  it('resumes only the HA close once the auto marker exists', () => {
    const body = `x\n\n${actionMarker({ ha: 109, issue: 4324, action: 'defer', messageId: 'auto-7d' })}`;
    const due = planAutoDefers({ issues: [issue(4324, ['deferred'], [{ body, author: OWNER }])], openActions: openMd(block(109, 4324, '2026-10-01')), now: NOW, author: 'sffan15-sys' });
    expect(due).toEqual([{ ha: 109, issue: 4324, commented: true, labeled: true }]);
  });
  describe('auto marker trust', () => {
    const open = openMd(block(109, 4324, '2026-10-01'));
    const body = `x\n\n${actionMarker({ ha: 109, issue: 4324, action: 'defer', messageId: 'auto-7d' })}`;
    const foreign = { body, author: { login: 'someone', type: 'User' } };
    it('a foreign auto marker on a founder-decision issue stays untouched', () => {
      expect(planAutoDefers({ issues: [issue(4324, ['founder-decision'], [foreign])], openActions: open, now: NOW, author: 'sffan15-sys' })).toEqual([]);
    });
    it('a foreign auto marker on a normal issue is not trusted', () => {
      expect(planAutoDefers({ issues: [issue(4324, [], [foreign])], openActions: open, now: NOW, author: 'sffan15-sys' }))
        .toEqual([{ ha: 109, issue: 4324, commented: false, labeled: false }]);
    });
    it('a genuine auto marker never overrides an exception label', () => {
      expect(planAutoDefers({ issues: [issue(4324, ['founder-decision'], [{ body, author: OWNER }])], openActions: open, now: NOW, author: 'sffan15-sys' })).toEqual([]);
    });
    it('an undefined author trusts no auto marker', () => {
      expect(planAutoDefers({ issues: [issue(4324, [], [{ body, author: OWNER }])], openActions: open, now: NOW, author: undefined }))
        .toEqual([{ ha: 109, issue: 4324, commented: false, labeled: false }]);
    });
  });
});


describe('planAutoDefers rules', () => {
  const open = openMd(block(109, 4324, '2026-10-06'));
  it('counts 7 days in America/Los_Angeles (no early firing)', () => {
    expect(planAutoDefers({ issues: [issue(4324)], openActions: open, now: Date.parse('2026-10-13T06:59:00Z') })).toEqual([]);
    expect(planAutoDefers({ issues: [issue(4324)], openActions: open, now: Date.parse('2026-10-13T07:00:00Z') })).toHaveLength(1);
  });
  it('skips an HA that already has an open auto-defer PR', () => {
    const pending = [{ headRef: 'marjorie/chase-auto-defer-ha-109-110' }];
    expect(planAutoDefers({ issues: [issue(4324)], openActions: open, pendingHaPrs: pending, now: NOW })).toEqual([]);
    expect(planAutoDefers({ issues: [issue(4324)], openActions: open, pendingHaPrs: [{ headRef: 'marjorie/chase-auto-defer-ha-111' }], now: NOW })).toHaveLength(1);
  });
  it('ignores a marker that was not authored by the bot', () => {
    const body = `x\n\n${actionMarker({ ha: 109, issue: 4324, action: 'assign', messageId: '123456789012345678' })}`;
    const human = { body, author: { login: 'someone', type: 'User' } };
    expect(planAutoDefers({ issues: [issue(4324, [], [human])], openActions: open, now: NOW })).toHaveLength(1);
  });
});

describe('applyAutoDefers', () => {
  const files = () => ({ 'HUMAN-ACTIONS.md': openMd(block(109, 4324, '2026-10-06'), block(110, 4720, '2026-10-06')), 'HUMAN-ACTIONS-DONE.md': DONE });
  const cand = (ha: number, number: number) => ({ ha, issue: number, commented: false, labeled: false });
  const clean = async (number: number) => issue(number);

  it('defers the issue, comments once, closes the HA as skip, opens an auto-merged PR', async () => {
    const h = harness(files());
    const out = await applyAutoDefers('o/r', [cand(109, 4324)], { ...h, now: NOW, fetchIssue: clean });
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

  it('a resumed item (marker + label present) adds no second comment or label', async () => {
    const h = harness(files());
    const body = `x\n\n${actionMarker({ ha: 109, issue: 4324, action: 'defer', messageId: 'auto-7d' })}`;
    await applyAutoDefers('o/r', [{ ha: 109, issue: 4324, commented: true, labeled: true }], { ...h, now: NOW, author: 'sffan15-sys', fetchIssue: async () => issue(4324, ['deferred'], [{ body, author: OWNER }]) });
    expect(h.calls.some((c) => c[1] === 'issue')).toBe(false);
  });

  it('one failing item only warns; the rest still land', async () => {
    const h = harness(files());
    const exec = async (cmd: string, args: string[]) => {
      if (args[0] === 'issue' && args[1] === 'comment' && args[2] === '4324') throw new Error('boom');
      return h.exec(cmd, args);
    };
    const out = await applyAutoDefers('o/r', [cand(109, 4324), cand(110, 4720)], { ...h, exec, now: NOW, fetchIssue: clean });
    expect(out).toMatchObject({ status: 'auto-deferred', ha: [110] });
    expect(h.files['HUMAN-ACTIONS.md']).toContain('## #109');
    expect(h.files['HUMAN-ACTIONS.md']).not.toContain('## #110');
  });

  it('skips when a reply or exception label appeared after planning (race)', async () => {
    const h = harness(files());
    const out = await applyAutoDefers('o/r', [cand(109, 4324), cand(110, 4720)], { ...h, now: NOW, fetchIssue: async (n: number) => (n === 4324 ? issue(n, ['founder-decision']) : issue(n)) });
    expect(out).toMatchObject({ ha: [110] });
    expect(h.calls.filter((c) => c[1] === 'issue' && c[2] === 'comment')).toHaveLength(1);
    const reply = `x\n\n${actionMarker({ ha: 109, issue: 4324, action: 'defer', messageId: '123456789012345678' })}`;
    const h2 = harness(files());
    const out2 = await applyAutoDefers('o/r', [cand(109, 4324)], { ...h2, now: NOW, fetchIssue: async () => issue(4324, [], [{ body: reply, author: BOT }]) });
    expect(out2.status).toBe('none');
    expect(h2.calls).toEqual([]);
  });

  it('does nothing without candidates', async () => {
    const h = harness(files());
    expect((await applyAutoDefers('o/r', [], { ...h, now: NOW })).status).toBe('none');
    expect(h.calls).toEqual([]);
  });
});

describe('runAutoDefer entrypoint', () => {
  it('applies a due auto-defer with no agent session', async () => {
    const h = harness({ 'HUMAN-ACTIONS.md': openMd(block(109, 4324, '2026-10-06')), 'HUMAN-ACTIONS-DONE.md': DONE });
    const state = { issues: [issue(4324)], openActions: h.files['HUMAN-ACTIONS.md'], doneActions: DONE, pendingHaPrs: [], now: NOW };
    const out = await runAutoDefer('o/r', { exec: h.exec, fetchState: async () => state, readFileImpl: h.readFileImpl, writeFileImpl: h.writeFileImpl, fetchIssue: async (n: number) => issue(n) });
    expect(out.status).toBe('auto-deferred');
    expect(h.calls.filter((c) => c[1] === 'issue' && c[2] === 'comment')).toHaveLength(1);
    expect(h.files['HUMAN-ACTIONS.md']).not.toContain('## #109');
  });
});
