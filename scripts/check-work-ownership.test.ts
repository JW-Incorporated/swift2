import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LABELS } from './marjorie/bootstrap-labels.mjs';
import {
  BUDGET_FILE,
  DESK_PREFIX,
  EXEMPT,
  HUMAN_DESKS,
  ROOT,
  UNOWNED_LABEL,
  deskLabels,
  evaluate,
  isExempt,
  loadBudget,
  renderAlert,
} from './check-work-ownership.mjs';

const NOW = new Date('2026-08-11T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

const WINDOWS = { routeWithinHours: 24, abandonedDays: 10, stalePrDays: 7 };
const ZERO = { unrouted: 0, ambiguous: 0, unowned: 0, abandoned: 0, stalePr: 0 };

const issue = (over: Record<string, unknown> = {}) => ({
  number: 1,
  title: 'a thing',
  createdAt: daysAgo(30),
  updatedAt: daysAgo(30),
  labels: [],
  ...over,
});
const pr = (over: Record<string, unknown> = {}) => ({
  number: 100,
  title: 'a PR',
  createdAt: daysAgo(30),
  isDraft: false,
  author: { login: 'wjduvall-cmd' },
  labels: [],
  ...over,
});
const L = (...names: string[]) => names.map((name) => ({ name }));

const run = (snapshot: any, budget = ZERO) =>
  evaluate({ issues: [], prs: [], ...snapshot }, budget as any, NOW, WINDOWS);

describe('deskLabels / isExempt', () => {
  it('picks out only desk:* labels, deduped and sorted', () => {
    expect(deskLabels(issue({ labels: L('a11y', 'desk:content', 'desk:build', 'desk:content') })))
      .toEqual(['desk:build', 'desk:content']);
  });

  it('treats an item with no labels as having no desk', () => {
    expect(deskLabels(issue())).toEqual([]);
    expect(deskLabels({} as any)).toEqual([]);
  });

  it('exempts ledgers, digests and persistent alerts', () => {
    for (const label of Object.keys(EXEMPT)) {
      expect(isExempt(issue({ labels: L(label) }))).toBe(true);
    }
    expect(isExempt(issue({ labels: L('bug') }))).toBe(false);
  });

  it('every exemption carries a real reason (the set must stay arguable)', () => {
    for (const [label, reason] of Object.entries(EXEMPT)) {
      expect(reason.length, label).toBeGreaterThan(20);
    }
  });
});

describe('evaluate — routing state', () => {
  it('an unlabelled issue past the grace window is unrouted', () => {
    const { findings } = run({ issues: [issue()] });
    expect(findings.unrouted).toHaveLength(1);
    expect(findings.unrouted[0]).toMatchObject({ number: 1, ageDays: 30 });
  });

  it('does NOT alarm on an issue younger than the grace window', () => {
    const fresh = issue({ createdAt: new Date(NOW.getTime() - 3 * 3_600_000).toISOString() });
    expect(run({ issues: [fresh] }).findings.unrouted).toHaveLength(0);
  });

  it('exactly one desk:* label means routed', () => {
    const { findings } = run({ issues: [issue({ labels: L('desk:build'), updatedAt: daysAgo(1) })] });
    expect(findings.unrouted).toHaveLength(0);
    expect(findings.abandoned).toHaveLength(0);
  });

  it('two desk:* labels is ambiguous, and is NOT also counted as abandoned', () => {
    const { findings } = run({ issues: [issue({ labels: L('desk:build', 'desk:content') })] });
    expect(findings.ambiguous).toEqual([
      { number: 1, title: 'a thing', desks: ['desk:build', 'desk:content'] },
    ]);
    expect(findings.abandoned).toHaveLength(0);
  });

  it('desk:unowned is the fence complement, counted separately from unrouted', () => {
    const { findings } = run({ issues: [issue({ labels: L(UNOWNED_LABEL) })] });
    expect(findings.unowned).toHaveLength(1);
    expect(findings.unrouted).toHaveLength(0);
    expect(findings.abandoned).toHaveLength(0);
  });

  it('desk:founder is never abandoned — a human owes it, on their own clock', () => {
    const { findings } = run({ issues: [issue({ labels: L('desk:founder') })] });
    expect(findings.abandoned).toHaveLength(0);
    expect(findings.unowned).toHaveLength(0);
  });

  it('a real desk label with no movement past the window is abandoned', () => {
    // The launch-gate failure: routed to a desk that structurally cannot do it
    // looks exactly like routing that worked, until you measure movement.
    const { findings } = run({
      issues: [issue({ labels: L('desk:build'), updatedAt: daysAgo(21) })],
    });
    expect(findings.abandoned).toEqual([
      { number: 1, title: 'a thing', desk: 'desk:build', idleDays: 21 },
    ]);
  });

  it('a routed issue touched inside the window is fine', () => {
    const { findings } = run({ issues: [issue({ labels: L('desk:build'), updatedAt: daysAgo(2) })] });
    expect(findings.abandoned).toHaveLength(0);
  });

  it('ledger and digest issues are ignored entirely', () => {
    const { findings } = run({
      issues: [issue({ labels: L('watchdog-alert') }), issue({ number: 2, labels: L('kevin-triage') })],
    });
    expect(findings.unrouted).toHaveLength(0);
  });
});

describe('evaluate — stale PRs (the Phase 3.5 blind spot)', () => {
  it('flags an open non-draft PR past the window', () => {
    const { findings } = run({ prs: [pr({ createdAt: daysAgo(15) })] });
    expect(findings.stalePr).toEqual([
      { number: 100, title: 'a PR', ageDays: 15, author: 'wjduvall-cmd' },
    ]);
  });

  it('ignores drafts — a draft is not waiting on anyone', () => {
    expect(run({ prs: [pr({ isDraft: true })] }).findings.stalePr).toHaveLength(0);
  });

  it('ignores a PR inside the window', () => {
    expect(run({ prs: [pr({ createdAt: daysAgo(2) })] }).findings.stalePr).toHaveLength(0);
  });
});

describe('evaluate — ordering and budgets', () => {
  it('reports oldest first, because the backlog is the point', () => {
    const { findings } = run({
      issues: [issue({ number: 1, createdAt: daysAgo(3) }), issue({ number: 2, createdAt: daysAgo(40) })],
    });
    expect(findings.unrouted.map((f: any) => f.number)).toEqual([2, 1]);
  });

  it('is ok when every count is at or under budget', () => {
    const res = run({ prs: [pr(), pr({ number: 101 })] }, { ...ZERO, stalePr: 2 });
    expect(res.ok).toBe(true);
    expect(res.breaches).toEqual([]);
  });

  it('breaches when a count exceeds budget, reporting how far over', () => {
    const res = run({ prs: [pr(), pr({ number: 101 }), pr({ number: 102 })] }, { ...ZERO, stalePr: 1 });
    expect(res.ok).toBe(false);
    expect(res.breaches).toEqual([{ key: 'stalePr', count: 3, budget: 1, over: 2 }]);
  });

  it('a MISSING budget entry breaches loudly rather than defaulting to permissive', () => {
    const partial = { unrouted: 0, ambiguous: 0, unowned: 0, abandoned: 0 };
    const res = run({ prs: [pr()] }, partial as any);
    expect(res.ok).toBe(false);
    expect(res.breaches[0]).toMatchObject({ key: 'stalePr', budget: null });
    expect(res.breaches[0].reason).toMatch(/no budget entry/);
  });

  it('a not-enforced condition is still measured but never breaches', () => {
    const budget = { ...ZERO, $notEnforced: { unrouted: 'taxonomy not adopted yet' } };
    const res = run({ issues: [issue(), issue({ number: 2 })] }, budget as any);
    expect(res.findings.unrouted).toHaveLength(2);
    expect(res.ok).toBe(true);
    expect(res.notEnforced).toEqual({ unrouted: 'taxonomy not adopted yet' });
  });
});

describe('renderAlert', () => {
  it('names each breached condition, its budget, and the oldest offenders', () => {
    const res = run({ prs: [pr({ createdAt: daysAgo(15) }), pr({ number: 101, createdAt: daysAgo(9) })] });
    const body = renderAlert(res, ZERO, WINDOWS);
    expect(body).toContain('@sffan15-sys @wjduvall-cmd');
    expect(body).toContain('stalePr — 2 (budget 0, over by 2)');
    expect(body).toContain('#100 — 15d old');
    expect(body).toContain(BUDGET_FILE);
  });

  it('truncates long lists rather than emailing hundreds of lines', () => {
    const prs = Array.from({ length: 40 }, (_, i) => pr({ number: 200 + i }));
    const body = renderAlert(run({ prs }), ZERO, WINDOWS, 15);
    expect(body).toContain('…and 25 more');
  });

  it('reports suspended conditions without treating them as failures', () => {
    const budget = { ...ZERO, $notEnforced: { unrouted: 'taxonomy not adopted yet' } };
    const res = run({ issues: [issue()], prs: [pr()] }, budget as any);
    const body = renderAlert(res, budget as any, WINDOWS);
    expect(body).toContain('Measured, not enforced');
    expect(body).toContain('`unrouted`: **1**');
  });
});

describe('loadBudget', () => {
  const base = {
    budget: { ...ZERO, stalePr: 9 },
    windows: WINDOWS,
  };

  it('accepts a well-formed budget', () => {
    const { budget, windows } = loadBudget(JSON.stringify(base));
    expect(budget.stalePr).toBe(9);
    expect(windows).toEqual(WINDOWS);
  });

  it('rejects a missing or non-integer budget entry', () => {
    expect(() => loadBudget(JSON.stringify({ ...base, budget: { ...ZERO, stalePr: -1 } })))
      .toThrow(/non-negative integer/);
    const missing = { unrouted: 0, ambiguous: 0, unowned: 0, abandoned: 0 };
    expect(() => loadBudget(JSON.stringify({ ...base, budget: missing }))).toThrow(/stalePr/);
  });

  it('rejects a bad window', () => {
    expect(() => loadBudget(JSON.stringify({ ...base, windows: { ...WINDOWS, stalePrDays: 0 } })))
      .toThrow(/positive number/);
  });

  it('rejects suspending a condition that does not exist', () => {
    expect(() => loadBudget(JSON.stringify({ ...base, notEnforced: { nonsense: 'a long enough reason' } })))
      .toThrow(/not a condition/);
  });

  it('demands a real reason for suspending a condition', () => {
    expect(() => loadBudget(JSON.stringify({ ...base, notEnforced: { unrouted: 'meh' } })))
      .toThrow(/needs a real reason/);
  });

  it('refuses a budget that suspends every condition', () => {
    const all = Object.fromEntries(
      Object.keys(ZERO).map((k) => [k, 'suspended for a stated and sufficiently long reason']),
    );
    expect(() => loadBudget(JSON.stringify({ ...base, notEnforced: all })))
      .toThrow(/disabled check/);
  });

  it('rejects non-JSON without pretending the budget is zero', () => {
    expect(() => loadBudget('not json')).toThrow(/not valid JSON/);
  });
});

describe('the committed budget file', () => {
  const text = readFileSync(join(ROOT, ...BUDGET_FILE.split('/')), 'utf8');

  it('parses and satisfies its own validator', () => {
    expect(() => loadBudget(text)).not.toThrow();
  });

  it('explains itself — a bare number set would rot into an unexplained ratchet', () => {
    expect(JSON.parse(text).$comment.join(' ')).toMatch(/docs\/proposals\//);
  });

  it('keeps DESK_PREFIX and UNOWNED_LABEL consistent', () => {
    expect(UNOWNED_LABEL.startsWith(DESK_PREFIX)).toBe(true);
  });
});

describe('the taxonomy this check reasons about actually gets created', () => {
  // The failure this guards: someone renames a desk label in the bootstrap
  // script and the checker keeps counting a label nobody applies — which
  // reports "all owned" forever. Silence is the wrong failure direction here.
  const names = LABELS.map(([name]: [string, string, string]) => name);

  it('bootstrap-labels.mjs creates desk:* labels', () => {
    expect(names.filter((n: string) => n.startsWith(DESK_PREFIX)).length).toBeGreaterThan(3);
  });

  it('creates the two labels the checker gives special meaning', () => {
    for (const special of [UNOWNED_LABEL, ...HUMAN_DESKS]) {
      expect(names, special).toContain(special);
    }
  });

  it('creates the split that replaces the ambiguous needs-human-review label', () => {
    expect(names).toContain('review:not-run');
    expect(names).toContain('review:contested');
  });

  it('every exempt label the checker skips is a real label somewhere in the repo', () => {
    // Exemptions are matched by string; a typo would silently exempt nothing.
    const labelsMd = readFileSync(join(ROOT, 'scripts', 'marjorie', 'bootstrap-labels.mjs'), 'utf8');
    const known = new Set([
      ...names,
      // Created by the desks that own them rather than by the bootstrap script.
      'routine-audit', 'kevin-triage', 'kevin-digest', 'kevin-radar', 'curiosity-ledger',
    ]);
    for (const label of Object.keys(EXEMPT)) expect(known, label).toContain(label);
    expect(labelsMd).toContain('desk:unowned');
  });
});
