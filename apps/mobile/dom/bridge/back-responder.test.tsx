// @vitest-environment jsdom
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; the renderer is apps/web's, so pin hooks to the same one.
// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../../web/node_modules/react'));

import { act, render } from '@testing-library/react';
import { createExpoBridge } from './transport-expo';
import { createBackResponder, useBackRegistration } from './back-responder';

describe('createBackResponder', () => {
  it('closes an open item first (handled)', () => {
    const closeItem = vi.fn();
    expect(createBackResponder().answer({ openItemId: 'i1', closeItem })).toBe('handled');
    expect(closeItem).toHaveBeenCalledTimes(1);
  });

  it('answers exit at the root without closing anything', () => {
    const closeItem = vi.fn();
    expect(createBackResponder().answer({ openItemId: null, closeItem })).toBe('exit');
    expect(closeItem).not.toHaveBeenCalled();
  });

  it('a second press before the close commits is a root press, not another handled', () => {
    const r = createBackResponder();
    const closeItem = vi.fn();
    expect(r.answer({ openItemId: 'i1', closeItem })).toBe('handled');
    expect(r.answer({ openItemId: 'i1', closeItem })).toBe('exit');
    expect(closeItem).toHaveBeenCalledTimes(1);
    r.reset();
    expect(r.answer({ openItemId: 'i1', closeItem })).toBe('handled');
  });
});

describe('useBackRegistration with real React state', () => {
  function harness() {
    const ref: { back: (() => 'handled' | 'exit') | null; closeCalls: number } = { back: null, closeCalls: 0 };
    function Reader() {
      const [open, setOpen] = useState<string | null>('item');
      useBackRegistration(
        (fn) => void (ref.back = fn),
        open,
        () => {
          ref.closeCalls += 1;
          setOpen(null);
        },
      );
      return <div data-open={open ?? ''} />;
    }
    return { ref, ui: <Reader /> };
  }

  it('two distinct presses batched before the state commits: one handled, one exit, one close', () => {
    const { ref, ui } = harness();
    const { container } = render(ui);
    const answers: string[] = [];
    act(() => {
      answers.push(ref.back!(), ref.back!());
    });
    expect(answers).toEqual(['handled', 'exit']);
    expect(ref.closeCalls).toBe(1);
    expect(container.firstElementChild?.getAttribute('data-open')).toBe('');
  });

  it('after the close commits, a press at the root answers exit', () => {
    const { ref, ui } = harness();
    const { rerender } = render(ui);
    act(() => void ref.back!());
    expect(ref.closeCalls).toBe(1);
    rerender(ui);
    expect(ref.back!()).toBe('exit');
  });
});

describe('back through the DOM client', () => {
  const backCmd = (id: string, seq: number) => ({ v: 1, id, kind: 'cmd', type: 'back', payload: {}, ts: 1, seq });

  it('a press delivered twice in one render closes one level and answers once (the counter bug)', async () => {
    const posted: { kind: string; id: string; payload: unknown }[] = [];
    const bridge = createExpoBridge((env) => void posted.push(env as never));
    const closeItem = vi.fn();
    const responder = createBackResponder();
    bridge.client.handle('back', () => responder.answer({ openItemId: 'i1', closeItem }));
    const inbox = [backCmd('h-1', 1)];
    bridge.client.consumeInbox(inbox);
    bridge.client.consumeInbox(inbox);
    await vi.waitFor(() => expect(posted.some((e) => e.kind === 'res')).toBe(true));
    expect(closeItem).toHaveBeenCalledTimes(1);
    expect(posted.filter((e) => e.kind === 'res' && e.id === 'h-1')).toHaveLength(1);
    expect(posted.find((e) => e.kind === 'res')?.payload).toMatchObject({ ok: true, value: 'handled' });
    bridge.client.dispose();
  });
});
