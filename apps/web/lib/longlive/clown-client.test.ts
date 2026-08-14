import { afterEach, describe, expect, it, vi } from 'vitest';

import { askClown, CLOWN_MODEL, sanitizeTake, type ClownTurn } from './clown-client';
import { ClownUsage } from './clown-usage';
import type { ClownDoc } from './clown-index';

const FIXED_NOW = () => Date.parse('2026-08-13T10:00:00Z');

function usage(cap = 10) {
  return new ClownUsage(cap, FIXED_NOW);
}

const DOCS: ClownDoc[] = [
  {
    id: 'lore:masters-buyback',
    kind: 'lore',
    title: 'She bought her masters back',
    text: 'Announced 30 May 2025 that she now owns all of her masters outright.',
    date: '2025-05-30',
    recencyDate: '2025-05-30',
    open: false,
    // The real masters buyback is a settled, sourced fact, so 'confirmed' is the
    // honest label here. `status` is deliberately NOT derivable from `open` —
    // see clown-index.ts, where a debunked item is also `open: false`.
    status: 'confirmed',
    sources: [{ name: 'Billboard', url: 'https://example.com' }],
    eraId: null,
  },
];

function turns(text: string): ClownTurn[] {
  return [{ role: 'user', text }];
}

function toolBody(input: unknown) {
  return {
    ok: true,
    json: async () => ({ content: [{ type: 'tool_use', name: 'record_take', input }] }),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('sanitizeTake never trusts the model', () => {
  it('coerces a completely hostile payload into a safe shape', () => {
    const take = sanitizeTake({
      stance: { evil: true },
      argument: 12345,
      cited_ids: 'not-an-array',
      delulu: 'wig',
      theory_name: { nope: 1 },
      off_limits: 'yes',
    });
    expect(take.stance).toBe('');
    expect(take.argument).toBe('');
    expect(take.citedIds).toEqual([]);
    expect(take.delulu).toBe(3);
    expect(take.theoryName).toBeNull();
    // Only a literal true counts — a truthy string must not open the gate.
    expect(take.offLimits).toBe(false);
  });

  it('handles null and undefined input', () => {
    expect(sanitizeTake(null).stance).toBe('');
    expect(sanitizeTake(undefined).citedIds).toEqual([]);
  });

  it('caps the number of cited ids and drops non-strings', () => {
    const take = sanitizeTake({
      cited_ids: [...Array.from({ length: 40 }, (_, i) => `id-${i}`), 5, null, {}],
    });
    expect(take.citedIds.length).toBeLessThanOrEqual(8);
    expect(take.citedIds.every((id) => typeof id === 'string')).toBe(true);
  });

  it('truncates a runaway string rather than passing it through', () => {
    expect(sanitizeTake({ stance: 'x'.repeat(10_000) }).stance.length).toBeLessThanOrEqual(600);
  });

  it('reads off_limits only when literally true', () => {
    expect(sanitizeTake({ off_limits: true }).offLimits).toBe(true);
  });

  it('clamps an above-range delulu score down to 5', () => {
    expect(sanitizeTake({ delulu: 47 }).delulu).toBe(5);
  });

  it('clamps a below-range (negative) delulu score up to 0', () => {
    expect(sanitizeTake({ delulu: -2 }).delulu).toBe(0);
  });

  it('rounds a non-integer delulu score to the nearest integer', () => {
    expect(sanitizeTake({ delulu: 2.6 }).delulu).toBe(3);
  });
});

describe('degradation: returns null, never throws', () => {
  it('returns null with no API key and does not call fetch', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await askClown(usage(), turns('hi'), DOCS)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('kill switch: CLOWN_MODEL_DISABLED=1 stays inert, without spending', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubEnv('CLOWN_MODEL_DISABLED', '1');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const u = usage(10);
    expect(await askClown(u, turns('hi'), DOCS)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(u.used()).toBe(0);
  });

  it('returns null on a malformed transcript (empty) without spending', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const u = usage(10);
    expect(await askClown(u, [], DOCS)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(u.used()).toBe(0);
  });

  it('returns null when the transcript does not end on a user turn', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const bad: ClownTurn[] = [{ role: 'assistant', text: 'previously...' }];
    expect(await askClown(usage(), bad, DOCS)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns null once the daily cap is reached, without spending (over-cap case)', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    const fetchSpy = vi.fn(async () => toolBody({ stance: 's' }));
    vi.stubGlobal('fetch', fetchSpy);
    const u = usage(1);
    expect(await askClown(u, turns('a'), DOCS)).not.toBeNull();
    expect(await askClown(u, turns('b'), DOCS)).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('retries once then gives up, and both attempts share one reservation', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    const fetchSpy = vi.fn(async () => {
      throw new Error('boom');
    });
    vi.stubGlobal('fetch', fetchSpy);
    const u = usage(10);
    expect(await askClown(u, turns('hi'), DOCS)).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(u.used()).toBe(1);
  });

  it('recovers on the second attempt', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    let calls = 0;
    vi.stubGlobal('fetch', async () => {
      calls += 1;
      if (calls === 1) throw new Error('transient');
      return toolBody({ stance: 'second time lucky' });
    });
    const take = await askClown(usage(), turns('hi'), DOCS);
    expect(take?.stance).toBe('second time lucky');
  });

  it('returns null on a non-2xx response', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 500 }) as unknown as Response);
    expect(await askClown(usage(), turns('hi'), DOCS)).toBeNull();
  });

  it('returns null when the response carries no tool_use block', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubGlobal('fetch', async () =>
      ({ ok: true, json: async () => ({ content: [{ type: 'text', text: 'hi' }] }) }) as unknown as Response,
    );
    expect(await askClown(usage(), turns('hi'), DOCS)).toBeNull();
  });

  it('returns null on a request timeout, retried once, then gives up', async () => {
    vi.useFakeTimers();
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    const fetchSpy = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    vi.stubGlobal('fetch', fetchSpy);
    const promise = askClown(usage(), turns('hi'), DOCS);
    // Advance past REQUEST_TIMEOUT_MS twice over (one attempt + one retry).
    await vi.advanceTimersByTimeAsync(30_000);
    await expect(promise).resolves.toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe('the request shape', () => {
  it('matches Mood Chat\'s transport and forces the record_take tool', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    let captured: Record<string, unknown> = {};
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      captured = JSON.parse(String(init.body));
      return toolBody({ stance: 'ok' });
    });
    await askClown(usage(), turns('what about the masters'), DOCS);

    expect(captured.model).toBe(CLOWN_MODEL);
    expect(captured.tool_choice).toEqual({ type: 'tool', name: 'record_take' });
    expect(captured.thinking).toEqual({ type: 'disabled' });
    const system = captured.system as { cache_control?: unknown }[];
    expect(system[0].cache_control).toEqual({ type: 'ephemeral' });

    const lastMessage = (captured.messages as { content: string }[]).slice(-1)[0];
    expect(lastMessage.content).toContain('lore:masters-buyback');
    expect(lastMessage.content).toContain('what about the masters');
    // The whole corpus must never be shipped to the model.
    expect(lastMessage.content.length).toBeLessThan(4000);
  });

  it('tells the model honestly when there are no sources', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    let captured: Record<string, unknown> = {};
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      captured = JSON.parse(String(init.body));
      return toolBody({ stance: 'ok' });
    });
    await askClown(usage(), turns('obscure question'), []);
    const lastMessage = (captured.messages as { content: string }[]).slice(-1)[0];
    expect(lastMessage.content).toContain('(none');
  });

  it('carries multi-turn history, but only attaches sources to the LAST turn', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    let captured: Record<string, unknown> = {};
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      captured = JSON.parse(String(init.body));
      return toolBody({ stance: 'ok' });
    });
    const history: ClownTurn[] = [
      { role: 'user', text: 'first question' },
      { role: 'assistant', text: 'first answer' },
      { role: 'user', text: 'follow-up question' },
    ];
    await askClown(usage(), history, DOCS);
    const messages = captured.messages as { role: string; content: string }[];
    expect(messages).toHaveLength(3);
    expect(messages[0].content).toBe('first question');
    expect(messages[0].content).not.toContain('SOURCES AVAILABLE');
    expect(messages[2].content).toContain('SOURCES AVAILABLE');
    expect(messages[2].content).toContain('follow-up question');
  });

  it('caps the transcript to MAX_TRANSCRIPT_TURNS, keeping the most recent turns', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    let captured: Record<string, unknown> = {};
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      captured = JSON.parse(String(init.body));
      return toolBody({ stance: 'ok' });
    });
    const history: ClownTurn[] = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      text: `turn ${i}`,
    }));
    // Force the transcript to end on a user turn, as askClown requires.
    history.push({ role: 'user', text: 'final question' });
    await askClown(usage(), history, DOCS);
    const messages = captured.messages as { role: string; content: string }[];
    expect(messages.length).toBeLessThanOrEqual(6);
    expect(messages.slice(-1)[0].content).toContain('final question');
  });
});
