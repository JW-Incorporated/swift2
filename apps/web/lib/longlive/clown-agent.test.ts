import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ClownUsage } from './clown-usage';
import type { ClownTurn } from './clown-client';
import type { InvestigationStep } from './clown-answer';
import type { ToolCallResult } from './clown-agent-tools';

vi.mock('./clown-agent-tools', () => ({
  toolSearch: vi.fn(),
  toolPrecedents: vi.fn(),
  toolRecent: vi.fn(),
  toolChatter: vi.fn(),
  toolSymbolActivity: vi.fn(),
  toolTrack: vi.fn(),
  toolDateMath: vi.fn(),
}));

import { AGENT_MAX_TOOL_CALLS, AGENT_MAX_TOKENS, AGENT_MAX_WALL_MS, runClownAgent } from './clown-agent';
import { toolPrecedents } from './clown-agent-tools';

const FIXED_NOW = () => Date.parse('2026-08-24T10:00:00Z');

function usage(cap = 10) {
  return new ClownUsage(cap, FIXED_NOW);
}

function turns(text: string): ClownTurn[] {
  return [{ role: 'user', text }];
}

const EMPTY_SEED: ToolCallResult = { items: [], summary: 'no results for "x"' };

function toolUseResponse(
  blocks: { id: string; name: string; input: unknown }[],
  usage_ = { input_tokens: 100, output_tokens: 50 },
) {
  return {
    ok: true,
    json: async () => ({ content: blocks.map((b) => ({ type: 'tool_use', ...b })), usage: usage_ }),
  } as unknown as Response;
}

function takeBlock(input: Record<string, unknown> = {}) {
  return { id: 'take-1', name: 'record_take', input: { stance: 's', argument: 'a', counterpoint: 'c', cited_ids: [], ...input } };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.mocked(toolPrecedents).mockReset();
});

beforeEach(() => {
  vi.mocked(toolPrecedents).mockReset();
});

describe('degradation: returns a null take, never throws', () => {
  it('no API key: degrades immediately, seed step still recorded', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const result = await runClownAgent(usage(), turns('hi'), EMPTY_SEED, { query: 'x' });
    expect(result.take).toBeNull();
    expect(result.investigation).toEqual([{ tool: 'search', input: { query: 'x' }, summary: EMPTY_SEED.summary }]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('kill switch: CLOWN_MODEL_DISABLED=1 stays inert, without spending', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubEnv('CLOWN_MODEL_DISABLED', '1');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const u = usage(10);
    const result = await runClownAgent(u, turns('hi'), EMPTY_SEED, { query: 'x' });
    expect(result.take).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(u.used()).toBe(0);
  });

  it('malformed transcript (empty): degrades without spending', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const result = await runClownAgent(usage(), [], EMPTY_SEED, { query: 'x' });
    expect(result.take).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('over the daily cap: degrades without spending', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const u = usage(0);
    const result = await runClownAgent(u, turns('hi'), EMPTY_SEED, { query: 'x' });
    expect(result.take).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('every attempt fails: retries once then degrades', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    const fetchSpy = vi.fn(async () => {
      throw new Error('boom');
    });
    vi.stubGlobal('fetch', fetchSpy);
    const result = await runClownAgent(usage(), turns('hi'), EMPTY_SEED, { query: 'x' });
    expect(result.take).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe('the model commits immediately', () => {
  it('record_take on the very first call: no read tools dispatched', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubGlobal('fetch', vi.fn(async () => toolUseResponse([takeBlock({ stance: 'quick take' })])));
    const result = await runClownAgent(usage(), turns('hi'), EMPTY_SEED, { query: 'x' });
    expect(result.take?.stance).toBe('quick take');
    expect(result.investigation).toHaveLength(1); // just the seed
    expect(toolPrecedents).not.toHaveBeenCalled();
  });
});

describe('read tools dispatch and feed the investigation trail + pool', () => {
  it('one precedents call, then record_take: pool and trail both reflect it', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    const item = { id: 'egg:1', headline: 'h', detail: 'd', status: 'confirmed' as const, date: '2026-01-01', sources: [] };
    vi.mocked(toolPrecedents).mockResolvedValue({ items: [item], summary: '1 precedent for "track-five"' });

    let call = 0;
    vi.stubGlobal('fetch', vi.fn(async () => {
      call += 1;
      if (call === 1) return toolUseResponse([{ id: 't1', name: 'precedents', input: { symbol: 'track-five' } }]);
      return toolUseResponse([takeBlock({ cited_ids: ['egg:1'] })]);
    }));

    const onStep = vi.fn();
    const result = await runClownAgent(usage(), turns('hi'), EMPTY_SEED, { query: 'x' }, onStep);
    expect(result.take?.citedIds).toEqual(['egg:1']);
    expect(result.pool.get('egg:1')).toEqual(item);
    expect(result.investigation.map((s) => s.tool)).toEqual(['search', 'precedents']);
    expect(onStep).toHaveBeenCalledTimes(2);
    expect(toolPrecedents).toHaveBeenCalledWith('track-five');
  });

  it('multiple tool_use blocks in one turn are all dispatched and each counts toward the budget', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.mocked(toolPrecedents).mockResolvedValue({ items: [], summary: 'no precedents' });

    let call = 0;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      call += 1;
      if (call === 1) {
        return toolUseResponse([
          { id: 't1', name: 'precedents', input: { symbol: 'a' } },
          { id: 't2', name: 'precedents', input: { symbol: 'b' } },
        ]);
      }
      const body = JSON.parse(String(init.body));
      // Third call must be forced: two read calls already burned toward the
      // model's OWN choice, but the take is forced by an explicit
      // `tool_choice` this test does not set up caps for — assert auto here.
      expect(body.tool_choice).toEqual({ type: 'auto' });
      return toolUseResponse([takeBlock()]);
    }));

    const result = await runClownAgent(usage(), turns('hi'), EMPTY_SEED, { query: 'x' });
    expect(result.investigation.map((s) => s.tool)).toEqual(['search', 'precedents', 'precedents']);
    expect(toolPrecedents).toHaveBeenCalledTimes(2);
  });

  it('an unrecognised tool name is reported honestly and still counts toward the budget', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    let call = 0;
    vi.stubGlobal('fetch', vi.fn(async () => {
      call += 1;
      if (call === 1) return toolUseResponse([{ id: 't1', name: 'not_a_real_tool', input: {} }]);
      return toolUseResponse([takeBlock()]);
    }));
    const result = await runClownAgent(usage(), turns('hi'), EMPTY_SEED, { query: 'x' });
    expect(result.investigation[1]).toEqual({ tool: 'not_a_real_tool', input: {}, summary: 'call failed — bad input' });
  });
});

describe('HARD CAPS — enforced in control flow, not prompt-only', () => {
  it(`tool-call cap: the (${AGENT_MAX_TOOL_CALLS + 1})th call is forced to record_take`, async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.mocked(toolPrecedents).mockResolvedValue({ items: [], summary: 'no precedents' });

    let call = 0;
    const captured: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      call += 1;
      const body = JSON.parse(String(init.body));
      captured.push(body);
      if (call <= AGENT_MAX_TOOL_CALLS) {
        return toolUseResponse([{ id: `t${call}`, name: 'precedents', input: { symbol: `s${call}` } }]);
      }
      return toolUseResponse([takeBlock()]);
    }));

    const result = await runClownAgent(usage(), turns('hi'), EMPTY_SEED, { query: 'x' });
    expect(toolPrecedents).toHaveBeenCalledTimes(AGENT_MAX_TOOL_CALLS);
    expect(result.take).not.toBeNull();
    // The call immediately after the cap is reached must be forced.
    const forcedCallBody = captured[AGENT_MAX_TOOL_CALLS];
    expect(forcedCallBody.tool_choice).toEqual({ type: 'tool', name: 'record_take' });
  });

  it('token budget cap: cumulative usage across calls forces the next call to record_take', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.mocked(toolPrecedents).mockResolvedValue({ items: [], summary: 'no precedents' });

    let call = 0;
    const captured: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      call += 1;
      const body = JSON.parse(String(init.body));
      captured.push(body);
      if (call === 1) {
        // Single call already exceeds the whole budget.
        return toolUseResponse(
          [{ id: 't1', name: 'precedents', input: { symbol: 'a' } }],
          { input_tokens: AGENT_MAX_TOKENS, output_tokens: 10 },
        );
      }
      return toolUseResponse([takeBlock()]);
    }));

    await runClownAgent(usage(), turns('hi'), EMPTY_SEED, { query: 'x' });
    expect(captured[1].tool_choice).toEqual({ type: 'tool', name: 'record_take' });
  });

  it('wall-clock cap: an injected clock past the ceiling forces the next call to record_take', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.mocked(toolPrecedents).mockResolvedValue({ items: [], summary: 'no precedents' });

    let call = 0;
    const captured: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      call += 1;
      captured.push(JSON.parse(String(init.body)));
      if (call === 1) return toolUseResponse([{ id: 't1', name: 'precedents', input: { symbol: 'a' } }]);
      return toolUseResponse([takeBlock()]);
    }));

    let now = 0;
    const clock = () => {
      const t = now;
      now += AGENT_MAX_WALL_MS; // every read jumps past the ceiling after the first
      return t;
    };
    await runClownAgent(usage(), turns('hi'), EMPTY_SEED, { query: 'x' }, undefined, clock);
    expect(captured[1].tool_choice).toEqual({ type: 'tool', name: 'record_take' });
  });
});

describe('onStep fires progressively, including the seed', () => {
  it('emits the seed step synchronously, before any network call', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const steps: InvestigationStep[] = [];
    await runClownAgent(usage(), turns('hi'), EMPTY_SEED, { query: 'x' }, (s) => steps.push(s));
    expect(steps).toEqual([{ tool: 'search', input: { query: 'x' }, summary: EMPTY_SEED.summary }]);
  });
});
