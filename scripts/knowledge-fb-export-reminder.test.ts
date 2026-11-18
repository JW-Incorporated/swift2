import { describe, expect, it } from 'vitest';
import { FILED_BY_MARKER, closeSuperseded, isoDate, issueTitle, issueBody, supersededReminders } from './knowledge-fb-export-reminder.mjs';

const reminder = (number: number, week: string, body = issueBody([])) => ({ number, title: issueTitle(week), body });

describe('supersededReminders', () => {
  it('the filed body carries the marker it matches on', () => {
    expect(issueBody([])).toContain(FILED_BY_MARKER);
  });

  it('picks only earlier weeks this script filed', () => {
    const issues = [
      reminder(1, '2026-11-08'),
      reminder(2, '2026-11-15'),
      reminder(3, '2026-11-22'),
      reminder(4, '2026-11-01', 'hand-written, no footer'),
      { number: 5, title: 'Watchdog: no FB group export closed in 9 days', body: FILED_BY_MARKER },
      { number: 6, title: 'Re: FB group export due — week of 2026-11-01', body: FILED_BY_MARKER },
    ];
    expect(supersededReminders(issues, '2026-11-15').map((i) => i.number)).toEqual([1]);
  });
});

describe('closeSuperseded', () => {
  function fakeGh(issues: Array<Record<string, unknown>>) {
    const calls: string[][] = [];
    const ghImpl = async (args: string[]) => {
      calls.push(args);
      return { stdout: args[1] === 'list' ? JSON.stringify(issues) : '' };
    };
    return { ghImpl, calls };
  }
  const issues = [reminder(10, '2026-11-08'), reminder(11, '2026-11-01'), reminder(12, '2026-11-15')];

  it('closes earlier reminders as not planned, naming the new one', async () => {
    const { ghImpl, calls } = fakeGh(issues);
    const closed = await closeSuperseded({ weekLabel: '2026-11-15', current: '#12', ghImpl, log: () => {} });
    expect(closed).toEqual([10, 11]);
    const closes = calls.filter((c) => c[1] === 'close');
    expect(closes.map((c) => c[2])).toEqual(['10', '11']);
    expect(closes[0]!.slice(3, 5)).toEqual(['--reason', 'not planned']);
    expect(closes[0]![closes[0]!.indexOf('--comment') + 1]).toMatch(/^Superseded by this week's reminder \(#12\)/);
  });

  it('dry run lists but never closes', async () => {
    const { ghImpl, calls } = fakeGh(issues);
    const logs: string[] = [];
    expect(await closeSuperseded({ weekLabel: '2026-11-15', current: 'x', dryRun: true, ghImpl, log: (m: string) => logs.push(m) })).toEqual([10, 11]);
    expect(calls.filter((c) => c[1] === 'close')).toHaveLength(0);
    expect(logs).toHaveLength(2);
  });
});

describe('isoDate', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(isoDate(new Date('2026-08-23T16:00:00Z'))).toBe('2026-08-23');
  });
});

describe('issueTitle', () => {
  it('is date-scoped, one issue per week', () => {
    expect(issueTitle('2026-08-23')).toBe('FB group export due — week of 2026-08-23');
  });
});

describe('issueBody', () => {
  it('flags a missing checklist rather than silently listing nothing', () => {
    const body = issueBody([]);
    expect(body).toMatch(/No groups configured yet/);
    expect(body).toMatch(/fb-groups-checklist\.mjs/);
    expect(body).toMatch(/HUMAN-ACTIONS\.md #16/);
  });

  it('lists every configured group as a checklist item', () => {
    const body = issueBody([
      { slug: 'group-a', label: 'Group A' },
      { slug: 'group-b', label: 'Group B' },
    ]);
    expect(body).toContain('- [ ] Group A (`group-a`)');
    expect(body).toContain('- [ ] Group B (`group-b`)');
  });

  it('flags candidate rows with a confirm-or-delete note and the flip instructions', () => {
    const body = issueBody([
      { slug: 'group-a', label: 'Group A', candidate: true },
      { slug: 'group-b', label: 'Group B' },
    ]);
    expect(body).toContain(
      "- [ ] Group A (`group-a`) — _candidate, confirm you're a member, or delete the line_",
    );
    expect(body).toContain('- [ ] Group B (`group-b`)');
    expect(body).not.toContain('Group B (`group-b`) — _candidate');
    expect(body).toMatch(/remove.*`candidate: true`/);
    expect(body).toMatch(/confirmed <slug>/);
  });

  it('omits the flip instructions when no rows are candidates', () => {
    const body = issueBody([{ slug: 'group-a', label: 'Group A' }]);
    expect(body).not.toMatch(/confirmed <slug>/);
  });

  it('mentions the owner and references the automated commands', () => {
    const body = issueBody([]);
    expect(body).toMatch(/@sffan15-sys/);
    expect(body).toMatch(/npm run knowledge:fb-export/);
    expect(body).toMatch(/npm run knowledge:fb-export:dry/);
  });

  it('names the private drop location (facebook-exports bucket, never the repo)', () => {
    const body = issueBody([]);
    expect(body).toMatch(/private `facebook-exports` bucket/);
    expect(body).toMatch(/failed files stay local/);
  });

  it('describes deterministic collection and safe stop conditions', () => {
    const body = issueBody([]);
    expect(body).toMatch(/Sunday 18:00 local time/);
    expect(body).toMatch(/New posts \(chronological\)/);
    expect(body).toMatch(/seven-day stop is only sound in creation order/);
    expect(body).not.toMatch(/new activity/i);
    expect(body).toMatch(/checkpoint, 2FA, CAPTCHA/);
    expect(body).toMatch(/250 scrolls, or 20 minutes/);
    expect(body).toMatch(/dry-run ingest/);
    expect(body).toMatch(/no AI/);
  });

  it('includes the first-real-export calibration checklist referencing HUMAN-ACTIONS.md #70', () => {
    const body = issueBody([]);
    expect(body).toMatch(/one-time calibration \(HUMAN-ACTIONS\.md #70\)/);
    expect(body).toMatch(/0 posts kept on a group you know was active/);
    expect(body).toMatch(/parser is calibrated/);
  });
});
