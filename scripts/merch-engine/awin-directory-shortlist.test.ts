import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { buildShortlist, formatCsv, formatMarkdown } from './awin-directory-shortlist.mjs';

const catalogue = [
  { retailer: 'exact-shop.com', item: 'Exact dress' },
  { retailer: 'exact-shop.com', item: 'Exact skirt' },
  { retailer: 'free-people.com', item: 'Manual-review top' },
  { retailer: 'us.suffix-shop.com', item: 'Suffix dress' },
  { retailer: 'review-shop.com', item: 'Review bag' },
  { retailer: 'unmatched-shop.com', item: 'Unmatched shoes' },
];

const programmes = [
  {
    id: 1,
    name: 'Exact Shop',
    displayUrl: 'https://www.exact-shop.com',
    validDomains: [{ domain: 'exact-shop.com' }],
    primaryRegion: { countryCode: 'US' },
    relationship: 'joined',
    sectors: ['Fashion/Clothing'],
  },
  {
    id: 2,
    name: 'Free People',
    displayUrl: 'https://freepeople.com',
    primaryRegion: { countryCode: 'US' },
    relationship: 'pending',
    sectors: ['Accessories/Jewelry'],
  },
  {
    id: 3,
    name: 'Review Shop',
    displayUrl: 'https://different-host.com',
    primaryRegion: { countryCode: 'US' },
    relationship: 'notjoined',
    sectors: ['Beauty'],
  },
  {
    id: 4,
    name: 'Outside sector',
    displayUrl: 'https://unmatched-shop.com',
    primaryRegion: { countryCode: 'US' },
    relationship: 'joined',
    sectors: ['Home'],
  },
  {
    id: 6,
    name: 'Suffix Shop',
    validDomains: [{ domain: 'suffix-shop.com' }],
    primaryRegion: { countryCode: 'US' },
    relationship: 'joined',
    sectors: ['Fashion/Clothing'],
  },
];

describe('Awin directory shortlist', () => {
  it('ranks exact matches before unique domain-suffix matches, then keeps weaker signals for review', () => {
    const report = buildShortlist({
      catalogue,
      programmes,
      feedAdvertiserIds: new Set(['1', '3']),
      generatedAt: '2026-08-30T00:00:00.000Z',
    });

    expect(report.summary).toEqual({ exact: 1, domainSuffix: 1, manualReview: 2, unmatched: 1 });
    expect(
      report.matches.map(
        (row: {
          currentRetailer: string;
          matchType: string;
          productCount: number;
          feedAvailable: boolean;
        }) => [row.currentRetailer, row.matchType, row.productCount, row.feedAvailable],
      ),
    ).toEqual([
      ['exact-shop.com', 'exact-hostname', 2, true],
      ['us.suffix-shop.com', 'domain-suffix', 1, false],
    ]);
    expect(report.manualReview).toEqual([
      expect.objectContaining({
        currentRetailer: 'free-people.com',
        awinAdvertiserId: '2',
        matchType: 'manual-review',
        feedAvailable: false,
      }),
      expect.objectContaining({
        currentRetailer: 'review-shop.com',
        awinAdvertiserId: '3',
        matchType: 'manual-review',
        feedAvailable: true,
      }),
    ]);
    expect(report.unmatched).toEqual([
      expect.objectContaining({
        currentRetailer: 'unmatched-shop.com',
        productCount: 1,
        matchType: 'unmatched',
      }),
    ]);
  });

  it('admits the documented Awin programme shape when primarySector is a target sector', () => {
    const report = buildShortlist({
      catalogue: [{ retailer: 'live-shape-shop.com', item: 'Dress' }],
      programmes: [
        {
          id: 42,
          name: 'Live Shape Shop',
          displayUrl: 'https://www.live-shape-shop.com',
          primaryRegion: { countryCode: 'US' },
          primarySector: 'Fashion/Clothing',
          relationship: 'joined',
        },
      ],
      feedAdvertiserIds: new Set(['42']),
      generatedAt: '2026-08-30T00:00:00.000Z',
    });

    expect(report.summary).toEqual({ exact: 1, domainSuffix: 0, manualReview: 0, unmatched: 0 });
    expect(report.matches).toEqual([
      expect.objectContaining({
        currentRetailer: 'live-shape-shop.com',
        awinAdvertiserId: '42',
        sourceHostname: 'live-shape-shop.com',
        matchType: 'exact-hostname',
        usProgrammeStatus: 'joined',
        feedAvailable: true,
      }),
    ]);
  });

  it('does not invent a domain-suffix match when multiple eligible advertisers share the same suffix', () => {
    const report = buildShortlist({
      catalogue: [{ retailer: 'shop.brand.com', item: 'Top' }],
      programmes: [
        { ...programmes[1], id: 2, name: 'Brand', displayUrl: 'https://brand.com' },
        { ...programmes[1], id: 5, name: 'Brand Shop', displayUrl: 'https://sub.shop.brand.com' },
      ],
      feedAdvertiserIds: new Set(),
      generatedAt: '2026-08-30T00:00:00.000Z',
    });

    expect(report.matches).toHaveLength(0);
    expect(
      report.manualReview.map((row: { awinAdvertiserId: string }) => row.awinAdvertiserId),
    ).toEqual(['2', '5']);
  });

  it('does not treat cross-TLD or prefix-adjacent domains as automatic matches', () => {
    const report = buildShortlist({
      catalogue: [
        { retailer: 'brand.com', item: 'Top' },
        { retailer: 'notbrand.com', item: 'Bag' },
      ],
      programmes: [{ ...programmes[1], id: 7, name: 'Brand', displayUrl: 'https://brand.co' }],
      feedAdvertiserIds: new Set(),
      generatedAt: '2026-08-30T00:00:00.000Z',
    });

    expect(report.matches).toHaveLength(0);
    expect(
      report.manualReview.map((row: { currentRetailer: string }) => row.currentRetailer),
    ).toEqual(['brand.com']);
    expect(report.unmatched.map((row: { currentRetailer: string }) => row.currentRetailer)).toEqual(
      ['notbrand.com'],
    );
  });

  it('renders durable CSV and Markdown with the requested provenance fields', () => {
    const report = buildShortlist({
      catalogue,
      programmes,
      feedAdvertiserIds: new Set(['1']),
      generatedAt: '2026-08-30T00:00:00.000Z',
    });

    expect(formatCsv(report)).toContain(
      'current_retailer,product_count,awin_advertiser_name,awin_advertiser_id,source_hostname,match_type,us_programme_status,product_feed_available',
    );
    expect(formatMarkdown(report)).toContain('## Exact hostname and domain-suffix matches');
    expect(formatMarkdown(report)).toContain('## Manual-review candidates');
    expect(formatMarkdown(report)).toContain('## Unmatched retailers');
  });

  it('keeps the execution lane manual, secret-bound, and artifact-only', () => {
    const workflow = readFileSync('.github/workflows/merch-awin-directory-shortlist.yml', 'utf8');
    const collector = readFileSync('scripts/merch-engine/awin-directory-shortlist.mjs', 'utf8');

    expect(workflow).toMatch(/^on:\n\x20{2}workflow_dispatch:/m);
    expect(workflow).not.toMatch(/^\x20{2}(push|schedule):/m);
    expect(workflow).toContain("inputs.confirmation == 'RUN_AWIN_DIRECTORY_SHORTLIST'");
    expect(workflow).toContain('AWIN_API_TOKEN: ${{ secrets.AWIN_API_TOKEN }}');
    expect(workflow).toContain('AWIN_PUBLISHER_ID: ${{ secrets.AWIN_PUBLISHER_ID }}');
    expect(workflow).toContain('AWIN_FEED_API_KEY: ${{ secrets.AWIN_FEED_API_KEY }}');
    expect(workflow).toContain('npx tsx scripts/merch-engine/awin-directory-shortlist.mjs');
    expect(collector).toContain("'notjoined'");
    expect(workflow).toContain('actions/upload-artifact');
    expect(workflow).toContain('merch-awin-directory-shortlist');
    expect(workflow).not.toMatch(/git (add|commit|push)|gh pr|supabase\/seed|social\//i);
  });
});
