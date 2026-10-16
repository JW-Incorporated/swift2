import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ serviceClient: vi.fn() }));

vi.mock('../lib/supabase.mjs', () => ({ serviceClient: mocks.serviceClient }));

// @ts-expect-error plain .mjs module
import { buildMatcherInput, main, readTidewatchItems } from './build-matcher-input.mjs';

afterEach(() => {
  mocks.serviceClient.mockReset();
  vi.restoreAllMocks();
});

describe('P2-11 matcher Tidewatch transport', () => {
  it('replayed merch_outfit decision reaches next matcher input through Supabase tidewatch read', async () => {
    const row = {
      decided_at: '2026-10-15T12:00:00.000Z',
      watch_item: { source_ref: JSON.stringify({
        moment: { id: 'vault-lover-replayed-look', title: 'Replayed look' },
        momentImageUrl: 'https://images.example/replayed-look.jpg',
      }) },
    };
    const limit = vi.fn(async () => ({ data: [row], error: null }));
    const query = {
      eq: vi.fn(() => query),
      order: vi.fn(() => ({ limit })),
    };
    const select = vi.fn(() => query);
    const client = { from: vi.fn(() => ({ select })) };

    const tidewatchItems = await readTidewatchItems(client, 3);
    const input = buildMatcherInput({
      corpora: [], tidewatchItems,
      tidewatchClass: { enabled: true, shadow: false },
      now: new Date('2026-10-15T13:00:00.000Z'),
    });

    expect(client.from).toHaveBeenCalledWith('watch_decision');
    expect(query.eq).toHaveBeenNthCalledWith(1, 'class', 'merch_outfit');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'shadow', false);
    expect(input.moments).toEqual([expect.objectContaining({
      source: 'tidewatch',
      moment: { id: 'vault-lover-replayed-look', title: 'Replayed look' },
      momentImageUrl: 'https://images.example/replayed-look.jpg',
    })]);
  });

  it('does not create a Supabase client with main default-off config', async () => {
    const config = JSON.parse(await readFile('config/tidewatch.json', 'utf8'));
    expect(config.classes.merch_outfit).toMatchObject({ enabled: false, shadow: true });
    const dir = await mkdtemp(join(tmpdir(), 'p2-11-default-off-'));
    const output = join(dir, 'matcher-input.json');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await main(['--output', output]);
      expect(mocks.serviceClient).not.toHaveBeenCalled();
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
