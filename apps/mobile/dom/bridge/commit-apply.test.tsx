// @vitest-environment jsdom
import { useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; the renderer is apps/web's, so pin hooks to the same one.
// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../../web/node_modules/react'));

// @ts-expect-error -- same copy pinning for the renderer flushSync uses
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

import { act, render } from '@testing-library/react';
import { applyAfterCommit } from './commit-apply';

describe('applyAfterCommit (ack only after the store change committed)', () => {
  it('called from a passive effect (as the transport delivers the inbox), the promise resolves after the DOM shows the change', async () => {
    let result: Promise<boolean> | null = null;
    let seenAtResolve: string | null = null;
    function Probe() {
      const [open, setOpen] = useState(false);
      // The transport's `consumeInbox` runs in a passive effect like this one.
      useEffect(() => {
        result = applyAfterCommit(() => {
          setOpen(true);
          return true;
        }).then((ok) => {
          seenAtResolve = document.body.textContent;
          return ok;
        });
      }, []);
      return <p>{open ? 'moment-open' : 'closed'}</p>;
    }
    await act(async () => {
      render(<Probe />);
    });
    expect(await result).toBe(true);
    expect(seenAtResolve).toBe('moment-open');
  });

  it('propagates false (unresolved target) and rejects when the work throws', async () => {
    expect(await applyAfterCommit(() => false)).toBe(false);
    await expect(
      applyAfterCommit(() => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});
