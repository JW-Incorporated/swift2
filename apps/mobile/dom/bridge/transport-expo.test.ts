import { describe, expect, it } from 'vitest';
import type { Envelope } from '@swift2/ui';
import { createExpoBridgeClient } from './transport-expo';

describe('createExpoBridgeClient', () => {
  it('posts through the bridge action and feeds a returned res back', async () => {
    const sent: Envelope[] = [];
    const client = createExpoBridgeClient(
      async (env) => {
        sent.push(env);
        return { v: 1, id: env.id, kind: 'res', type: env.type, payload: { ok: true, value: null }, ts: 1 };
      },
      () => 'x1',
    );
    expect(await client.call('haptic', { kind: 'light' })).toEqual({ ok: true, value: null });
    expect(sent[0]).toMatchObject({ kind: 'cmd', type: 'haptic', id: 'x1' });
  });

  it('survives a rejecting bridge action (times out instead of throwing)', async () => {
    const client = createExpoBridgeClient(() => Promise.reject(new Error('down')), () => 'x2');
    const r = await client.call('haptic', { kind: 'light' }, { timeoutMs: 5 });
    expect(r).toMatchObject({ ok: false, error: { code: 'timeout' } });
  });
});
