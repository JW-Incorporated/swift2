import { describe, expect, it, vi } from 'vitest';
import { createEraSync } from './art-era-sync';
import { ORIGIN } from './art-cache.test-kit';

const files = { eras: [], 'content:a': { items: [] }, 'content:b': { items: [] } };

const OK = { downloaded: 0, evicted: 0, entries: 0, bytes: 0 };

function setup(result: typeof OK | null = OK) {
  const syncEra = vi.fn(async (..._args: unknown[]) => result);
  const queued: Array<() => void> = [];
  const s = createEraSync({ syncEra, origin: ORIGIN, afterInteractions: (fn) => void queued.push(fn) });
  const flush = async () => {
    while (queued.length) queued.shift()!();
    await new Promise((r) => setTimeout(r, 0));
  };
  return { s, syncEra, flush, queued };
}

describe('createEraSync', () => {
  it('does nothing while content is not loaded, then syncs the noted era once content arrives', async () => {
    const { s, syncEra, flush, queued } = setup();
    s.noteEra('a');
    await flush();
    expect(queued).toHaveLength(0);
    expect(syncEra).not.toHaveBeenCalled();
    s.setContent(files, 'v1');
    s.trigger();
    await flush();
    expect(syncEra).toHaveBeenCalledTimes(1);
    expect(syncEra.mock.calls[0]!.slice(0, 2)).toEqual(['a', 'v1']);
  });

  it('runs only after interactions settle and coalesces rapid era changes to the latest', async () => {
    const { s, syncEra, flush } = setup();
    s.setContent(files, 'v1');
    s.noteEra('a');
    s.noteEra('b');
    expect(syncEra).not.toHaveBeenCalled();
    await flush();
    expect(syncEra).toHaveBeenCalledTimes(1);
    expect(syncEra.mock.calls[0]![0]).toBe('b');
  });

  it('skips an unchanged era+version and ignores unknown era ids', async () => {
    const { s, syncEra, flush } = setup();
    s.setContent(files, 'v1');
    s.noteEra('a');
    await flush();
    s.noteEra('a');
    s.trigger();
    s.noteEra('nope');
    s.noteEra(undefined);
    await flush();
    expect(syncEra).toHaveBeenCalledTimes(1);
  });

  it('retries a failed (null) run for the same era on the next trigger, but never loops on its own', async () => {
    const { s, syncEra, flush } = setup(null);
    s.setContent(files, 'v1');
    s.noteEra('a');
    await flush();
    await flush();
    expect(syncEra).toHaveBeenCalledTimes(1);
    s.trigger();
    await flush();
    expect(syncEra).toHaveBeenCalledTimes(2);
  });
});
