import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STALE_HOURS, evaluateStatusFreshness, parseUpdatedAt } from './status-page-freshness-check.mjs';

const NOW = Date.parse('2026-10-21T15:00:00Z');
const page = (updated: string | null, over: Record<string, unknown> = {}) => ({
  number: 4665,
  url: 'https://example.invalid/4665',
  body: [
    '<!-- marjorie-status-page v1 -->',
    '# 📋 Long Live — Status',
    ...(updated ? [`_Updated ${updated} UTC · 10:45 AM PT_`] : []),
    '',
    '## 🙋 Needs you',
  ].join('\n'),
  ...over,
});

describe('parseUpdatedAt', () => {
  it('reads the header a full render writes', () => {
    expect(parseUpdatedAt(page('2026-10-21 14:07').body)).toBe(Date.parse('2026-10-21T14:07:00Z'));
  });
  it('is null when the page has no header, rather than guessing', () => {
    expect(parseUpdatedAt(page(null).body)).toBeNull();
    expect(parseUpdatedAt('')).toBeNull();
    expect(parseUpdatedAt(null)).toBeNull();
    expect(parseUpdatedAt('_Updated whenever UTC_')).toBeNull();
  });
  it('tolerates CRLF bodies', () => {
    expect(parseUpdatedAt('x\r\n_Updated 2026-10-21 14:07 UTC_\r\n')).toBe(Date.parse('2026-10-21T14:07:00Z'));
  });
});

describe('evaluateStatusFreshness', () => {
  it('is ok inside the grace window', () => {
    const got = evaluateStatusFreshness([page('2026-10-21 13:00')], { now: NOW });
    expect(got).toMatchObject({ state: 'ok', number: 4665, ageHours: 2 });
    expect(got.updatedAt).toBe('2026-10-21T13:00:00.000Z');
  });

  // Issue #6151: the page sat at 2026-10-06 17:45 for 15 days while the note
  // region kept updating daily, so the page looked maintained.
  it('alerts on the frozen page that went unnoticed for 15 days', () => {
    expect(evaluateStatusFreshness([page('2026-10-06 17:45')], { now: NOW })).toMatchObject({
      state: 'alert',
      ageHours: 357.3,
    });
  });

  it('alerts the moment the header passes the grace window', () => {
    const hours = (h: number) => new Date(NOW - h * 3_600_000).toISOString().slice(0, 16).replace('T', ' ');
    expect(evaluateStatusFreshness([page(hours(STALE_HOURS))], { now: NOW }).state).toBe('ok');
    expect(evaluateStatusFreshness([page(hours(STALE_HOURS + 0.5))], { now: NOW }).state).toBe('alert');
  });

  // An unreadable page must never close a standing alert.
  it('is unknown, not ok, when it cannot see the page or the header', () => {
    expect(evaluateStatusFreshness([], { now: NOW })).toMatchObject({ state: 'unknown', number: null });
    expect(evaluateStatusFreshness(null as never, { now: NOW }).state).toBe('unknown');
    const noHeader = evaluateStatusFreshness([page(null)], { now: NOW });
    expect(noHeader).toMatchObject({ state: 'unknown', number: 4665, ageHours: null });
    expect(noHeader.reason).toContain('_Updated');
  });

  it('picks the oldest status-page issue, as the renderer does', () => {
    const got = evaluateStatusFreshness(
      [page('2026-10-06 17:45', { number: 9001 }), page('2026-10-21 14:07', { number: 4665 })],
      { now: NOW },
    );
    expect(got).toMatchObject({ number: 4665, state: 'ok' });
  });
});

describe('watchdog.yml wiring', () => {
  const yml = readFileSync('.github/workflows/watchdog.yml', 'utf8').replace(/\r\n/g, '\n');
  const step = yml.slice(yml.indexOf('- name: Status page not re-rendering'), yml.indexOf('# Scheduled-workflow cadence check'));

  it('runs hourly even when an earlier step failed the job', () => {
    expect(step).toContain('if: always()');
  });

  it('opens one persistent alert and closes it on recovery', () => {
    expect(step).toContain('ALERT_TITLE="Watchdog: status page is not re-rendering"');
    expect(step).toContain('upsert-alert.sh open "$ALERT_TITLE"');
    expect(step).toContain('upsert-alert.sh close "$ALERT_TITLE"');
    expect(step).toContain('ALERT_MENTION_FOUNDER=1');
    expect(step).toContain('node scripts/watchdog/status-page-freshness-check.mjs evaluate');
  });

  it('leaves the alert alone when the page is unreadable', () => {
    expect(step).toContain('::warning::Status page freshness unreadable');
  });
});
