import { describe, expect, it, vi } from 'vitest';
import { createExpoBridge } from './transport-expo';
import { answerBack } from './back-responder';

describe('answerBack', () => {
  it('closes an open item first (handled)', () => {
    const closeItem = vi.fn();
    expect(answerBack({ openItemId: 'i1', closeItem })).toBe('handled');
    expect(closeItem).toHaveBeenCalledTimes(1);
  });

  it('answers exit at the root without closing anything', () => {
    const closeItem = vi.fn();
    expect(answerBack({ openItemId: null, closeItem })).toBe('exit');
    expect(closeItem).not.toHaveBeenCalled();
  });
});

describe('back through the DOM client', () => {
  const backCmd = (id: string, seq: number) => ({ v: 1, id, kind: 'cmd', type: 'back', payload: {}, ts: 1, seq });

  it('a press delivered twice in one render closes one level and answers once (the counter bug)', async () => {
    const posted: { kind: string; id: string; payload: unknown }[] = [];
    const bridge = createExpoBridge((env) => void posted.push(env as never));
    const closeItem = vi.fn();
    bridge.client.handle('back', () => answerBack({ openItemId: 'i1', closeItem }));
    const inbox = [backCmd('h-1', 1)];
    bridge.client.consumeInbox(inbox);
    bridge.client.consumeInbox(inbox);
    await vi.waitFor(() => expect(posted.some((e) => e.kind === 'res')).toBe(true));
    expect(closeItem).toHaveBeenCalledTimes(1);
    expect(posted.filter((e) => e.kind === 'res' && e.id === 'h-1')).toHaveLength(1);
    expect(posted.find((e) => e.kind === 'res')?.payload).toMatchObject({ ok: true, value: 'handled' });
    bridge.client.dispose();
  });

  it('two distinct presses close two levels, one each', async () => {
    const bridge = createExpoBridge(() => undefined);
    let open: string | null = 'a';
    const closeItem = vi.fn(() => {
      open = null;
    });
    const answers: string[] = [];
    bridge.client.handle('back', () => {
      const r = answerBack({ openItemId: open, closeItem });
      answers.push(r);
      return r;
    });
    bridge.client.consumeInbox([backCmd('h-1', 1)]);
    bridge.client.consumeInbox([backCmd('h-1', 1), backCmd('h-2', 2)]);
    await vi.waitFor(() => expect(answers).toHaveLength(2));
    expect(answers).toEqual(['handled', 'exit']);
    bridge.client.dispose();
  });
});
