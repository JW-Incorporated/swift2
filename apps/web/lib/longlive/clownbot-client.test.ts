import { afterEach, describe, expect, it, vi } from 'vitest';

import { askClownbot, sanitizeTake } from './clownbot-client';
import { ClownbotUsage } from './clownbot-usage';
import type { Receipt } from './clownbot-receipts';

const FIXED_NOW = () => Date.parse('2026-08-11T10:00:00Z');

function usage(cap = 10) {
  return new ClownbotUsage(cap, FIXED_NOW);
}

const RECEIPTS: Receipt[] = [
  {
    id: 'lore:masters-buyback',
    kind: 'lore',
    date: '2025-05-30',
    dateLabel: '2025-05-30',
    title: 'She bought her masters back',
    detail: 'Announced 30 May 2025.',
    sources: [{ name: 'Billboard', url: 'https://example.com' }],
    status: 'confirmed',
    eraId: null,
  },
];

function toolBody(input: unknown) {
  return {
    ok: true,
    json: async () => ({ content: [{ type: 'tool_use', name: 'record_take', input }] }),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('sanitizeTake never trusts the model', () => {
  it('coerces a completely hostile payload into a safe shape', () => {
    const take = sanitizeTake({
      stance: { evil: true },
      argument: 12345,
      receipt_ids: 'not-an-array',
      delulu: 'wig',
      theory_name: { nope: 1 },
      off_limits: 'yes',
    });
    expect(take.stance).toBe('');
    expect(take.argument).toBe('');
    expect(take.receiptIds).toEqual([]);
    expect(take.delulu).toBe(3);
    expect(take.theoryName).toBeNull();
    // Only a literal true counts — a truthy string must not open the gate.
    expect(take.offLimits).toBe(false);
  });

  it('handles null and undefined input', () => {
    expect(sanitizeTake(null).stance).toBe('');
    expect(sanitizeTake(undefined).receiptIds).toEqual([]);
  });

  it('caps the number of cited ids and drops non-strings', () => {
    const take = sanitizeTake({
      receipt_ids: [...Array.from({ length: 40 }, (_, i) => `id-${i}`), 5, null, {}],
    });
    expect(take.receiptIds.length).toBeLessThanOrEqual(8);
    expect(take.receiptIds.every((id) => typeof id === 'string')).toBe(true);
  });

  it('truncates a runaway string rather than passing it through', () => {
    expect(sanitizeTake({ stance: 'x'.repeat(10_000) }).stance.length).toBeLessThanOrEqual(600);
  });

  it('reads off_limits only when literally true', () => {
    expect(sanitizeTake({ off_limits: true }).offLimits).toBe(true);
  });
});

describe('degradation: returns null, never throws', () => {
  it('returns null with no API key and does not call fetch', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await askClownbot(usage(), 'hi', RECEIPTS)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('INTERIM GUARD: a key WITHOUT CLOWNBOT_SAFETY_V2=on stays inert (no spend)', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    // flag deliberately unset — a key that shows up by accident must not
    // re-enable the model path before V2 is confirmed.
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const u = usage(10);
    expect(await askClownbot(u, 'hi', RECEIPTS)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(u.used()).toBe(0);
  });

  it('returns null once the cap is reached, without spending', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubEnv('CLOWNBOT_SAFETY_V2', 'on');
    const fetchSpy = vi.fn(async () => toolBody({ stance: 's' }));
    vi.stubGlobal('fetch', fetchSpy);
    const u = usage(1);
    expect(await askClownbot(u, 'a', RECEIPTS)).not.toBeNull();
    expect(await askClownbot(u, 'b', RECEIPTS)).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('retries once then gives up, and both attempts share one reservation', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubEnv('CLOWNBOT_SAFETY_V2', 'on');
    const fetchSpy = vi.fn(async () => {
      throw new Error('boom');
    });
    vi.stubGlobal('fetch', fetchSpy);
    const u = usage(10);
    expect(await askClownbot(u, 'hi', RECEIPTS)).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(u.used()).toBe(1);
  });

  it('recovers on the second attempt', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubEnv('CLOWNBOT_SAFETY_V2', 'on');
    let calls = 0;
    vi.stubGlobal('fetch', async () => {
      calls += 1;
      if (calls === 1) throw new Error('transient');
      return toolBody({ stance: 'second time lucky' });
    });
    const take = await askClownbot(usage(), 'hi', RECEIPTS);
    expect(take?.stance).toBe('second time lucky');
  });

  it('returns null on a non-2xx response', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubEnv('CLOWNBOT_SAFETY_V2', 'on');
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 500 }) as unknown as Response);
    expect(await askClownbot(usage(), 'hi', RECEIPTS)).toBeNull();
  });

  it('returns null when the response carries no tool_use block', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubEnv('CLOWNBOT_SAFETY_V2', 'on');
    vi.stubGlobal('fetch', async () =>
      ({ ok: true, json: async () => ({ content: [{ type: 'text', text: 'hi' }] }) }) as unknown as Response,
    );
    expect(await askClownbot(usage(), 'hi', RECEIPTS)).toBeNull();
  });
});

describe('the request shape', () => {
  it('forces the record_take tool and sends the receipts, not the vault', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubEnv('CLOWNBOT_SAFETY_V2', 'on');
    let captured: Record<string, unknown> = {};
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      captured = JSON.parse(String(init.body));
      return toolBody({ stance: 'ok' });
    });
    await askClownbot(usage(), 'what about the masters', RECEIPTS);

    expect(captured.model).toBe('claude-haiku-4-5');
    expect(captured.tool_choice).toEqual({ type: 'tool', name: 'record_take' });
    const content = String((captured.messages as { content: string }[])[0].content);
    expect(content).toContain('lore:masters-buyback');
    expect(content).toContain('what about the masters');
    // The whole corpus must never be shipped to the model.
    expect(content.length).toBeLessThan(4000);
  });

  it('tells the model honestly when there are no receipts', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubEnv('CLOWNBOT_SAFETY_V2', 'on');
    let captured: Record<string, unknown> = {};
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      captured = JSON.parse(String(init.body));
      return toolBody({ stance: 'ok' });
    });
    await askClownbot(usage(), 'obscure question', []);
    expect(String((captured.messages as { content: string }[])[0].content)).toContain('(none');
  });
});
