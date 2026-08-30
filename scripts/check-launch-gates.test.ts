import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DOC_FILE,
  MISMATCH_MARK,
  checkGates,
  citedSources,
  classifyCron,
  claimedCadence,
  cronOf,
  extractBlock,
  issueRefs,
  parseTable,
} from './check-launch-gates.mjs';
import { ROOT } from './lib/generated-content.mjs';

const read = (rel: string) => readFileSync(join(ROOT, ...rel.split('/')), 'utf8');

// ── a minimal, self-consistent scoreboard the unit tests mutate ───────────
const doc = (opts: {
  status?: string;
  blockedOn?: string;
  left?: string;
  next?: string;
  registered?: string;
  source?: string;
  claimed?: string;
  cadenceRow?: boolean;
}) => {
  const {
    status = '🔴',
    blockedOn = 'founder',
    left = 'the scan must run nightly and does not',
    next = '—',
    registered = '`0 9 * * 0` ' + MISMATCH_MARK + ' weekly',
    source = '`runners.md`',
    claimed = 'nightly',
    cadenceRow = true,
  } = opts;
  return [
    '<!-- gates:meaning:start -->',
    '| Gate | was | Plain meaning |',
    '|---|---|---|',
    '| SCAN | G-E | **The safety scan runs** |',
    '<!-- gates:meaning:end -->',
    '<!-- gates:scoreboard:start -->',
    '| Gate | Status | Blocked on | What is actually left | Next-action issues |',
    '|---|---|---|---|---|',
    `| SCAN | ${status} | ${blockedOn} | ${left} | ${next} |`,
    '<!-- gates:scoreboard:end -->',
    '<!-- gates:cadence:start -->',
    '| Gate | Cadence | Runner | Registered | Where |',
    '|---|---|---|---|---|',
    ...(cadenceRow ? [`| SCAN | ${claimed} | Karen | ${registered} | ${source} |`] : []),
    '<!-- gates:cadence:end -->',
  ].join('\n');
};

const run = (docText: string, extra: Record<string, unknown> = {}) =>
  checkGates({
    docText,
    sources: { 'runners.md': 'schedule: 0 9 * * 0\n' },
    ...extra,
  } as Parameters<typeof checkGates>[0]);

describe('parsing helpers', () => {
  it('extracts a marked block and ignores a missing one', () => {
    expect(extractBlock('a<!-- x:start -->B<!-- x:end -->c', 'x')).toBe('B');
    expect(extractBlock('nothing here', 'x')).toBeNull();
  });

  it('parses a pipe table and drops the separator row', () => {
    const { header, rows } = parseTable('| A | B |\n|---|:--|\n| 1 | 2 |\n');
    expect(header).toEqual(['A', 'B']);
    expect(rows).toEqual([['1', '2']]);
  });

  it('reads a cron only when it is backtick-quoted and 5 fields', () => {
    expect(cronOf('`0 9 * * 0` ⚠️ weekly')).toBe('0 9 * * 0');
    expect(cronOf('weekly')).toBeNull();
    expect(cronOf('`not a cron`')).toBeNull();
  });

  it('classifies crons by how often they actually fire', () => {
    expect(classifyCron('5 * * * *')).toBe('hourly');
    expect(classifyCron('*/30 * * * *')).toBe('hourly');
    expect(classifyCron('5 13 * * *')).toBe('daily');
    expect(classifyCron('0 17,23 * * *')).toBe('daily');
    expect(classifyCron('0 9 * * 0')).toBe('weekly');
    expect(classifyCron('0 9 1 * *')).toBe('monthly');
    // Day-of-month AND day-of-week both narrowed is cron's OR-semantics trap.
    expect(classifyCron('0 9 1 * 0')).toBeNull();
    expect(classifyCron('nope')).toBeNull();
  });

  it('reads the highest-frequency cadence word a criterion claims', () => {
    expect(claimedCadence('runs every night')).toBe('nightly');
    expect(claimedCadence('a weekly scan')).toBe('weekly');
    expect(claimedCadence('hourly runs, nightly reports')).toBe('hourly');
    expect(claimedCadence('no cadence here')).toBeNull();
  });

  it('collects deduped issue refs', () => {
    expect(issueRefs('#800, #800 and #1889')).toEqual([800, 1889]);
    expect(issueRefs('—')).toEqual([]);
  });
});

describe('the cadence rule — the 2026-07-25 throttle must not stay silent', () => {
  it('accepts an acknowledged mismatch on a non-green gate', () => {
    expect(run(doc({})).errors).toEqual([]);
  });

  it('fails when the cadence shortfall is NOT acknowledged', () => {
    const { errors } = run(doc({ registered: '`0 9 * * 0`' }));
    expect(errors.join('\n')).toMatch(/unsatisfiable as written/);
  });

  it('refuses to let a gate be green on a cadence nothing provides', () => {
    const { errors } = run(doc({ status: '🟢', blockedOn: 'nobody' }));
    expect(errors.join('\n')).toMatch(/cannot be green on a cadence/);
  });

  it('fails when the cited cron is not in the cited file', () => {
    const { errors } = checkGates({
      docText: doc({}),
      sources: { 'runners.md': 'schedule: 0 9 * * *\n' },
    });
    expect(errors.join('\n')).toMatch(/is not in runners\.md/);
  });

  it('fails when the cadence source does not exist', () => {
    const { errors } = checkGates({ docText: doc({}), sources: { 'runners.md': null } });
    expect(errors.join('\n')).toMatch(/does not exist/);
  });

  it('fails when a criterion claims a cadence but no runner is named', () => {
    const { errors } = run(doc({ cadenceRow: false }));
    expect(errors.join('\n')).toMatch(/does not name the runner/);
  });

  it('fails when the table declares a different cadence than the criterion reads', () => {
    const { errors } = run(doc({ claimed: 'weekly' }));
    expect(errors.join('\n')).toMatch(/the two must agree/);
  });

  it('warns when a satisfied cadence still carries the mismatch mark', () => {
    const { errors, warnings } = checkGates({
      docText: doc({
        left: 'the scan must run nightly',
        claimed: 'nightly',
        registered: '`5 13 * * *` ' + MISMATCH_MARK,
        source: '`wf.yml`',
      }),
      sources: { 'wf.yml': "cron: '5 13 * * *'" },
    });
    expect(errors).toEqual([]);
    expect(warnings.join('\n')).toMatch(/drop the mark/);
  });
});

describe('the dead-ticket rule', () => {
  it('fails on a closed next-action issue', () => {
    const { errors } = run(doc({ next: '#669' }), { issueStates: { 669: 'CLOSED' } });
    expect(errors.join('\n')).toMatch(/#669 is CLOSED/);
  });

  it('passes on an open one, and is skipped entirely without issue states', () => {
    expect(run(doc({ next: '#800' }), { issueStates: { 800: 'OPEN' } }).errors).toEqual([]);
    expect(run(doc({ next: '#669' })).errors).toEqual([]);
  });
});

describe('scoreboard hygiene', () => {
  it('rejects an unknown blocked-on value', () => {
    expect(run(doc({ blockedOn: 'Integrity desk' })).errors.join('\n')).toMatch(/is not one of/);
  });

  it('rejects a green gate that claims to be blocked on someone', () => {
    const { errors } = checkGates({
      docText: doc({
        status: '🟢',
        blockedOn: 'founder',
        left: 'nothing',
        cadenceRow: false,
      }),
      sources: {},
    });
    expect(errors.join('\n')).toMatch(/cannot be blocked on founder/);
  });

  it('rejects a gate scored without a plain-English meaning', () => {
    const bad = doc({}).replace('| SCAN | G-E | **The safety scan runs** |', '');
    expect(run(bad).errors.join('\n')).toMatch(/no plain-English meaning/);
  });

  it('fails loudly when a marked block is missing', () => {
    const { errors } = run(doc({}).replace('<!-- gates:cadence:start -->', ''));
    expect(errors.join('\n')).toMatch(/missing the <!-- gates:cadence/);
  });
});

describe('the real docs/launch-readiness.md', () => {
  const docText = read(DOC_FILE);

  it('anchors SCAN nightly protection to the deterministic GitHub Action', () => {
    expect(read('.github/workflows/cie-scan.yml')).toContain('cron: "9 9 * * *"');
    expect(extractBlock(docText, 'gates:cadence')).toContain('`.github/workflows/cie-scan.yml`');
  });

  it('keeps the weekly Karen routine in the judgment lane', () => {
    const prompt = read('docs/agents/runner-prompts/karen-nightly.md');
    expect(prompt).toContain('run.mjs review-slice');
    expect(prompt).toContain('run.mjs issues --create');
    expect(prompt).not.toContain('run.mjs all --create');
    const meanings = extractBlock(docText, 'gates:meaning');
    expect(meanings).toContain('bounded rotating judgment slice');
    expect(meanings).not.toContain('full review runs weekly');
  });

  it('passes the offline rules as committed', () => {
    const sources: Record<string, string | null> = {};
    for (const p of citedSources(docText)) sources[p] = read(p);
    const { errors } = checkGates({ docText, sources });
    expect(errors).toEqual([]);
  });

  it('scores exactly 12 gates and every non-green one names who it waits on', () => {
    const sources: Record<string, string | null> = {};
    for (const p of citedSources(docText)) sources[p] = read(p);
    const { gates } = checkGates({ docText, sources });
    expect(gates).toHaveLength(12);
    expect(gates.filter((g) => g.status !== '🟢').every((g) => g.blockedOn)).toBe(true);
  });

  it('still cites cadence sources that exist in the repo', () => {
    for (const p of citedSources(docText)) expect(() => read(p)).not.toThrow();
  });
});
