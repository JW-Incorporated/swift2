import { describe, expect, it } from 'vitest';
import { evaluateDispatchChase, MAX_HUMAN_ACTIONS, MAX_NUDGES } from './dispatch-chase.mjs';

const NOW = Date.parse('2026-09-15T12:00:00Z');
const ago = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString();
const actionFiles = (open = '', done = '') => ({ openActions: open, doneActions: done });

function issue(number: number, hours = 1, extra: Record<string, unknown> = {}) {
  return {
    number,
    title: `Issue ${number}`,
    createdAt: ago(hours + 1),
    updatedAt: ago(hours),
    comments: [],
    labels: [],
    ...extra,
  };
}
function pr(number: number, body: string, hours = 1, extra: Record<string, unknown> = {}) {
  return {
    number,
    body,
    createdAt: ago(hours + 1),
    updatedAt: ago(hours),
    comments: [],
    labels: [],
    ...extra,
  };
}
function plan(input: Record<string, unknown>) {
  return evaluateDispatchChase({ now: NOW, ...input });
}

describe('evaluateDispatchChase', () => {
  it('returns fresh for activity inside 48 hours', () => {
    expect(plan({ issues: [issue(1, 47)] }).items[0].verdict).toBe('fresh');
  });

  it('nudges stale-48 once with its fixed blocker text', () => {
    const result = plan({ issues: [issue(2, 49)] });
    expect(result.items[0].verdict).toBe('stale-48');
    expect(result.nudges).toEqual([
      {
        issue: 2,
        targets: [{ type: 'issue', number: 2 }],
        body: expect.stringContaining(
          'Holder: unclaimed. Next: a founder comment "Plan approved".',
        ),
      },
    ]);
  });

  it('creates a stale-96 decision action with the M8 marker and literal choices', () => {
    const result = plan({
      issues: [issue(3, 97)],
      ...actionFiles('## #80 ðŸŸ¡ [DECIDE] Something\n<!-- ha filed=2026-09-01 -->'),
    });
    expect(result.items[0].verdict).toBe('stale-96');
    expect(result.humanActions[0]).toMatchObject({ number: 81, issue: 3 });
    expect(result.humanActions[0].body).toContain('\u{1F7E1}');
    expect(result.humanActions[0].body).toContain('<!-- marjorie-chase: 96h issue=3 -->');
    expect(result.humanActions[0].body).toContain('`assign`');
    expect(result.humanActions[0].body).toContain('`defer`');
    expect(result.humanActions[0].body).toContain('`close`');
  });

  it('holds a skipped or deferred chase item forever', () => {
    const skipped =
      '- #81 Â· 2026-09-15 Â· skip Â· [DECIDE] #4 has had no activity for 4 days Â· by owner';
    expect(plan({ issues: [issue(4, 200)], ...actionFiles('', skipped) }).items[0].verdict).toBe(
      'held',
    );
    const archivedMarker = '- #82 closed old item\n<!-- marjorie-chase: 96h issue=40 -->';
    expect(
      plan({ issues: [issue(40, 200)], ...actionFiles('', archivedMarker) }).items[0].verdict,
    ).toBe('held');
    expect(plan({ issues: [issue(5, 200, { labels: ['deferred'] })] }).items[0].verdict).toBe(
      'held',
    );
  });

  it('resets archived status at each open human-action heading', () => {
    const open = [
      '## #81 [DECIDE] old item',
      '- #81 closed',
      '## #82 [DECIDE] #41 has had no activity for 4 days',
      '<!-- marjorie-chase: 96h issue=41 -->',
    ].join('\n');
    const result = plan({ issues: [issue(41, 100)], ...actionFiles(open) });
    expect(result.items[0].existingHumanAction).toBe(82);
    expect(result.items[0].verdict).toBe('stale-96');
    expect(result.humanActions).toEqual([]);
  });

  it('blocks an item awaiting a founder answer or human PR review', () => {
    const question = issue(6, 100, {
      comments: [
        {
          author: { type: 'User', login: 'dev' },
          createdAt: ago(100),
          body: 'Joey, should we ship this?',
        },
      ],
    });
    const review = pr(88, 'Closes #7', 100, { labels: ['needs-human-review'] });
    expect(
      plan({ issues: [question, issue(7, 100)], prs: [review] }).items.map((item) => item.verdict),
    ).toEqual(['blocked-on-founder', 'blocked-on-founder']);
  });

  it('does not hold ordinary questions or non-question founder mentions', () => {
    const ordinaryQuestion = issue(61, 100, {
      comments: [
        {
          author: { type: 'User', login: 'dev' },
          createdAt: ago(100),
          body: 'Can @builder reproduce?',
        },
      ],
    });
    const mention = issue(62, 100, {
      comments: [
        {
          author: { type: 'User', login: 'dev' },
          createdAt: ago(100),
          body: 'Fixed founder-facing bug.',
        },
      ],
    });
    expect(plan({ issues: [ordinaryQuestion, mention] }).items.map((item) => item.verdict)).toEqual(
      ['stale-96', 'stale-96'],
    );
  });

  it('does not treat Marjorie’s comment or its matching updatedAt as activity', () => {
    const own = {
      viewerDidAuthor: true,
      createdAt: ago(1),
      body: 'No activity for 2 days.\n<!-- marjorie-chase: 48h -->',
    };
    const result = plan({
      issues: [issue(8, 1, { createdAt: ago(60), updatedAt: ago(1), comments: [own] })],
    });
    expect(result.items[0].verdict).toBe('stale-48');
  });

  it('counts an outside comment as activity even when the issue timestamp is older', () => {
    const outside = { author: { type: 'Bot', login: 'kevin' }, createdAt: ago(1), body: 'triaged' };
    expect(plan({ issues: [issue(9, 60, { comments: [outside] })] }).items[0].verdict).toBe(
      'fresh',
    );
  });

  it('counts an outside comment edit but ignores an edit to Marjorie’s own comment', () => {
    const editedByOther = {
      author: { type: 'User', login: 'dev' },
      createdAt: ago(60),
      updatedAt: ago(1),
      body: 'updated',
    };
    expect(plan({ issues: [issue(91, 60, { comments: [editedByOther] })] }).items[0].verdict).toBe(
      'fresh',
    );
    const editedByMarjorie = {
      viewerDidAuthor: true,
      createdAt: ago(60),
      updatedAt: ago(1),
      body: '<!-- marjorie-chase: 48h -->',
    };
    expect(
      plan({ issues: [issue(92, 60, { comments: [editedByMarjorie] })] }).items[0].verdict,
    ).toBe('stale-48');
  });

  it('links Closes/Fixes PRs, includes their activity, and nudges both targets', () => {
    const linked = pr(90, 'Fixes #10', 49, { labels: ['austin-built'] });
    const result = plan({ issues: [issue(10, 60)], prs: [linked] });
    expect(result.items[0].holder).toBe('Austin PR #90 awaiting review');
    expect(result.nudges[0].targets).toEqual([
      { type: 'issue', number: 10 },
      { type: 'pr', number: 90 },
    ]);
    expect(result.nudges[0].body).toContain('Next: merge/review #90.');
    expect(plan({ issues: [issue(10, 60)], prs: [pr(90, 'Closes #10', 1)] }).items[0].verdict).toBe(
      'fresh',
    );
  });

  it('uses the marker to avoid duplicate nudges and duplicate decision actions', () => {
    const marker = {
      viewerDidAuthor: true,
      createdAt: ago(49),
      body: '<!-- marjorie-chase: 48h -->',
    };
    expect(plan({ issues: [issue(11, 60, { comments: [marker] })] }).nudges).toEqual([]);
    const open =
      '## #82 ðŸŸ¡ [DECIDE] #12 has had no activity for 4 days (~2 min)\n<!-- marjorie-chase: 96h issue=12 -->';
    const result = plan({ issues: [issue(12, 100)], ...actionFiles(open) });
    expect(result.items[0].existingHumanAction).toBe(82);
    expect(result.humanActions).toEqual([]);
  });

  it('caps the human-action Why and step lines and uses linked PR activity', () => {
    const linked = pr(99, 'Closes #93', 97, { lastCommitDate: ago(97) });
    const result = plan({
      issues: [issue(93, 200, { title: 'x'.repeat(500), assignee: { login: 'x'.repeat(500) } })],
      prs: [linked],
    });
    const lines = result.humanActions[0].body.split('\n');
    const why = lines.find((line) => line.startsWith('**Why:** '))!.slice('**Why:** '.length);
    const step = lines.find((line) => line.startsWith('1. Reply'))!;
    expect(why.length).toBeLessThanOrEqual(300);
    expect(step.length).toBeLessThanOrEqual(200);
    expect(why).toContain(new Date(NOW - 97 * 3_600_000).toISOString().slice(0, 10));
  });

  it('takes the oldest work first and enforces the 5/2 sweep budget', () => {
    const issues = [
      ...Array.from({ length: 7 }, (_, i) => issue(i + 20, 49 + i)),
      ...Array.from({ length: 4 }, (_, i) => issue(i + 30, 97 + i)),
    ];
    const result = plan({ issues });
    expect(result.nudges).toHaveLength(MAX_NUDGES);
    expect(result.humanActions).toHaveLength(MAX_HUMAN_ACTIONS);
    expect(result.nudges.map((nudge) => nudge.issue)).toEqual([26, 25, 24, 23, 22]);
    expect(result.humanActions.map((action) => action.issue)).toEqual([33, 32]);
  });
});
