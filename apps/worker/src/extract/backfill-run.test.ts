import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  loadBackfillCandidates,
  type BackfillCandidateRow,
} from './backfill';
import { runBackfill } from './backfill-run';

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
  for (const method of ['select', 'is', 'neq', 'gt', 'order', 'limit']) chain[method] = () => chain;
  return chain;
}

afterEach(() => vi.unstubAllEnvs());

describe('loadBackfillCandidates', () => {
  it('skips debunked current item rows', async () => {
    let rows = [
      { id: 'ci-live', status: 'reported', promoted_to: null },
      { id: 'ci-retracted', status: 'debunked', promoted_to: null },
    ];
    const chain = {
      select: () => chain,
      is: (column: string, value: unknown) => {
        rows = rows.filter((row) => row[column as keyof typeof row] === value);
        return chain;
      },
      neq: (column: string, value: unknown) => {
        rows = rows.filter((row) => row[column as keyof typeof row] !== value);
        return chain;
      },
      gt: () => chain,
      order: () => chain,
      limit: (limit: number) => {
        rows = rows.slice(0, limit);
        return chain;
      },
      then: (resolve: (result: { data: typeof rows; error: null }) => void) => (
        resolve({ data: rows, error: null })
      ),
    };
    const db = { from: vi.fn(() => chain) } as unknown as Parameters<
      typeof loadBackfillCandidates
    >[0];

    const candidates = await loadBackfillCandidates(db);

    expect(candidates.map((row) => row.id)).toEqual(['ci-live']);
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
    const guards: unknown[][] = [];
    const chain = selectChain([baseItem({ id: 'a' })]);
    const db = {
      from: vi.fn(() => ({
        ...chain,
        update: (row: unknown) => ({
          eq: () => ({
            neq: (...args: unknown[]) => {
              writes.push(row);
              guards.push(args);
              return Promise.resolve({ error: null });
            },
          }),
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
    expect(guards).toEqual([['status', 'debunked']]);
  });

  it('does not un-hide a row retracted after candidate loading', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', '');
    const item = baseItem({
      id: 'retracted-during-run',
      summary:
        'A first complete sentence provides the confirmed announcement context for readers. A second complete sentence provides enough additional detail to clear the summary floor.',
      detail: Array(70).fill('grounded').join(' '),
      image_url: 'https://www.billboard.com/ok.jpg',
    });
    const stored: Record<string, unknown> = {
      id: item.id,
      status: 'debunked',
      redline_ok: false,
    };
    let fromCall = 0;
    const db = {
      from: vi.fn(() => {
        fromCall += 1;
        if (fromCall === 1) return selectChain([item]);
        let patch: Record<string, unknown> = {};
        const predicates: Array<(row: Record<string, unknown>) => boolean> = [];
        const query = {
          update: (row: Record<string, unknown>) => {
            patch = row;
            return query;
          },
          eq: (column: string, value: unknown) => {
            predicates.push((row) => row[column] === value);
            return query;
          },
          neq: (column: string, value: unknown) => {
            predicates.push((row) => row[column] !== value);
            return query;
          },
          then: (resolve: (result: { error: null }) => void) => {
            if (predicates.every((predicate) => predicate(stored))) Object.assign(stored, patch);
            resolve({ error: null });
          },
        };
        return query;
      }),
      rpc: vi.fn(() => ({
        then: (resolve: (value: { data: null; error: null }) => void) => (
          resolve({ data: null, error: null })
        ),
      })),
    } as unknown as Parameters<typeof runBackfill>[0];

    await runBackfill(db, { dryRun: false });

    expect(stored).toMatchObject({ status: 'debunked', redline_ok: false });
  });
});
