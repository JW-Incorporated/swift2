import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClownDoc } from './clown-index';

const fixtures = vi.hoisted(() => {
  const CONFIRMED_DOC = {
    id: 'lore:masters-buyback',
    kind: 'lore',
    title: 'She bought her masters back',
    text: 'Announced 30 May 2025 that she now owns all of her masters outright.',
    date: '2025-05-30',
    recencyDate: '2025-05-30',
    open: false,
    status: 'confirmed',
    sources: [{ name: 'Billboard', url: 'https://example.com/masters' }],
    eraId: null,
  };
  return { CONFIRMED_DOC, DOCS: [CONFIRMED_DOC] };
});

const mockCreateKnowledgeClient = vi.fn();

vi.mock('@swift2/core', async () => {
  const actual = await vi.importActual<typeof import('@swift2/core')>('@swift2/core');
  return { ...actual, createKnowledgeClient: (...args: unknown[]) => mockCreateKnowledgeClient(...args) };
});

vi.mock('./clown-index', async () => {
  const actual = await vi.importActual<typeof import('./clown-index')>('./clown-index');
  return { ...actual, allClownDocs: () => fixtures.DOCS };
});

import {
  createKnowledgeClientForRequest,
  resolveScopeSignal,
  toolChatter,
  toolDateMath,
  toolPrecedents,
  toolRecent,
  toolSearch,
  toolSymbolActivity,
  toolTrack,
} from './clown-agent-tools';

const CONFIRMED_DOC = fixtures.CONFIRMED_DOC as unknown as ClownDoc;

/** ONE client per request (Fable 5.1 architecture review, task R14) — each
 * test builds it exactly once, the same way `route.ts` now does, and
 * threads it into every tool call it exercises. `null` when Supabase env
 * isn't stubbed, matching the "no DB configured" branch. */
function client() {
  return createKnowledgeClientForRequest();
}

beforeEach(() => {
  mockCreateKnowledgeClient.mockReset();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('toolSearch — DB-first, compile-time fallback ONLY on DB-unreachable', () => {
  it('no Supabase env configured: falls back to the compile-time corpus', async () => {
    const result = await toolSearch(client(), 'masters buyback');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(CONFIRMED_DOC.id);
    expect(result.summary).toContain('no-DB fallback');
    expect(mockCreateKnowledgeClient).not.toHaveBeenCalled();
  });

  it('DB configured and reachable: uses the DB result, even when empty (never padded from the fallback)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockCreateKnowledgeClient.mockReturnValue({ search: vi.fn().mockResolvedValue([]) });
    const result = await toolSearch(client(), 'masters buyback');
    expect(result.items).toHaveLength(0);
    expect(result.summary).not.toContain('no-DB fallback');
  });

  it('DB configured but the call throws: falls back to the compile-time corpus', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockCreateKnowledgeClient.mockReturnValue({ search: vi.fn().mockRejectedValue(new Error('network down')) });
    const result = await toolSearch(client(), 'masters buyback');
    expect(result.items).toHaveLength(1);
    expect(result.summary).toContain('no-DB fallback');
  });

  it('DB configured, returns a real row: maps status/sources correctly, including the "faded" degrade', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockCreateKnowledgeClient.mockReturnValue({
      search: vi.fn().mockResolvedValue([
        {
          id: 'current:abc',
          title: 'A live item',
          text: 'Some detail.',
          status: 'faded',
          date: undefined,
          recencyDate: '2026-08-01',
          sources: [{ name: 'Outlet', url: 'https://example.com', tier: 'established' }],
        },
      ]),
    });
    const result = await toolSearch(client(), 'anything');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe('rumor');
    expect(result.items[0].date).toBe('2026-08-01');
    expect(result.items[0].sources).toEqual([{ name: 'Outlet', url: 'https://example.com' }]);
  });
});

describe('the other six tools: DB-first, honest "no DB configured" / "DB unreachable" degrade (no compile-time substitute)', () => {
  it('precedents: no DB configured', async () => {
    const result = await toolPrecedents(client(), 'track-five');
    expect(result.items).toEqual([]);
    expect(result.summary).toContain('no DB configured');
  });

  it('precedents: DB reachable, groups by mechanism', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockCreateKnowledgeClient.mockReturnValue({
      precedents: vi.fn().mockResolvedValue([
        {
          mechanism: 'numerology',
          entries: [
            {
              id: 'egg:1',
              hintDate: '2026-01-01',
              revealDate: '2026-01-05',
              mechanism: 'numerology',
              symbols: ['track-five'],
              confirmed: true,
              outcome: 'confirmed',
              summary: 'Track five math confirmed again.',
              sources: [{ name: 'Genius', url: 'https://example.com', tier: 'fan' }],
            },
          ],
        },
      ]),
    });
    const result = await toolPrecedents(client(), 'track-five');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe('confirmed');
    expect(result.summary).toContain('numerology');
  });

  it('precedents: DB unreachable', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockCreateKnowledgeClient.mockReturnValue({ precedents: vi.fn().mockRejectedValue(new Error('down')) });
    const result = await toolPrecedents(client(), 'track-five');
    expect(result.items).toEqual([]);
    expect(result.summary).toContain('DB unreachable');
  });

  it('recent: no DB configured', async () => {
    const result = await toolRecent(client(), 7);
    expect(result.items).toEqual([]);
    expect(result.summary).toContain('no DB configured');
  });

  it('chatter: no DB configured', async () => {
    const result = await toolChatter(client(), 'orange era');
    expect(result.items).toEqual([]);
    expect(result.summary).toContain('no DB configured');
  });

  it('chatter: maps fan_signal rows to the weakest honest status', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockCreateKnowledgeClient.mockReturnValue({
      chatter: vi.fn().mockResolvedValue([
        {
          id: 'signal:1',
          windowStart: '2026-08-01T00:00:00Z',
          windowEnd: '2026-08-02T00:00:00Z',
          platform: 'bluesky',
          community: 'r/taylorswift',
          topic: 'orange era',
          summary: 'A popular thread speculating about the orange era.',
          volume: 40,
          heat: 5,
          stanceMix: {},
          symbols: ['orange'],
          theoryIds: [],
          currentItemIds: [],
          sampleUrls: ['https://example.com/post'],
        },
      ]),
    });
    const result = await toolChatter(client(), 'orange era');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe('rumor');
    expect(result.items[0].date).toBe('2026-08-02');
  });

  it('symbol_activity: no DB configured', async () => {
    const result = await toolSymbolActivity(client(), 'orange');
    expect(result.items).toEqual([]);
    expect(result.summary).toContain('no DB configured');
  });

  it('symbol_activity: never adds to the citable pool, only summarises', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockCreateKnowledgeClient.mockReturnValue({
      symbolActivity: vi.fn().mockResolvedValue([{ symbol: 'orange', week: '2026-08-03', n: 4 }]),
    });
    const result = await toolSymbolActivity(client(), 'orange');
    expect(result.items).toEqual([]);
    expect(result.summary).toContain('2026-08-03: 4');
  });

  it('track: no DB configured', async () => {
    const result = await toolTrack(client(), 'Fate of Ophelia');
    expect(result.items).toEqual([]);
    expect(result.summary).toContain('no DB configured');
  });

  it('track: DB reachable, no match', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockCreateKnowledgeClient.mockReturnValue({ track: vi.fn().mockResolvedValue(null) });
    const result = await toolTrack(client(), 'Not A Real Track');
    expect(result.items).toEqual([]);
    expect(result.summary).toContain('no track found');
  });
});

describe('date_math: pure, no DB needed at all', () => {
  it('resolves a known phrase regardless of Supabase env', async () => {
    const result = await toolDateMath('today');
    expect(result.items).toEqual([]);
    expect(result.summary).toContain('resolves to');
    expect(mockCreateKnowledgeClient).not.toHaveBeenCalled();
  });

  it('reports an unresolved phrase honestly rather than guessing', async () => {
    const result = await toolDateMath('sometime next decade');
    expect(result.summary).toContain('could not resolve');
  });
});

describe('resolveScopeSignal — two independent clauses, in scope if EITHER resolves', () => {
  it('in scope: DB search finds something', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockCreateKnowledgeClient.mockReturnValue({
      search: vi.fn().mockResolvedValue([
        {
          id: 'current:x',
          title: 'Something',
          text: 'Detail.',
          status: 'reported',
          sources: [],
        },
      ]),
    });
    const { inScope } = await resolveScopeSignal(client(), 'anything');
    expect(inScope).toBe(true);
  });

  it('in scope: DB search empty, but the compile-time corpus resolves a symbol/entity', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockCreateKnowledgeClient.mockReturnValue({ search: vi.fn().mockResolvedValue([]) });
    const { inScope, result } = await resolveScopeSignal(client(), 'tell me about the masters buyback');
    expect(inScope).toBe(true);
    expect(result.items[0].id).toBe(CONFIRMED_DOC.id);
  });

  it('out of scope: both the DB and the compile-time corpus come back empty', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockCreateKnowledgeClient.mockReturnValue({ search: vi.fn().mockResolvedValue([]) });
    const { inScope } = await resolveScopeSignal(client(), 'what is a good pasta recipe');
    expect(inScope).toBe(false);
  });

  describe('recency language never substitutes for a real topic match (Codex review MAJOR 6)', () => {
    const OPEN_UNRELATED_DOC = {
      id: 'rumor:open-unrelated',
      kind: 'rumor',
      title: 'An unrelated open rumor',
      text: 'A pending item with no connection to any specific query terms used in this test.',
      date: null,
      recencyDate: new Date().toISOString().slice(0, 10),
      open: true,
      status: 'rumor',
      sources: [],
      eraId: null,
    };

    // No Supabase env stubbed in this describe block, so `toolSearch` always
    // falls through to the no-DB compile-time corpus (`retrieveClownDocs`)
    // — exactly the path whose recency shortcut used to leak into scope
    // resolution.
    beforeEach(() => {
      fixtures.DOCS.push(OPEN_UNRELATED_DOC as unknown as (typeof fixtures.DOCS)[number]);
    });

    afterEach(() => {
      fixtures.DOCS.pop();
    });

    it('a recency-phrased, off-topic query stays out of scope even though an open item exists', async () => {
      const { inScope } = await resolveScopeSignal(client(), 'what should I cook today');
      expect(inScope).toBe(false);
    });

    it('the same recency phrasing DOES resolve in scope once it also names a real topic', async () => {
      const { inScope } = await resolveScopeSignal(client(), 'tell me about the masters buyback today');
      expect(inScope).toBe(true);
    });
  });
});
