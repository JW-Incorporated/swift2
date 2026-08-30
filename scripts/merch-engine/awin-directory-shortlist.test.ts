import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  buildShortlist,
  formatCsv,
  formatMarkdown,
  requestProgrammes,
} from './awin-directory-shortlist.mjs';

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
    sectors: ['Clothing'],
  },
  {
    id: 2,
    name: 'Free People',
    displayUrl: 'https://freepeople.com',
    primaryRegion: { countryCode: 'US' },
    relationship: 'pending',
    sectors: ['Jewellery'],
  },
  {
    id: 3,
    name: 'Review Shop',
    displayUrl: 'https://different-host.com',
    primaryRegion: { countryCode: 'US' },
    relationship: 'notjoined',
    sectors: ['Health & Beauty'],
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
    sectors: ['Clothing'],
  },
];

describe('Awin directory shortlist', () => {
  it('TARGET_SECTORS matches real Awin API sector strings, not fabricated ones (regression for t_4562240d)', () => {
    const collector = readFileSync('scripts/merch-engine/awin-directory-shortlist.mjs', 'utf8');
    const match = collector.match(/const TARGET_SECTORS = (\[[^\]]*\]);/);
    expect(match, 'TARGET_SECTORS declaration must exist and be a simple array literal').toBeTruthy();
    // eslint-disable-next-line no-eval
    const targetSectors: string[] = eval(match![1]);

    // Sector strings actually observed from a live, unfiltered Awin Publisher API
    // directory probe for this account (t_a57b0362, 2026-08-30). Awin uses UK
    // English spelling. If Awin ever renames a sector, update this sample AND
    // TARGET_SECTORS together — never let TARGET_SECTORS drift back to invented
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
    // Guard against regressing to the old fabricated (US-spelling, slash-joined) strings.
    expect(targetSectors).not.toEqual(
      expect.arrayContaining(['Fashion/Clothing', 'Accessories/Jewelry', 'Beauty']),
    );
  });

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
    expect(report.manualReview[0]).toMatchObject({
      sourceField: 'name',
      sourceHostname: null,
      matchEvidence:
        'Awin programme name or domain shares a normalized key or suffix with retailer',
    });
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
          primarySector: 'Clothing',
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

  it('records the precise Awin field that supplied each matching signal', () => {
    const report = buildShortlist({
      catalogue: [
        { retailer: 'exact-source.com', item: 'Exact' },
        { retailer: 'us.suffix-source.com', item: 'Suffix' },
        { retailer: 'name-source.com', item: 'Name' },
      ],
      programmes: [
        {
          id: 10,
          name: 'Different Name',
          displayUrl: 'https://exact-source.com',
          primaryDomain: 'primary-source.com',
          validDomains: [{ domain: 'valid-source.com' }],
          domains: [{ domain: 'domain-source.com' }],
          primaryRegion: { countryCode: 'US' },
          primarySector: 'Clothing',
          relationship: 'notjoined',
        },
        {
          id: 11,
          name: 'Another Name',
          displayUrl: 'https://unrelated-source.com',
          primaryDomain: 'suffix-source.com',
          primaryRegion: { countryCode: 'US' },
          primarySector: 'Health & Beauty',
          relationship: 'notjoined',
        },
        {
          id: 12,
          name: 'Name Source',
          displayUrl: 'https://unrelated-name-source.com',
          primaryRegion: { countryCode: 'US' },
          primarySector: 'Jewellery',
          relationship: 'notjoined',
        },
      ],
      feedAdvertiserIds: new Set(),
      generatedAt: '2026-08-30T00:00:00.000Z',
    });

    expect(report.matches).toEqual([
      expect.objectContaining({
        currentRetailer: 'exact-source.com',
        sourceField: 'displayUrl',
        sourceHostname: 'exact-source.com',
      }),
      expect.objectContaining({
        currentRetailer: 'us.suffix-source.com',
        sourceField: 'primaryDomain',
        sourceHostname: 'suffix-source.com',
      }),
    ]);
    expect(report.manualReview).toEqual([
      expect.objectContaining({
        currentRetailer: 'name-source.com',
        sourceField: 'name',
        sourceHostname: null,
      }),
    ]);
  });

  it('renders durable CSV and Markdown with the requested provenance fields', () => {
    const report = buildShortlist({
      catalogue,
      programmes,
      feedAdvertiserIds: new Set(['1']),
      generatedAt: '2026-08-30T00:00:00.000Z',
    });

    expect(formatCsv(report)).toContain(
      'current_retailer,product_count,awin_advertiser_name,awin_advertiser_id,source_hostname,source_field,match_evidence,match_type,us_programme_status,product_feed_available',
    );
    expect(formatMarkdown(report)).toContain('## Exact hostname and domain-suffix matches');
    expect(formatMarkdown(report)).toContain('## Manual-review candidates');
    expect(formatMarkdown(report)).toContain('## Unmatched retailers');
    expect(formatMarkdown(report)).toContain('match evidence');
  });

  it('collects every Awin programme page', async () => {
    const calls: string[] = [];
    const fetchImpl = async (url: URL) => {
      calls.push(url.toString());
      const second = calls.length === 2;
      return {
        ok: true,
        json: async () => ({ programmes: [{ id: second ? 2 : 1 }] }),
        headers: {
          get: () => (second ? null : '<?page=2>; rel="next"'),
        },
      };
    };

    await expect(
      requestProgrammes({
        publisherId: '99',
        token: 'test-token',
        relationship: 'notjoined',
        fetchImpl,
      }),
    ).resolves.toEqual([
      { id: 1, relationship: 'notjoined' },
      { id: 2, relationship: 'notjoined' },
    ]);
    expect(calls).toHaveLength(2);
    expect(new URL(calls[1]).pathname).toBe('/publishers/99/programmes');
    expect(
      calls.every((url) => {
        const query = new URL(url).searchParams;
        return (
          query.get('accessToken') === 'test-token' &&
          query.get('countryCode') === 'US' &&
          query.get('relationship') === 'notjoined'
        );
      }),
    ).toBe(true);
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
