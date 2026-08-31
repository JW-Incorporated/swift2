import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  buildOfficialSyncPlan,
  catalogForCache,
  fetchOfficialProducts,
  currentFrom,
  normalizeOfficialProduct,
  outputForFetch,
} from './sync-official.mjs';

describe('E4 official-store sync', () => {
  it('normalizes verified Shopify facts into a direct official listing', () => {
    expect(
      normalizeOfficialProduct(
        {
          id: 101,
          title: 'The Tortured Poets Department Vinyl',
          handle: 'ttpd-vinyl',
          product_type: 'Vinyl',
          images: [{ src: 'https://cdn.shopify.com/vinyl.jpg' }],
          variants: [
            { title: 'Sold out', price: '34.99', available: false },
            { title: 'Standard', price: '31.99', available: true },
          ],
        },
        '2026-08-30T00:00:00.000Z',
      ),
    ).toEqual({
      sourceId: '101',
      brand: 'Taylor Swift Official',
      item: 'The Tortured Poets Department Vinyl',
      retailer: 'store.taylorswift.com',
      url: 'https://store.taylorswift.com/products/ttpd-vinyl',
      price: '$31.99',
      inStock: true,
      imageUrl: 'https://cdn.shopify.com/vinyl.jpg',
      kind: 'music',
      discoveredVia: 'shopify-sync',
      discoveredAt: '2026-08-30T00:00:00.000Z',
      verifiedAt: '2026-08-30T00:00:00.000Z',
    });
  });

  it('preserves only explicit Shopify collection membership for deterministic era attribution', () => {
    expect(
      normalizeOfficialProduct(
        {
          id: 102,
          title: 'Evermore Vinyl',
          handle: 'evermore-vinyl',
          variants: [],
          collectionHandles: ['evermore', '', 'evermore', 42],
        },
        '2026-08-30T00:00:00.000Z',
      ),
    ).toMatchObject({
      sourceId: '102',
      collectionHandles: ['evermore'],
    });
    expect(
      normalizeOfficialProduct(
        { id: 103, title: 'Unknown product', handle: 'unknown-product', variants: [] },
        '2026-08-30T00:00:00.000Z',
      ),
    ).not.toHaveProperty('collectionHandles');
  });

  it('retries Shopify throttling with Retry-After and spaces requests', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'retry-after': '2' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ products: [] }), { status: 200 }));
    const sleep = vi.fn(async () => undefined);

    await expect(fetchOfficialProducts({ fetchImpl, sleep })).resolves.toMatchObject({
      products: [],
      notModified: false,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it('enriches a successful catalog response with proven collection membership', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ products: [{ id: 1, title: 'Evermore Vinyl' }] }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ collections: [{ handle: 'evermore' }] }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ products: [{ id: 1 }] }), { status: 200 }),
      );

    await expect(
      fetchOfficialProducts({ fetchImpl, sleep: async () => undefined }),
    ).resolves.toMatchObject({
      source: 'catalog',
      products: [{ id: 1, collectionHandles: ['evermore'] }],
    });
  });

  it('treats a conditional response without cached membership evidence as changed', async () => {
    const fetchImpl = vi.fn(async () => ({
      status: 304,
      ok: false,
      headers: new Headers(),
    }));

    await expect(
      fetchOfficialProducts({ fetchImpl, cacheHeaders: { etag: '"catalog-v1"' } }),
    ).resolves.toMatchObject({
      products: [],
      notModified: false,
      membershipComplete: false,
      cacheHeaders: { etag: '"catalog-v1"', lastModified: null },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://store.taylorswift.com/products.json?limit=250&page=1',
      expect.objectContaining({
        headers: expect.objectContaining({ 'if-none-match': '"catalog-v1"' }),
      }),
    );
  });

  it('retains a pending change plan when the catalog is not modified', () => {
    const pendingPlan = {
      added: [{ sourceId: 'new-drop' }],
      updated: [],
      discontinued: [],
    };

    expect(
      outputForFetch(
        { products: [], notModified: true },
        { current: [], fetchedAt: 'now', pendingPlan },
      ),
    ).toMatchObject({ notModified: true, plan: pendingPlan });
  });

  it('keeps a 304 catalog not modified when its enriched collection membership matches the prior catalog', async () => {
    const cachedProduct = {
      id: 1,
      title: 'Evermore Vinyl',
      handle: 'evermore-vinyl',
      variants: [],
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ status: 304, ok: false, headers: new Headers() })
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ collections: [{ handle: 'evermore' }] }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ products: [{ id: 1 }] }), { status: 200 }),
      );

    await expect(
      fetchOfficialProducts({
        fetchImpl,
        sleep: async () => undefined,
        cache: {
          pages: {
            'https://store.taylorswift.com/products.json?limit=250&page=1': {
              etag: '"catalog-v1"',
              products: [cachedProduct],
            },
          },
          catalog: [
            normalizeOfficialProduct(
              { ...cachedProduct, collectionHandles: ['evermore'] },
              '2026-08-29T00:00:00.000Z',
            ),
          ],
        },
      }),
    ).resolves.toMatchObject({
      notModified: true,
      products: [{ id: 1, collectionHandles: ['evermore'] }],
    });
  });

  it('preserves prior membership when a 304 catalog has incomplete collection evidence', async () => {
    const cachedProduct = {
      id: 1,
      title: 'Evermore Vinyl',
      handle: 'evermore-vinyl',
      variants: [],
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ status: 304, ok: false, headers: new Headers() })
      .mockResolvedValueOnce(new Response(JSON.stringify({ collections: [] }), { status: 200 }));

    await expect(
      fetchOfficialProducts({
        fetchImpl,
        sleep: async () => undefined,
        cache: {
          pages: {
            'https://store.taylorswift.com/products.json?limit=250&page=1': {
              etag: '"catalog-v1"',
              products: [cachedProduct],
            },
          },
          catalog: [
            normalizeOfficialProduct(
              { ...cachedProduct, collectionHandles: ['evermore'] },
              '2026-08-29T00:00:00.000Z',
            ),
          ],
        },
      }),
    ).resolves.toMatchObject({
      notModified: false,
      membershipComplete: false,
      products: [{ id: 1, collectionHandles: ['evermore'] }],
    });
  });

  it('treats a complete collection-membership removal on a 304 catalog as an update', async () => {
    const cachedProduct = {
      id: 1,
      title: 'Evermore Vinyl',
      handle: 'evermore-vinyl',
      variants: [],
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ status: 304, ok: false, headers: new Headers() })
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ collections: [{ handle: 'evermore' }] }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ products: [] }), { status: 200 }));

    await expect(
      fetchOfficialProducts({
        fetchImpl,
        sleep: async () => undefined,
        cache: {
          pages: {
            'https://store.taylorswift.com/products.json?limit=250&page=1': {
              etag: '"catalog-v1"',
              products: [cachedProduct],
            },
          },
          catalog: [
            normalizeOfficialProduct(
              { ...cachedProduct, collectionHandles: ['evermore'] },
              '2026-08-29T00:00:00.000Z',
            ),
          ],
        },
      }),
    ).resolves.toMatchObject({
      notModified: false,
      membershipComplete: true,
      products: [{ id: 1 }],
    });
  });

  it('preserves verified membership and rejects new attribution when the collection index is unavailable', async () => {
    const prior = { id: 1, title: 'Evermore Vinyl', handle: 'evermore-vinyl', variants: [] };
    const cacheCatalog = [
      normalizeOfficialProduct(
        { ...prior, collectionHandles: ['evermore'] },
        '2026-08-29T00:00:00.000Z',
      ),
    ];
    const fetched = await fetchOfficialProducts({
      fetchImpl: vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              products: [prior, { id: 2, title: 'New drop', handle: 'new-drop', variants: [] }],
            }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(new Response('', { status: 503 })),
      sleep: async () => undefined,
      cache: { catalog: cacheCatalog },
    });

    expect(fetched).toMatchObject({
      membershipComplete: false,
      products: [{ id: 1, collectionHandles: ['evermore'] }, { id: 2 }],
    });
    expect(
      outputForFetch(fetched, {
        current: cacheCatalog,
        membershipCatalog: cacheCatalog,
        fetchedAt: '2026-08-30T00:00:00.000Z',
      }).plan,
    ).toEqual({
      added: [expect.objectContaining({ sourceId: '2' })],
      updated: [],
      discontinued: [],
    });
  });

  it('preserves verified membership when a collection page is unavailable', async () => {
    const prior = { id: 1, title: 'Evermore Vinyl', handle: 'evermore-vinyl', variants: [] };
    const cacheCatalog = [
      normalizeOfficialProduct(
        { ...prior, collectionHandles: ['evermore'] },
        '2026-08-29T00:00:00.000Z',
      ),
    ];

    await expect(
      fetchOfficialProducts({
        fetchImpl: vi
          .fn()
          .mockResolvedValueOnce(
            new Response(JSON.stringify({ products: [prior] }), { status: 200 }),
          )
          .mockResolvedValueOnce(
            new Response(JSON.stringify({ collections: [{ handle: 'evermore' }] }), {
              status: 200,
            }),
          )
          .mockResolvedValueOnce(new Response('', { status: 503 })),
        sleep: async () => undefined,
        cache: { catalog: cacheCatalog },
      }),
    ).resolves.toMatchObject({
      membershipComplete: false,
      products: [{ id: 1, collectionHandles: ['evermore'] }],
    });
  });

  it('splices a 304 page from its own cached listing without losing changed earlier pages', async () => {
    const pageOne = Array.from({ length: 250 }, (_, index) => ({ id: index + 1 }));
    const cachedPageTwo = [{ id: 'cached-page-two' }];
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ products: pageOne }), {
          status: 200,
          headers: { etag: '"page-one-new"' },
        }),
      )
      .mockResolvedValueOnce({ status: 304, ok: false, headers: new Headers() });

    await expect(
      fetchOfficialProducts({
        fetchImpl,
        cache: {
          pages: {
            'https://store.taylorswift.com/products.json?limit=250&page=1': {
              etag: '"page-one-old"',
              products: pageOne,
            },
            'https://store.taylorswift.com/products.json?limit=250&page=2': {
              etag: '"page-two"',
              products: cachedPageTwo,
            },
          },
        },
      }),
    ).resolves.toMatchObject({
      products: [...pageOne, ...cachedPageTwo],
      notModified: false,
      complete: true,
    });
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://store.taylorswift.com/products.json?limit=250&page=2',
      expect.objectContaining({
        headers: expect.objectContaining({ 'if-none-match': '"page-two"' }),
      }),
    );
  });

  it('falls back through collections when the catalog endpoint is unavailable', async () => {
    const firstPage = Array.from({ length: 250 }, (_, index) => ({
      id: index + 1,
      title: `Album ${index + 1}`,
    }));
    const secondPage = Array.from({ length: 120 }, (_, index) => ({
      id: index + 251,
      title: `Album ${index + 251}`,
    }));
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 403 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ collections: [{ handle: 'albums' }] }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ products: firstPage }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ products: secondPage }), { status: 200 }),
      );

    await expect(fetchOfficialProducts({ fetchImpl })).resolves.toMatchObject({
      products: [...firstPage, ...secondPage],
      source: 'collections',
      complete: false,
      degraded: true,
    });
    await expect(
      fetchOfficialProducts({
        fetchImpl: vi
          .fn()
          .mockResolvedValueOnce(new Response('', { status: 403 }))
          .mockResolvedValueOnce(
            new Response(JSON.stringify({ collections: [{ handle: 'evermore' }] }), {
              status: 200,
            }),
          )
          .mockResolvedValueOnce(
            new Response(JSON.stringify({ products: [{ id: 1, title: 'Evermore Vinyl' }] }), {
              status: 200,
            }),
          ),
        sleep: async () => undefined,
      }),
    ).resolves.toMatchObject({ products: [{ id: 1, collectionHandles: ['evermore'] }] });
    expect(fetchImpl).toHaveBeenLastCalledWith(
      'https://store.taylorswift.com/collections/albums/products.json?limit=250&page=2',
      expect.any(Object),
    );
  });

  it('loads a checked-in module catalog instead of an Actions cache baseline', async () => {
    await expect(currentFrom('supabase/seed/merch/official.mjs', [])).resolves.toEqual(
      expect.any(Array),
    );
    await expect(currentFrom('scripts/merch-engine/sync-official.mjs', [])).rejects.toThrow(
      'current catalog module must export an array',
    );
  });

  it('returns the fallback instead of throwing when a new .mjs catalog path does not exist yet', async () => {
    await expect(
      currentFrom('scripts/merch-engine/__fixtures__/does-not-exist.mjs', []),
    ).resolves.toEqual([]);
    const sentinel = [{ sourceId: 'seed' }];
    await expect(
      currentFrom('scripts/merch-engine/__fixtures__/does-not-exist.mjs', sentinel),
    ).resolves.toBe(sentinel);
  });

  it('crawls bounded sitemap product URLs when catalog and collections are unavailable', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 403 }))
      .mockResolvedValueOnce(new Response('', { status: 403 }))
      .mockResolvedValueOnce(
        new Response(
          '<sitemapindex><sitemap><loc>https://store.taylorswift.com/sitemap_products_1.xml</loc></sitemap></sitemapindex>',
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          '<urlset><url><loc>https://store.taylorswift.com/products/midnights-cd?utm_source=store&amp;ref=xml</loc></url></urlset>',
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 7,
            title: 'Midnights CD',
            handle: 'midnights-cd',
            variants: [{ price: 3499, available: true }],
          }),
          { status: 200 },
        ),
      );

    await expect(fetchOfficialProducts({ fetchImpl })).resolves.toMatchObject({
      products: [
        {
          id: 7,
          title: 'Midnights CD',
          handle: 'midnights-cd',
          variants: [{ price: 34.99, available: true }],
        },
      ],
      source: 'sitemap',
      complete: true,
      degraded: true,
    });
    expect(fetchImpl).toHaveBeenLastCalledWith(
      'https://store.taylorswift.com/products/midnights-cd.js?utm_source=store&ref=xml',
      expect.any(Object),
    );
  });

  it('does not discontinue listings after an incomplete fallback result', () => {
    const current = [
      {
        sourceId: 'still-published',
        inStock: true,
        discoveredAt: '2026-08-01T00:00:00.000Z',
      },
    ];

    expect(
      buildOfficialSyncPlan({
        products: [],
        current,
        fetchedAt: '2026-08-30T00:00:00.000Z',
        complete: false,
      }),
    ).toEqual({ added: [], updated: [], discontinued: [] });
  });

  it('keeps prior cached listings when a degraded fetch observes only a subset', () => {
    const current = [
      normalizeOfficialProduct(
        { id: 1, title: 'Existing', handle: 'existing', variants: [] },
        '2026-08-01T00:00:00.000Z',
      ),
      normalizeOfficialProduct(
        { id: 2, title: 'Unobserved', handle: 'unobserved', variants: [] },
        '2026-08-01T00:00:00.000Z',
      ),
    ];

    const catalog = catalogForCache({
      products: [{ id: 1, title: 'Existing', handle: 'existing', variants: [] }],
      current,
      fetchedAt: '2026-08-30T00:00:00.000Z',
      complete: false,
    });

    expect(catalog.map((product: { sourceId: string }) => product.sourceId)).toEqual(['1', '2']);
    expect(catalog[0]).toMatchObject({
      discoveredAt: '2026-08-01T00:00:00.000Z',
      verifiedAt: '2026-08-30T00:00:00.000Z',
    });
  });

  it('marks disappeared official products unavailable without deleting them', () => {
    const current = [
      {
        sourceId: 'old-drop',
        brand: 'Taylor Swift Official',
        item: 'Old drop',
        retailer: 'store.taylorswift.com',
        url: 'https://store.taylorswift.com/products/old-drop',
        inStock: true,
        discoveredVia: 'shopify-sync',
        discoveredAt: '2026-08-01T00:00:00.000Z',
        verifiedAt: '2026-08-01T00:00:00.000Z',
      },
    ];

    expect(
      buildOfficialSyncPlan({ products: [], current, fetchedAt: '2026-08-30T00:00:00.000Z' }),
    ).toEqual({
      added: [],
      updated: [],
      discontinued: [{ ...current[0], inStock: false, verifiedAt: '2026-08-30T00:00:00.000Z' }],
    });
  });

  it('does not report an unchanged listing as an update just because it was re-verified', () => {
    const product = {
      id: 101,
      title: 'The Tortured Poets Department Vinyl',
      handle: 'ttpd-vinyl',
      product_type: 'Vinyl',
      images: [{ src: 'https://cdn.shopify.com/vinyl.jpg' }],
      variants: [{ price: '31.99', available: true }],
    };
    const current = [normalizeOfficialProduct(product, '2026-08-29T00:00:00.000Z')];

    expect(
      buildOfficialSyncPlan({
        products: [product],
        current,
        fetchedAt: '2026-08-30T00:00:00.000Z',
      }),
    ).toEqual({ added: [], updated: [], discontinued: [] });
  });

  it('keeps the twice-daily detect job zero-LLM and detector-only', () => {
    const workflow = readFileSync('.github/workflows/merch-official-sync.yml', 'utf8');

    expect(workflow).toContain("cron: '17 8,20 * * *'");
    expect(workflow).toContain('sync-official.mjs --detect --write-plan official-sync-plan.json');
    expect(workflow).toContain('actions/upload-artifact@v6');
    // No model/paid-search calls anywhere in this workflow (detect OR the
    // deterministic `author` follow-on job) — authorOfficialCatalog() is a
    // pure function, so the authoring job legitimately writes the catalog
    // and pushes a gated PR branch (git push), unlike merch-matcher-
    // authoring.yml/merch-audit-authoring.yml, which spend against a model
    // or paid API and are therefore separate, manually-confirmed workflows
    // instead of a same-workflow follow-on job.
    expect(workflow).not.toMatch(/(ask-|openai|anthropic|gemini|social\/post-queue)/i);
  });
});
