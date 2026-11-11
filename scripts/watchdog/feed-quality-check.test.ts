import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  evaluateHoldRate,
  evaluateVisibleItems,
  renderHoldBody,
  renderVisibleBody,
} from './feed-quality-check.mjs';

const GOOD_SUMMARY =
  'Taylor Swift was inducted into the Nashville Songwriters Hall of Fame tonight. Fans celebrated the honor as recognition of two decades of songwriting.';
const GOOD_SUMMARY_LONG = `${GOOD_SUMMARY} It caps a busy month.`;
const GOOD_DETAIL = Array(70).fill('word').join(' ');

const item = (overrides = {}) => ({
  id: 'ci-1',
  headline: 'Taylor Swift inducted into Nashville Songwriters Hall of Fame',
  summary: GOOD_SUMMARY_LONG,
  detail: GOOD_DETAIL,
  imageUrl: 'https://www.people.com/photo.jpg',
  redlineOk: true,
  ...overrides,
});

describe('evaluateVisibleItems (live feed)', () => {
  it('pass: every visible item clears the shared gate', () => {
    const out = evaluateVisibleItems([item(), item({ id: 'ci-2' })]);
    expect(out).toMatchObject({ status: 'ok', checked: 2, failures: [] });
  });

  it('pass: an empty feed is not a quality failure', () => {
    expect(evaluateVisibleItems([]).status).toBe('ok');
  });

  it('fail: a visible item with no image is flagged missing_image', () => {
    const out = evaluateVisibleItems([item(), item({ id: 'ci-bad', imageUrl: undefined })]);
    expect(out.status).toBe('fail');
    expect(out.failures).toEqual([expect.objectContaining({ id: 'ci-bad', reason: 'missing_image' })]);
  });

  it('fail: the 2026-10-12 live shape (one sentence, no image) is caught', () => {
    const out = evaluateVisibleItems([
      item({ id: 'phil', headline: 'Phil Collins praises Taylor', summary: 'Phil Collins praised Taylor.', detail: 'Short.', imageUrl: null }),
    ]);
    expect(out.failures[0].reason).toBe('missing_image');
  });

  it('fail: thin copy, non-allowlisted image host, and missing redline flag are each caught', () => {
    const out = evaluateVisibleItems([
      item({ id: 'thin', summary: 'Too short.' }),
      item({ id: 'host', imageUrl: 'https://random-blog.example.com/x.jpg' }),
      item({ id: 'noflag', redlineOk: undefined }),
    ]);
    expect(out.failures.map((f) => [f.id, f.reason])).toEqual([
      ['thin', 'summary_too_short'],
      ['host', 'image_host_not_allowlisted'],
      ['noflag', 'redline_failed'],
    ]);
  });

  it('unknown (no alert change) when the payload has no items array', () => {
    expect(evaluateVisibleItems(undefined).status).toBe('unknown');
  });
});

describe('evaluateHoldRate (pipeline broken)', () => {
  const held = (reason) => ({ redline_ok: false, quality_hold_reason: reason });
  const pub = { redline_ok: true, quality_hold_reason: null };

  it('fail: 100% of new items held for missing_image', () => {
    const out = evaluateHoldRate(Array(6).fill(held('missing_image')), { minSample: 5 });
    expect(out).toMatchObject({ status: 'fail', trigger: 'missing_image', total: 6, missingImage: 6 });
  });

  it('fail: 100% held for mixed reasons is still a stuck pipeline', () => {
    const rows = [...Array(3).fill(held('missing_image')), ...Array(3).fill(held('detail_too_short'))];
    expect(evaluateHoldRate(rows, { minSample: 5 })).toMatchObject({ status: 'fail', trigger: 'all_held' });
  });

  it('pass: one item publishing breaks the "100% held" condition', () => {
    const rows = [...Array(9).fill(held('missing_image')), pub];
    expect(evaluateHoldRate(rows, { minSample: 5 }).status).toBe('ok');
  });

  it('pass: below the minimum sample a quiet day never pages', () => {
    const out = evaluateHoldRate(Array(2).fill(held('missing_image')), { minSample: 5 });
    expect(out).toMatchObject({ status: 'ok', insufficientSample: true });
  });

  it('counts holds by reason for the alert body', () => {
    const out = evaluateHoldRate([held('missing_image'), held('missing_image'), held('summary_too_short'), pub], { minSample: 1 });
    expect(out.byReason).toEqual({ missing_image: 2, summary_too_short: 1 });
  });
});

describe('alert bodies', () => {
  const now = new Date('2026-10-13T12:00:00Z');

  it('fail body names each failing item and its reason', () => {
    const body = renderVisibleBody(evaluateVisibleItems([item({ id: 'x', imageUrl: undefined })]), {
      url: 'https://www.longlivets.com/vault/live/tloas',
      now,
    });
    expect(body).toMatch(/1 of 1 item\(s\) visible/);
    expect(body).toMatch(/`missing_image`.*`x`/);
  });

  it('auto-close body (healthy) reads as recovery, not an alarm', () => {
    const body = renderVisibleBody(evaluateVisibleItems([item()]), { url: 'u', now });
    expect(body).toMatch(/pass the shared publish gate/);
    expect(body).not.toMatch(/fail/i);
  });

  it('hold-rate fail body names the missing_image incident', () => {
    const body = renderHoldBody(evaluateHoldRate(Array(5).fill({ redline_ok: false, quality_hold_reason: 'missing_image' }), { minSample: 5 }), { now });
    expect(body).toMatch(/held for `missing_image`/);
  });
});

describe('watchdog.yml wiring (dedupe + auto-close + founder @-mention)', () => {
  const yml = readFileSync(new URL('../../.github/workflows/watchdog.yml', import.meta.url), 'utf8');

  for (const [check, title] of [
    ['visible', 'Watchdog: live feed item fails publish gate'],
    ['hold-rate', 'Watchdog: news pipeline holding every new item'],
  ]) {
    it(`${check}: wired with a persistent (non-dated) alert title`, () => {
      expect(yml).toContain('node scripts/watchdog/feed-quality-check.mjs --check "$CHECK"');
      expect(yml).toContain(`run_check ${check} "${title}"`);
    });
  }

  it('exit 1 opens with ALERT_MENTION_FOUNDER=1, exit 0 closes, exit 2 leaves state alone', () => {
    const step = yml.slice(yml.indexOf('- name: Live feed quality check'));
    const body = step.slice(0, step.indexOf('- name:', 10));
    expect(body).toMatch(/"\$STATUS" -eq 0 \]; then\s+scripts\/watchdog\/upsert-alert\.sh close/);
    expect(body).toMatch(/"\$STATUS" -eq 1 \]; then\s+ALERT_MENTION_FOUNDER=1 scripts\/watchdog\/upsert-alert\.sh open/);
    expect(body).toMatch(/alert state unchanged/);
  });
});
