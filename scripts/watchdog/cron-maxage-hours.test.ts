import { describe, expect, it } from 'vitest';
import { cronIntervalHours, maxAgeHoursFromCron, extractScheduleCrons } from './cron-maxage-hours.mjs';

describe('cronIntervalHours', () => {
  it('treats a plain daily cron as 24h', () => {
    expect(cronIntervalHours('0 21 * * *')).toBe(24);
  });

  it('treats a weekly single-day cron as 168h', () => {
    expect(cronIntervalHours('0 9 * * 0')).toBe(168);
  });

  it('takes the shorter circular gap for a twice-weekly cron', () => {
    // Tue(2)/Fri(5): Tue->Fri = 3 days, Fri->Tue(+7) = 4 days.
    expect(cronIntervalHours('20 18 * * 2,5')).toBe(72);
  });

  it('takes the shorter circular gap for a twice-daily cron', () => {
    // hours 1,13: gap either way is 12h.
    expect(cronIntervalHours('23 1,13 * * *')).toBe(12);
  });

  it('treats a pinned day-of-month as ~monthly', () => {
    expect(cronIntervalHours('17 8 1 * *')).toBe(24 * 30);
  });

  it('treats an hourly (`* * * * *` hour wildcard) cron as 1h', () => {
    expect(cronIntervalHours('5 * * * *')).toBe(1);
  });

  it('handles a minute step wildcard', () => {
    expect(cronIntervalHours('*/30 * * * *')).toBe(0.5);
  });
});

describe('maxAgeHoursFromCron', () => {
  it('applies the 2.5x-with-6h-floor rule', () => {
    expect(maxAgeHoursFromCron(['0 21 * * *'])).toBe(60);
    expect(maxAgeHoursFromCron(['23 1,13 * * *'])).toBe(30);
  });

  it('floors at 6h for a very frequent cron', () => {
    expect(maxAgeHoursFromCron(['5 * * * *'])).toBe(6);
  });

  it('returns null with no crons', () => {
    expect(maxAgeHoursFromCron([])).toBeNull();
  });
});

describe('extractScheduleCrons', () => {
  it('pulls cron strings out of an on.schedule block', () => {
    const yaml = [
      'name: example',
      'on:',
      '  schedule:',
      '    - cron: "0 21 * * *" # comment',
      '  workflow_dispatch: {}',
      '',
    ].join('\n');
    expect(extractScheduleCrons(yaml)).toEqual(['0 21 * * *']);
  });

  it('returns empty for a file with no schedule trigger', () => {
    const yaml = ['name: example', 'on:', '  workflow_dispatch: {}', ''].join('\n');
    expect(extractScheduleCrons(yaml)).toEqual([]);
  });

  it('handles two schedule entries (watchdog.yml shape)', () => {
    const yaml = [
      'on:',
      '  schedule:',
      '    - cron: "35 14 * * *"',
      '    - cron: "5 * * * *"',
      '  workflow_dispatch: {}',
      '',
    ].join('\n');
    expect(extractScheduleCrons(yaml)).toEqual(['35 14 * * *', '5 * * * *']);
  });
});
