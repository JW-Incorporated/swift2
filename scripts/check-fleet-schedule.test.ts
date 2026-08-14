import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ENABLED_CEILING,
  FLEET_DAILY_RUNS,
  FORBIDDEN,
  GATES_FILE,
  MAX_RUNS_PER_DAY_PER_ENTRY,
  REGISTRY_FILE,
  SCHEDULE_FILE,
  checkSchedule,
  expandField,
  gateCadences,
  parseEnabled,
  parseMode,
  parseSchedule,
  runsPerDay,
  validateCron,
} from './check-fleet-schedule.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(join(ROOT, ...rel.split('/')), 'utf8');

const AUDITOR = 'trig_018V66TnhXVAt8BLt5AZZuUa';
const OK_ID = 'trig_01KJLFZpKaFV6jDVshMrHG3E';
const OK_ID2 = 'trig_014HWuRmT2MFveDkPGwVDiQX';

/** A minimal well-formed document, so each test perturbs exactly one thing. */
const doc = (rows: string[], mode = 'report-only') =>
  [
    '<!-- fleet:mode:start -->',
    '',
    `\`mode: ${mode}\``,
    '',
    '<!-- fleet:mode:end -->',
    '',
    '<!-- fleet:schedule:start -->',
    '',
    '| Routine | Trigger id | Cron (UTC) | Enabled | Why this cadence |',
    '|---|---|---|---|---|',
    ...rows,
    '',
    '<!-- fleet:schedule:end -->',
  ].join('\n');

const row = ({
  name = 'Marjorie — morning brief',
  id = OK_ID,
  cron = '0 12 * * *',
  enabled = 'yes',
  why = 'The mailer needs the brief posted by 12:40 UTC',
} = {}) => `| ${name} | \`${id}\` | \`${cron}\` | ${enabled} | ${why} |`;

/** Registry text that registers both fixture ids. */
const REGISTRY = `runners: ${OK_ID} and ${OK_ID2} and ${AUDITOR}`;
const NO_GATES = '';

const run = (scheduleText: string, registryText = REGISTRY, gatesText = NO_GATES) =>
  checkSchedule({ scheduleText, registryText, gatesText });

describe('expandField — one cron field to the values it matches', () => {
  it('handles *, literals, ranges, lists and steps', () => {
    expect(expandField('*', { min: 0, max: 6 })).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(expandField('9', { min: 0, max: 23 })).toEqual([9]);
    expect(expandField('17,23', { min: 0, max: 23 })).toEqual([17, 23]);
    expect(expandField('1-3', { min: 0, max: 23 })).toEqual([1, 2, 3]);
    expect(expandField('*/6', { min: 0, max: 23 })).toEqual([0, 6, 12, 18]);
    expect(expandField('*/2', { min: 1, max: 31 })).toHaveLength(16); // odd days
    expect(expandField('5/2', { min: 0, max: 23 })).toEqual([5, 7, 9, 11, 13, 15, 17, 19, 21, 23]);
  });
  it('refuses out-of-range, inverted, and non-numeric shapes rather than guessing', () => {
    expect(expandField('24', { min: 0, max: 23 })).toBeNull();
    expect(expandField('5-2', { min: 0, max: 23 })).toBeNull();
    expect(expandField('MON', { min: 0, max: 6 })).toBeNull();
    expect(expandField('?', { min: 1, max: 31 })).toBeNull();
    expect(expandField('*/0', { min: 0, max: 23 })).toBeNull();
  });
});

describe('validateCron — the frequency floor', () => {
  it('accepts the crons the live fleet actually uses', () => {
    for (const c of ['0 12 * * *', '0 17,23 * * *', '0 9 * * 0', '47 14 */2 * *', '23 1,13 * * *']) {
      expect(validateCron(c).error, c).toBeUndefined();
    }
  });

  // THE COST GUARD: the mistake worth designing against is a cadence far more
  // expensive than intended. `* * * * *` is 1440 cold-boot sessions a day.
  it('makes every-minute and every-N-minutes impossible to write', () => {
    expect(validateCron('* * * * *').error).toMatch(/minute \(first\) field/);
    expect(validateCron('*/5 * * * *').error).toMatch(/minute \(first\) field/);
    expect(validateCron('0,30 * * * *').error).toMatch(/minute \(first\) field/);
  });

  it('rejects the wrong number of fields and out-of-range values', () => {
    expect(validateCron('0 9 * *').error).toMatch(/has 4 field\(s\)/);
    expect(validateCron('0 9 * * * *').error).toMatch(/has 6 field\(s\)/);
    expect(validateCron('0 25 * * *').error).toMatch(/hour field/);
    expect(validateCron('0 9 0 * *').error).toMatch(/day-of-month field/);
    expect(validateCron('0 9 * 13 *').error).toMatch(/month field/);
    expect(validateCron('0 9 * * 7').error).toMatch(/day-of-week field/);
  });
});

describe('runsPerDay', () => {
  const per = (c: string) => runsPerDay(validateCron(c).fields!);
  it('counts hourly slots and day narrowing (dom and dow OR, per cron semantics)', () => {
    expect(per('0 12 * * *')).toBe(1);
    expect(per('0 17,23 * * *')).toBe(2);
    expect(per('0 * * * *')).toBe(24);
    expect(per('0 9 * * 0')).toBeCloseTo(1 / 7, 5);
    expect(per('47 14 */2 * *')).toBeCloseTo(16 / 30.44, 5);
    expect(per('0 9 1 * 0')).toBeCloseTo(1 / 30.44 + 1 / 7, 5);
  });
});

describe('parseEnabled / parseMode', () => {
  it('accepts only yes and no', () => {
    expect(parseEnabled('yes')).toBe(true);
    expect(parseEnabled(' NO ')).toBe(false);
    expect(parseEnabled('true')).toBeNull();
    expect(parseEnabled('✅')).toBeNull();
  });
  it('reads the mode block, or nothing at all', () => {
    expect(parseMode(doc([row()], 'apply'))).toBe('apply');
    expect(parseMode(doc([row()]))).toBe('report-only');
    expect(parseMode('no blocks here')).toBeNull();
  });
});

describe('checkSchedule — a clean file passes', () => {
  it('accepts a well-formed table', () => {
    expect(run(doc([row()])).problems).toEqual([]);
  });
  it('reports the mode and the run total', () => {
    const res = run(doc([row({ cron: '0 17,23 * * *' })], 'apply'));
    expect(res.mode).toBe('apply');
    expect(res.totalRuns).toBe(2);
  });
});

describe('checkSchedule — malformed input', () => {
  it('rejects a missing schedule block', () => {
    expect(run('nothing here').problems.join('\n')).toMatch(/fleet:schedule:start/);
  });
  it('rejects a missing or unknown mode', () => {
    expect(run(doc([row()], 'yolo')).problems.join('\n')).toMatch(/not one of report-only \/ apply/);
  });
  it('rejects an added, renamed or reordered column', () => {
    const bad = doc([row()]).replace('| Why this cadence |', '| Why this cadence | Model |');
    expect(run(bad).problems.join('\n')).toMatch(/must be exactly/);
  });
  it('rejects a row with the wrong cell count', () => {
    expect(run(doc(['| a | b | c |'])).problems.join('\n')).toMatch(/expected 5/);
  });
  it('rejects a malformed cron', () => {
    expect(run(doc([row({ cron: '0 99 * * *' })])).problems.join('\n')).toMatch(/hour field/);
  });
  it('rejects a cron cell that is not backticked', () => {
    const bad = doc([row()]).replace('`0 12 * * *`', '0 12 * * *');
    expect(run(bad).problems.join('\n')).toMatch(/backtick-quoted 5-field cron/);
  });
  it('rejects an enabled cell that is not yes/no', () => {
    expect(run(doc([row({ enabled: 'maybe' })])).problems.join('\n')).toMatch(/exactly `yes` or `no`/);
  });
  it('rejects a missing reason', () => {
    expect(run(doc([row({ why: '—' })])).problems.join('\n')).toMatch(/must say why/);
  });
  it('rejects a made-up trigger id', () => {
    expect(run(doc([row({ id: 'karen' })])).problems.join('\n')).toMatch(/is not a trigger id/);
  });
  it('rejects duplicate trigger ids and duplicate names', () => {
    const out = run(doc([row(), row({ cron: '0 13 * * *' })])).problems.join('\n');
    expect(out).toMatch(/already listed on row 1/);
    expect(out).toMatch(/name .* is already used on row 1/);
  });
  it('rejects an empty table — an empty control panel is not a safe no-op', () => {
    expect(run(doc([])).problems.join('\n')).toMatch(/table is empty/);
  });
});

describe('checkSchedule — the control plane is untouchable', () => {
  it('refuses the Routine Auditor by id', () => {
    const out = run(doc([row({ id: AUDITOR, name: 'A helpful bot' })])).problems.join('\n');
    expect(out).toMatch(/may NEVER be listed here/);
    expect(out).toMatch(/ONLY detection layer/);
  });
  it('refuses control-plane routines by NAME too — the reconciler has no id yet', () => {
    const out = run(doc([row({ name: 'Fleet Reconciler — cadence' })])).problems.join('\n');
    expect(out).toMatch(/control-plane routine/);
    expect(run(doc([row({ name: 'Routine Auditor (cloud)' })])).problems.join('\n')).toMatch(
      /control-plane routine/,
    );
  });
  it('keeps the auditor in FORBIDDEN with a stated reason', () => {
    expect(FORBIDDEN[AUDITOR]).toMatch(/detection layer/);
  });
});

describe('checkSchedule — registration', () => {
  it('refuses a trigger that runners.md does not register', () => {
    expect(run(doc([row()]), 'an empty registry').problems.join('\n')).toMatch(
      new RegExp(`does not appear in ${REGISTRY_FILE}`),
    );
  });
});

describe('checkSchedule — the cost ceilings', () => {
  it('refuses a per-routine cadence above the ceiling', () => {
    const out = run(doc([row({ cron: '0 * * * *' })])).problems.join('\n');
    expect(out).toMatch(new RegExp(`ceiling is ${MAX_RUNS_PER_DAY_PER_ENTRY}`));
  });
  it('refuses a fleet-wide blowout even when every single row is legal', () => {
    // Three routines at the per-entry ceiling: each legal, together over budget.
    const ids = [OK_ID, OK_ID2, 'trig_01REc9iWzjGmKnoocxCACUV1'];
    const rows = ids.map((id, i) =>
      row({ id, name: `Runner ${i}`, cron: '0 */2 * * *', why: 'stress fixture, twelve a day' }),
    );
    const out = run(doc(rows), `${REGISTRY} ${ids.join(' ')}`).problems.join('\n');
    expect(out).toMatch(new RegExp(`above the ${FLEET_DAILY_RUNS}/day budget`));
  });
  it('refuses more enabled entries than invariant 4 allows', () => {
    const rows = Array.from({ length: ENABLED_CEILING + 1 }, (_, i) =>
      row({
        id: `trig_01AAAAAAAAAAAAAAAAAA${String(i).padStart(2, '0')}`,
        name: `Runner ${i}`,
        cron: '0 9 * * 0',
        why: 'weekly, cheap enough to stack for this fixture',
      }),
    );
    const registry = rows.join(' ');
    expect(run(doc(rows), registry).problems.join('\n')).toMatch(
      new RegExp(`above the invariant-4 ceiling of ${ENABLED_CEILING}`),
    );
  });
});

describe('checkSchedule — launch-gate coherence', () => {
  const gatesDoc = (cron: string) =>
    [
      '<!-- gates:cadence:start -->',
      '',
      '| Gate | Cadence the criterion claims | Runner that provides it | Registered cadence | Where |',
      '|---|---|---|---|---|',
      `| SCAN | nightly | Karen (\`${OK_ID2}\`) | \`${cron}\` | ${SCHEDULE_FILE} |`,
      '',
      '<!-- gates:cadence:end -->',
    ].join('\n');

  it('extracts trigger-backed cadence claims', () => {
    expect(gateCadences(gatesDoc('0 9 * * 0')).get(OK_ID2)).toEqual({ gate: 'SCAN', cron: '0 9 * * 0' });
  });
  it('passes when the two documents agree', () => {
    const s = doc([row({ id: OK_ID2, name: 'Karen', cron: '0 9 * * 0', why: 'weekly since 2026-07-25' })]);
    expect(run(s, REGISTRY, gatesDoc('0 9 * * 0')).problems).toEqual([]);
  });
  it('fails when a cadence change would leave a launch gate claiming something untrue', () => {
    const s = doc([row({ id: OK_ID2, name: 'Karen', cron: '0 9 * * 1', why: 'moved to Mondays' })]);
    const out = run(s, REGISTRY, gatesDoc('0 9 * * 0')).problems.join('\n');
    expect(out).toMatch(/launch gate SCAN/);
    expect(out).toMatch(new RegExp(`re-scored in the same PR`));
  });
  it('fails when a gate-backing routine is switched off', () => {
    const s = doc([
      row({ id: OK_ID2, name: 'Karen', cron: '0 9 * * 0', enabled: 'no', why: 'paused for cost' }),
    ]);
    expect(run(s, REGISTRY, gatesDoc('0 9 * * 0')).problems.join('\n')).toMatch(/depends on this routine running/);
  });
});

describe('the real file in this repo', () => {
  const scheduleText = read(SCHEDULE_FILE);

  it('passes its own check', () => {
    const res = checkSchedule({
      scheduleText,
      registryText: read(REGISTRY_FILE),
      gatesText: read(GATES_FILE),
    });
    expect(res.problems).toEqual([]);
  });

  it('ships in report-only mode — the crons were transcribed from docs, not read off the live fleet', () => {
    expect(parseMode(scheduleText)).toBe('report-only');
  });

  it('lists neither the auditor nor anything named like the control plane', () => {
    const { entries } = parseSchedule(scheduleText);
    expect(entries.map((e) => e.triggerId)).not.toContain(AUDITOR);
    expect(entries.every((e) => !/reconcil|auditor/i.test(e.name))).toBe(true);
  });

  it('spells out the allowlist semantic — unlisted means untouchable', () => {
    expect(scheduleText).toMatch(/not listed in the table below is a trigger the reconciler\s+may not touch/);
  });

  it('stays well inside the daily run budget', () => {
    const { totalRuns } = checkSchedule({
      scheduleText,
      registryText: read(REGISTRY_FILE),
      gatesText: read(GATES_FILE),
    });
    expect(totalRuns).toBeLessThan(FLEET_DAILY_RUNS);
  });
});
