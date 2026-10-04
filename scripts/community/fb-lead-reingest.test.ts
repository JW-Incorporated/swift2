import { describe, expect, it } from 'vitest';
import {
  latestExportPerGroup,
  leadsFromExportHtml,
  parseArgs,
  parseExportName,
} from './fb-lead-reingest.mjs';

// SYNTHETIC fixture, same posture as facebook-groups-parser.test.ts's own
// (no real Facebook export is available — see that module's header).
const SYNTHETIC_EXPORT_HTML = `<html><body>
  <div aria-posinset="1" role="article" data-posinset="65">
    <a href="/profile/1" aria-label="Jane Fan">Jane Fan</a>
    <div dir="auto">the vault door theory is back and the merch drop is full of eggs</div>
    <span>42 reactions</span>
    <span>7 comments</span>
  </div>
  <div role="article" data-posinset="66">
    <a href="/profile/2" aria-label="Another Fan">Another Fan</a>
    <div dir="auto">does anyone else think the color palette this era is a clue</div>
    <span>10 likes</span>
    <span>3 comments</span>
  </div>
</body></html>`;

describe('parseExportName', () => {
  it('parses the stored fb-<slug>-<date>.html name', () => {
    expect(parseExportName('fb-the-swifties-society-2026-10-01.html')).toEqual({
      slug: 'the-swifties-society',
      date: '2026-10-01',
    });
  });

  it('parses a numeric-id group slug', () => {
    expect(parseExportName('fb-taylor-swift-group-563881396975983-2026-09-30.html')).toEqual({
      slug: 'taylor-swift-group-563881396975983',
      date: '2026-09-30',
    });
  });

  it('rejects anything else in the bucket', () => {
    expect(parseExportName('notes.txt')).toBeNull();
    expect(parseExportName('fb-no-date.html')).toBeNull();
  });
});

describe('latestExportPerGroup', () => {
  const objects = [
    { name: 'fb-the-swifties-society-2026-09-24.html' },
    { name: 'fb-the-swifties-society-2026-10-01.html' },
    { name: 'fb-kulto-ni-taylor-swift-2026-09-30.html' },
    { name: 'README.md' },
  ];

  it('keeps only the newest export per group', () => {
    expect(latestExportPerGroup(objects)).toEqual([
      { slug: 'kulto-ni-taylor-swift', date: '2026-09-30', name: 'fb-kulto-ni-taylor-swift-2026-09-30.html' },
      { slug: 'the-swifties-society', date: '2026-10-01', name: 'fb-the-swifties-society-2026-10-01.html' },
    ]);
  });

  it('restricts to the requested slugs', () => {
    const result = latestExportPerGroup(objects, { slugs: ['kulto-ni-taylor-swift'] });
    expect(result).toHaveLength(1);
    expect(result[0]!.slug).toBe('kulto-ni-taylor-swift');
  });

  it('is empty for an empty bucket', () => {
    expect(latestExportPerGroup([])).toEqual([]);
  });
});

describe('leadsFromExportHtml', () => {
  it('derives clean leads — no member name, no markup fragment (#4885)', () => {
    const { leads, postCount, screenedOut } = leadsFromExportHtml(SYNTHETIC_EXPORT_HTML, {
      slug: 'taylor-swifts-vault',
    });
    expect(postCount).toBe(2);
    expect(screenedOut).toBe(0);
    expect(leads).toHaveLength(2);
    for (const lead of leads) {
      expect(lead.platform).toBe('facebook');
      expect(lead.community).toBe('facebook:taylor-swifts-vault');
      expect(lead.status).toBe('new');
      expect(lead.locator).not.toMatch(/Jane Fan|Another Fan/i);
      expect(lead.context).not.toMatch(/Jane Fan|Another Fan/i);
      expect(lead.context).not.toMatch(/role=|data-posinset|[<>]/);
    }
  });

  it('uses the checklist group label in the locator prefix', () => {
    const { leads } = leadsFromExportHtml(SYNTHETIC_EXPORT_HTML, { slug: 'taylor-swifts-vault' });
    expect(leads[0]!.locator.startsWith("Taylor Swift's Vault — ")).toBe(true);
  });

  it('ranks by reactions+comments*2 and honors a lead cap', () => {
    const { leads } = leadsFromExportHtml(SYNTHETIC_EXPORT_HTML, {
      slug: 'taylor-swifts-vault',
      maxLeadsPerGroup: 1,
    });
    expect(leads).toHaveLength(1);
    expect(leads[0]!.context).toContain('vault door theory');
  });

  it('drops a redline-flagged post from the leads entirely', () => {
    const flagged = SYNTHETIC_EXPORT_HTML.replace(
      'the vault door theory is back and the merch drop is full of eggs',
      'is she pregnant? someone said they saw a bump',
    );
    const { leads, screenedOut } = leadsFromExportHtml(flagged, { slug: 'taylor-swifts-vault' });
    expect(screenedOut).toBe(1);
    expect(leads).toHaveLength(1);
    expect(leads[0]!.context).not.toMatch(/pregnant/i);
  });

  it('returns nothing for an export with no posts', () => {
    expect(leadsFromExportHtml('<html><body>nothing</body></html>', { slug: 'x' }).leads).toEqual([]);
  });
});

describe('parseArgs', () => {
  it('defaults to a dry run across all groups', () => {
    expect(parseArgs([])).toEqual({ apply: false, group: null, maxLeadsPerGroup: undefined });
  });

  it('reads --apply, --group and --max-leads-per-group', () => {
    expect(parseArgs(['--apply', '--group', 'the-swifties-society', '--max-leads-per-group', '3'])).toEqual({
      apply: true,
      group: 'the-swifties-society',
      maxLeadsPerGroup: 3,
    });
  });
});
