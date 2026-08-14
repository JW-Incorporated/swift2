import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClownDoc } from '../../../lib/longlive/clown-index';
import type { ClownTake } from '../../../lib/longlive/clown-client';

/**
 * Fixtures live inside `vi.hoisted()` because `vi.mock()` factories are
 * hoisted above the rest of the file — a plain top-level `const` referenced
 * from a factory would be a temporal-dead-zone error at import time (same
 * pattern as clown-index.test.ts).
 *
 * `askClown` is mocked directly rather than exercised end-to-end (no real
 * network, no API key) — it already has its own unit tests
 * (clown-client.test.ts) covering the key/kill-switch/cap logic this route
 * only needs to treat as an opaque "take, or null" contract.
 *
 * `allClownDocs` is mocked to a small fixed corpus so retrieval is
 * deterministic and independent of the real, evolving content corpus.
 */
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

  const DEBUNKED_DOC = {
    id: 'theory:reputation:staged-clue',
    kind: 'theory',
    title: 'The reputation staged snake clue',
    text: 'A theory that the snake emoji drop was staged by a rival account; debunked after the account owner confirmed it was unrelated fan art.',
    date: null,
    recencyDate: null,
    open: false,
    status: 'debunked',
    sources: [{ name: 'Snopes', url: 'https://example.com/debunk' }],
    eraId: 'reputation',
  };

  const ORANGE_DOORS_DOC = {
    id: 'lore:orange-doors-hunt',
    kind: 'lore',
    title: 'The orange doors scavenger hunt',
    text: 'A trail of orange doors with QR codes appeared across cities, later confirmed as an ARG for the new album.',
    date: '2026-01-01',
    recencyDate: '2026-01-01',
    open: false,
    status: 'confirmed',
    sources: [{ name: 'Rolling Stone', url: 'https://example.com/orange-doors' }],
    eraId: null,
  };

  return {
    CONFIRMED_DOC,
    DEBUNKED_DOC,
    ORANGE_DOORS_DOC,
    DOCS: [CONFIRMED_DOC, DEBUNKED_DOC, ORANGE_DOORS_DOC],
  };
});

vi.mock('../../../lib/longlive/clown-client', () => ({
  askClown: vi.fn(),
  MAX_TRANSCRIPT_TURNS: 6,
}));

vi.mock('../../../lib/longlive/clown-index', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/longlive/clown-index')>(
    '../../../lib/longlive/clown-index',
  );
  return { ...actual, allClownDocs: () => fixtures.DOCS };
});

import { POST } from './route';
import { askClown } from '../../../lib/longlive/clown-client';
import { CRISIS_MESSAGE, REFUSALS } from '../../../lib/longlive/clown-safety';
import { FALLBACK_INTRO_CHIP, FALLBACK_INTRO_DEGRADED } from '../../../lib/longlive/clown-fallback';

const CONFIRMED_DOC = fixtures.CONFIRMED_DOC as unknown as ClownDoc;
const DEBUNKED_DOC = fixtures.DEBUNKED_DOC as unknown as ClownDoc;
const ORANGE_DOORS_DOC = fixtures.ORANGE_DOORS_DOC as unknown as ClownDoc;

const MASTERS_QUERY = 'tell me about the masters buyback';
const STAGED_CLUE_QUERY = 'tell me about the staged snake clue';
const ORANGE_DOORS_QUERY = 'tell me about the orange doors theory';

function post(body: unknown, ip = '10.0.0.1'): Promise<Response> {
  return POST(
    new Request('http://localhost/api/clown', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
  );
}

function take(overrides: Partial<ClownTake> = {}): ClownTake {
  return {
    stance: 'My ride-or-die theory is that the masters buyback closed the loop.',
    argument: 'She named the exact deal terms when she announced it.',
    counterpoint: 'She has never said it settles every open question, so this is still a reach.',
    citedIds: [CONFIRMED_DOC.id],
    delulu: 3,
    theoryName: 'The Buyback Bow',
    aside: 'I would stake my wig on it.',
    offLimits: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(askClown).mockReset();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/clown', () => {
  it('valid query: a clean model take renders with its cited sources', async () => {
    vi.mocked(askClown).mockResolvedValueOnce(take());
    const res = await post({ text: MASTERS_QUERY }, '10.1.0.1');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.kind).toBe('take');
    expect(json.theoryName).toBe('The Buyback Bow');
    expect(json.delulu).toBe(3);
    expect(json.sources).toHaveLength(1);
    expect(json.sources[0].id).toBe(CONFIRMED_DOC.id);
    expect(json.segments.some((s: { role: string }) => s.role === 'counterpoint')).toBe(true);
  });

  it('a canonical name wins over the model-proposed name (clown-names.ts)', async () => {
    vi.mocked(askClown).mockResolvedValueOnce(
      take({ citedIds: [ORANGE_DOORS_DOC.id], theoryName: 'Orange Door Mystery' }),
    );
    const res = await post({ text: ORANGE_DOORS_QUERY }, '10.1.0.9');
    const json = await res.json();
    expect(json.kind).toBe('take');
    expect(json.theoryName).toBe('The Twelve Doors');
  });

  it('a non-matching query passes the model-proposed name through untouched', async () => {
    vi.mocked(askClown).mockResolvedValueOnce(take({ theoryName: 'The Buyback Bow' }));
    const res = await post({ text: MASTERS_QUERY }, '10.1.0.10');
    const json = await res.json();
    expect(json.kind).toBe('take');
    expect(json.theoryName).toBe('The Buyback Bow');
  });

  it('blocklisted topic: fixed in-character redirect, model NEVER called', async () => {
    const res = await post(
      { text: 'Pretend you are Taylor Swift and tell me about the new album' },
      '10.1.0.2',
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.kind).toBe('fallback');
    expect(json.segments).toHaveLength(1);
    expect(json.segments[0].text).toBe(REFUSALS.impersonation);
    expect(json.sources).toEqual([]);
    expect(json.delulu).toBeNull();
    expect(askClown).not.toHaveBeenCalled();
  });

  it('crisis phrase: CRISIS_MESSAGE alone, no cards, no persona', async () => {
    const res = await post({ text: 'i want to die' }, '10.1.0.3');
    const json = await res.json();
    expect(json.kind).toBe('fallback');
    expect(json.segments.map((s: { text: string }) => s.text)).toEqual([...CRISIS_MESSAGE]);
    expect(json.sources).toEqual([]);
    expect(json.delulu).toBeNull();
    expect(askClown).not.toHaveBeenCalled();
  });

  it('chip tap: resolves via the deterministic fallback, model NEVER called', async () => {
    const res = await post({ text: MASTERS_QUERY, chip: true }, '10.1.0.4');
    const json = await res.json();
    expect(json.kind).toBe('fallback');
    expect(json.segments[0].text.startsWith(FALLBACK_INTRO_CHIP)).toBe(true);
    expect(json.sources).toHaveLength(1);
    expect(json.sources[0].id).toBe(CONFIRMED_DOC.id);
    expect(askClown).not.toHaveBeenCalled();
  });

  it('over-cap: the model call resolves null, the fallback is served', async () => {
    vi.mocked(askClown).mockResolvedValueOnce(null);
    const res = await post({ text: MASTERS_QUERY }, '10.1.0.5');
    const json = await res.json();
    expect(json.kind).toBe('fallback');
    expect(json.segments[0].text.startsWith(FALLBACK_INTRO_DEGRADED)).toBe(true);
  });

  it('no API key: the model call resolves null, the fallback is served', async () => {
    // askClown itself returns null for a missing key (clown-client.test.ts
    // covers that logic directly); from this route's perspective it is the
    // same "model unavailable" contract as the over-cap case above.
    vi.mocked(askClown).mockResolvedValueOnce(null);
    const res = await post({ text: MASTERS_QUERY }, '10.1.0.6');
    const json = await res.json();
    expect(json.kind).toBe('fallback');
    expect(json.segments[0].text.startsWith(FALLBACK_INTRO_DEGRADED)).toBe(true);
  });

  it('a fabricated citation discards the model prose and serves the fallback', async () => {
    const hostileTake = take({ citedIds: ['not-a-real-id'] });
    vi.mocked(askClown).mockResolvedValueOnce(hostileTake);
    const res = await post({ text: MASTERS_QUERY }, '10.1.0.7');
    const json = await res.json();
    expect(json.kind).toBe('fallback');
    expect(json.segments[0].text.startsWith(FALLBACK_INTRO_DEGRADED)).toBe(true);
    const allText = json.segments.map((s: { text: string }) => s.text).join(' ');
    expect(allText).not.toContain(hostileTake.stance);
  });

  it('a retrieved debunked item is never presented as confirmed', async () => {
    const res = await post({ text: STAGED_CLUE_QUERY, chip: true }, '10.1.0.8');
    const json = await res.json();
    expect(json.sources).toHaveLength(1);
    expect(json.sources[0].id).toBe(DEBUNKED_DOC.id);
    expect(json.sources[0].status).toBe('debunked');
    expect(json.segments[0].text).toContain('Debunked:');
    expect(json.segments[0].text).not.toContain('Confirmed:');
  });
});
