import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  loadBackfillCandidates,
  runBackfill,
  type BackfillCandidateRow,
} from './backfill';

function baseItem(overrides: Partial<BackfillCandidateRow> = {}): BackfillCandidateRow {
  return {
    id: 'item-1',
    headline: 'New single announced',
    summary: 'Taylor was seen.',
    detail: 'Short.',
    image_url: null,
    sources: [{ name: 'Billboard', url: 'https://www.billboard.com/x', tier: 'established' }],
    era_id: 'tloas',
    ...overrides,
  };
}

function selectChain(data: unknown) {
  const chain: Record<string, unknown> = {
    then: (resolve: (value: { data: unknown; error: null }) => void) => (
      resolve({ data, error: null })
    ),
  };
  for (const method of ['select', 'is', 'gt', 'order', 'limit']) chain[method] = () => chain;
  return chain;
}

afterEach(() => vi.unstubAllEnvs());

describe('loadBackfillCandidates', () => {
  it('queries non-promoted current item rows', async () => {
    const calls: { method: string; args: unknown[] }[] = [];
    const chain = selectChain([{ id: 'ci-1' }]);
    for (const method of ['select', 'is', 'gt', 'order', 'limit']) {
      chain[method] = (...args: unknown[]) => {
        calls.push({ method, args });
        return chain;
      };
    }
    const db = { from: vi.fn(() => chain) } as unknown as Parameters<
      typeof loadBackfillCandidates
    >[0];
    await expect(loadBackfillCandidates(db)).resolves.toEqual([{ id: 'ci-1' }]);
    expect(calls.some((call) => (
      call.method === 'is' && call.args[0] === 'promoted_to'
    ))).toBe(true);
  });
});

describe('runBackfill', () => {
  it('never writes during a dry run', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', '');
    const items = [
      baseItem({ id: 'a' }),
      baseItem({ id: 'b', image_url: 'https://www.billboard.com/ok.jpg' }),
    ];
    const update = vi.fn();
    const chain = selectChain(items);
    const db = {
      from: vi.fn(() => ({ ...chain, update })),
      rpc: vi.fn(() => ({
        then: (resolve: (value: { data: null; error: null }) => void) => (
          resolve({ data: null, error: null })
        ),
      })),
    } as unknown as Parameters<typeof runBackfill>[0];
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    const result = await runBackfill(db, {
      dryRun: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toMatchObject({ considered: 2, wroteBack: 0 });
    expect(update).not.toHaveBeenCalled();
  });

  it('writes resolved fields during a live run', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', '');
    const writes: unknown[] = [];
    const chain = selectChain([baseItem({ id: 'a' })]);
    const db = {
      from: vi.fn(() => ({
        ...chain,
        update: (row: unknown) => ({
          eq: () => {
            writes.push(row);
            return Promise.resolve({ error: null });
          },
        }),
      })),
      rpc: vi.fn(() => ({
        then: (resolve: (value: { data: null; error: null }) => void) => (
          resolve({ data: null, error: null })
        ),
      })),
    } as unknown as Parameters<typeof runBackfill>[0];
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    const result = await runBackfill(db, {
      dryRun: false,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result.wroteBack).toBe(1);
    expect(writes).toHaveLength(1);
  });
});
