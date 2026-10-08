import { describe, expect, it } from 'vitest';
import {
  buildDigestBody,
  buildDigestSummary,
  buildDigestTitle,
  buildEasterEggDigestBody,
  withManageFooter,
  WEEKLY_CLOWN_REPORT_TITLE,
  type DigestQueueItem,
} from './notification-digest-copy';

describe('buildDigestSummary', () => {
  it('returns a placeholder for an empty digest', () => {
    expect(buildDigestSummary([])).toBe('Nothing new right now.');
  });

  it('lists a single item per category without a count prefix', () => {
    const items: DigestQueueItem[] = [{ category: 'official_youtube', title: 'x' }];
    expect(buildDigestSummary(items)).toBe('new video');
  });

  it('groups multiple items in the same category with a count', () => {
    const items: DigestQueueItem[] = [
      { category: 'easter_egg', title: 'a' },
      { category: 'easter_egg', title: 'b' },
      { category: 'easter_egg', title: 'c' },
    ];
    expect(buildDigestSummary(items)).toBe('3 theories');
  });

  it('merges every category into one comma-joined summary, in first-seen order', () => {
    const items: DigestQueueItem[] = [
      { category: 'official_youtube', title: 'video' },
      { category: 'official_merch', title: 'merch' },
      { category: 'easter_egg', title: 't1' },
      { category: 'easter_egg', title: 't2' },
    ];
    expect(buildDigestSummary(items)).toBe('new video, merch restock, 2 theories');
  });
});

describe('withManageFooter', () => {
  it('appends the required footer line', () => {
    expect(withManageFooter('hello')).toBe('hello\nManage notifications');
  });
});

describe('buildDigestTitle / buildDigestBody', () => {
  it('uses the daily title', () => {
    expect(buildDigestTitle('daily')).toBe('Today in Taylor');
  });

  it('uses the weekly title', () => {
    expect(buildDigestTitle('weekly')).toBe('This week in Taylor');
  });

  it('builds a full body with title, summary, arrow, and footer', () => {
    const items: DigestQueueItem[] = [{ category: 'song_drop', title: 'x' }];
    const body = buildDigestBody('daily', items);
    expect(body).toBe('Today in Taylor: new song \u2192\nManage notifications');
  });
});

describe('buildEasterEggDigestBody', () => {
  it('never fabricates content when there are no curated theories', () => {
    const body = buildEasterEggDigestBody([]);
    expect(body).toContain(WEEKLY_CLOWN_REPORT_TITLE);
    expect(body).toContain('no fresh theories');
    expect(body).toContain('Manage notifications');
  });

  it('joins up to 3 curated theories with the Weekly Clown Report branding', () => {
    const body = buildEasterEggDigestBody([
      { summary: 'Theory A' },
      { summary: 'Theory B' },
      { summary: 'Theory C' },
      { summary: 'Theory D (should be dropped)' },
    ]);
    expect(body).toContain(WEEKLY_CLOWN_REPORT_TITLE);
    expect(body).toContain('Theory A');
    expect(body).toContain('Theory B');
    expect(body).toContain('Theory C');
    expect(body).not.toContain('Theory D');
  });
});
