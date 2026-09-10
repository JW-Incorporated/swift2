/**
 * `threads-data.ts` unit tests (OS-034). Verifies the module wires the full
 * content corpus into `@swift2/experience`'s injected thread-content
 * provider, and that a second `ensureThreadContent()` call still leaves the
 * provider resolving correctly — the property `ThreadsScreen`'s single,
 * screen-level effect (see its own doc comment) depends on to avoid
 * refetching the bundle on every thread switch.
 */
import { describe, expect, it, vi } from 'vitest';
import { contentForThreadInjected } from '@swift2/experience';
import { loadBundle } from '@swift2/content';
import { ensureThreadContent } from './threads-data';

vi.mock('@swift2/content', () => ({
  loadBundle: vi.fn(),
}));
vi.mock('./vault-storage', () => ({
  contentBaseUrl: () => 'https://fixture.invalid/content',
  expoFileSystemStorageAdapter: () => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }),
}));

const FOLKLORE_ITEM = {
  id: 'vault-folklore-001',
  eraId: 'folklore',
  date: '2020-07-24',
  dateLabel: 'July 2020',
  title: 'folklore released',
  summary: 'summary',
  body: [],
  tags: [],
  images: [],
};

describe('ensureThreadContent', () => {
  it('wires every content:<eraId> file into the injected thread-content provider', async () => {
    (loadBundle as ReturnType<typeof vi.fn>).mockResolvedValue({
      files: { 'content:folklore': { eraId: 'folklore', items: [FOLKLORE_ITEM] } },
    });

    const items = await ensureThreadContent();

    expect(items).toEqual([FOLKLORE_ITEM]);
    expect(contentForThreadInjected()).toEqual([FOLKLORE_ITEM]);
  });

  it('is idempotent — a second call still leaves the provider returning the freshly-fetched corpus', async () => {
    // Deliberately no provider reset between tests: this module's
    // `contentWired` flag is a real module-level singleton (see
    // threads-data.ts's own doc comment), so once the first test wired the
    // real provider, a second `ensureThreadContent()` call updates the
    // module's `allContent` closure variable in place rather than
    // re-registering the provider function — exactly the property this test
    // exists to verify.
    (loadBundle as ReturnType<typeof vi.fn>).mockResolvedValue({
      files: { 'content:folklore': { eraId: 'folklore', items: [FOLKLORE_ITEM] } },
    });

    await ensureThreadContent();
    const second = await ensureThreadContent();

    expect(second).toEqual([FOLKLORE_ITEM]);
    expect(contentForThreadInjected()).toEqual([FOLKLORE_ITEM]);
  });
});
