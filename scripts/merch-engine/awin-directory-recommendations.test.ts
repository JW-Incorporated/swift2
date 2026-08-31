import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { buildRecommendations, formatCsv, formatMarkdown } from './awin-directory-recommendations.mjs';

const programmes = [
  {
    id: 1,
    name: 'Already Joined Shop',
    primaryRegion: { countryCode: 'US' },
    relationship: 'joined',
    sectors: ['Clothing'],
  },
  {
    id: 2,
    name: 'Notjoined Fashion Shop',
    primaryRegion: { countryCode: 'US' },
    relationship: 'notjoined',
    sectors: ['Clothing'],
    joinUrl: 'https://ui.awin.com/programmes/2/join',
    commissionStatus: '10% per sale',
    validationStatus: '30 days',
  },
  {
    id: 3,
    name: 'Pending Beauty Shop',
    primaryRegion: { countryCode: 'US' },
    relationship: 'pending',
    primarySector: 'Health & Beauty',
  },
  {
    id: 4,
    name: 'Rejected Jewelry Shop',
    primaryRegion: { countryCode: 'US' },
    relationship: 'rejected',
    sectors: ['Jewellery'],
  },
  {
    id: 5,
    name: 'Outside Sector Shop',
    primaryRegion: { countryCode: 'US' },
    relationship: 'notjoined',
    sectors: ['Home'],
  },
  {
    id: 6,
    name: 'Non US Fashion Shop',
    primaryRegion: { countryCode: 'GB' },
    relationship: 'notjoined',
    sectors: ['Clothing'],
  },
];

describe('Awin directory join-recommendation list', () => {
  it('TARGET_SECTORS matches real Awin API sector strings, not fabricated ones (regression for t_4562240d)', () => {
    const collector = readFileSync('scripts/merch-engine/awin-directory-recommendations.mjs', 'utf8');
    const match = collector.match(/const TARGET_SECTORS = (\[[^\]]*\]);/);
    expect(match, 'TARGET_SECTORS declaration must exist and be a simple array literal').toBeTruthy();
    // eslint-disable-next-line no-eval
    const targetSectors: string[] = eval(match![1]);

    // Sector strings actually observed from a live, unfiltered Awin Publisher API
    // directory probe for this account (t_a57b0362, 2026-08-30). Awin uses UK
    // English spelling. Never let TARGET_SECTORS drift back to invented
    // US-spelling strings ('Fashion/Clothing', 'Accessories/Jewelry', 'Beauty')
    // that silently match zero live programmes.
    const liveObservedSectors = [
      'Clothing',
      'Clothing Accessories',
      'Jewellery',
      'Health & Beauty',
      'Womenswear',
      'Menswear',
      'Childrenswear',
      'Home',
      'Electronics',
    ];

    expect(targetSectors.length).toBeGreaterThan(0);
    for (const sector of targetSectors) {
      expect(
        liveObservedSectors.map((s) => s.toLowerCase()),
        `TARGET_SECTORS entry "${sector}" must match a real, live-observed Awin sector string`,
      ).toContain(sector.toLowerCase());
    }
    expect(targetSectors).not.toEqual(
      expect.arrayContaining(['Fashion/Clothing', 'Accessories/Jewelry', 'Beauty']),
    );
  });

  it('excludes already-joined programmes, non-US programmes, and out-of-sector programmes', () => {
    const report = buildRecommendations({
      programmes,
      feedAdvertiserIds: new Set(['2']),
      generatedAt: '2026-08-30T00:00:00.000Z',
    });

    expect(report.label).toBe('candidates to evaluate and join manually — not automatic joins');
    expect(report.summary.total).toBe(3);
    expect(report.candidates.map((row: { advertiserId: string }) => row.advertiserId)).toEqual([
      '2',
      '3',
      '4',
    ]);
  });

  it('never fabricates a join URL, sector, or status when the API does not provide one', () => {
    const report = buildRecommendations({
      programmes,
      feedAdvertiserIds: new Set(),
      generatedAt: '2026-08-30T00:00:00.000Z',
    });
    const pending = report.candidates.find(
      (row: { advertiserId: string }) => row.advertiserId === '3',
    );
    expect(pending).toMatchObject({
      advertiserName: 'Pending Beauty Shop',
      primarySector: 'Health & Beauty',
      joinUrl: null,
      commissionStatus: null,
      validationStatus: null,
      productFeedAvailable: false,
    });
  });

  it('surfaces a join URL and feed availability only when the API supplies them', () => {
    const report = buildRecommendations({
      programmes,
      feedAdvertiserIds: new Set(['2']),
      generatedAt: '2026-08-30T00:00:00.000Z',
    });
    const notjoined = report.candidates.find(
      (row: { advertiserId: string }) => row.advertiserId === '2',
    );
    expect(notjoined).toMatchObject({
      advertiserName: 'Notjoined Fashion Shop',
      primarySector: 'Clothing',
      relationshipStatus: 'notjoined',
      joinUrl: 'https://ui.awin.com/programmes/2/join',
      productFeedAvailable: true,
      commissionStatus: '10% per sale',
      validationStatus: '30 days',
    });
  });

  it('sorts deterministically by sector, then name, then id', () => {
    const report = buildRecommendations({
      programmes,
      feedAdvertiserIds: new Set(),
      generatedAt: '2026-08-30T00:00:00.000Z',
    });
    expect(report.candidates.map((row: { primarySector: string }) => row.primarySector)).toEqual([
      'Clothing',
      'Health & Beauty',
      'Jewellery',
    ]);
  });

  it('renders durable CSV and Markdown labeled as manual-evaluation candidates', () => {
    const report = buildRecommendations({
      programmes,
      feedAdvertiserIds: new Set(['2']),
      generatedAt: '2026-08-30T00:00:00.000Z',
    });

    expect(formatCsv(report)).toContain(
      'advertiser_name,advertiser_id,primary_sector,country,relationship_status,join_url,product_feed_available,commission_status,validation_status',
    );
    const markdown = formatMarkdown(report);
    expect(markdown).toContain('candidates to evaluate and join manually');
    expect(markdown).toContain('not a match against the current merch catalog');
    expect(markdown).toContain('## Candidates');
  });

  it('keeps the execution lane manual, secret-bound, and artifact-only', () => {
    const workflow = readFileSync(
      '.github/workflows/merch-awin-directory-recommendations.yml',
      'utf8',
    );
    const collector = readFileSync('scripts/merch-engine/awin-directory-recommendations.mjs', 'utf8');

    expect(workflow).toMatch(/^on:\n\x20{2}workflow_dispatch:/m);
    expect(workflow).not.toMatch(/^\x20{2}(push|schedule):/m);
    expect(workflow).toContain("inputs.confirmation == 'RUN_AWIN_DIRECTORY_RECOMMENDATIONS'");
    expect(workflow).toContain('AWIN_API_TOKEN: ${{ secrets.AWIN_API_TOKEN }}');
    expect(workflow).toContain('AWIN_PUBLISHER_ID: ${{ secrets.AWIN_PUBLISHER_ID }}');
    expect(workflow).toContain('AWIN_FEED_API_KEY: ${{ secrets.AWIN_FEED_API_KEY }}');
    expect(workflow).toContain('npx tsx scripts/merch-engine/awin-directory-recommendations.mjs');
    expect(collector).toContain("'notjoined'");
    expect(collector).not.toMatch(/awtrack|awclick|clickref/i);
    expect(workflow).toContain('actions/upload-artifact');
    expect(workflow).toContain('merch-awin-directory-recommendations');
    expect(workflow).not.toMatch(/git (add|commit|push)|gh pr|supabase\/seed|social\//i);
  });
});
