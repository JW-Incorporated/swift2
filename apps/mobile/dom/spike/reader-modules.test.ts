import { describe, expect, it, vi } from 'vitest';
import { createReaderAdapter } from './reader-modules';

const insets = { top: 1, right: 2, bottom: 3, left: 4 };
const make = (call = vi.fn()) =>
  createReaderAdapter({ client: { call } as never, insets, navigateDom: vi.fn(), getPath: () => '/?item=a' });

describe('createReaderAdapter (the DOM host adapter D2 mounts)', () => {
  it('sets embedOrigin to the canonical origin so YouTube embeds frame the wrapper page (#4954)', () => {
    const adapter = make();
    expect(adapter.embedOrigin).toBe('https://www.longlivets.com');
    expect(adapter.resolveUrl?.('/eras/x.png')).toBe('https://www.longlivets.com/eras/x.png');
  });

  it('wires the H2 bridge api transport (apiFetch + buffered apiStream) and the D1 pieces', async () => {
    const call = vi.fn(async () => ({ ok: true, value: { status: 200, body: '{}' } }));
    const adapter = make(call);
    expect(adapter.apiStream).toBeTypeOf('function');
    await adapter.apiFetch({ method: 'GET', path: '/api/x' } as never);
    expect(call).toHaveBeenCalledWith('api', expect.objectContaining({ req: expect.objectContaining({ path: '/api/x' }) }), undefined);
    expect(adapter.insets).toEqual(insets);
    expect(adapter.currentUrl?.()).toBe('https://www.longlivets.com/?item=a');
    expect(adapter.env.affiliate).toBeUndefined();
    expect(adapter.env.turnstileSiteKey).toBeNull();
    expect(adapter.webPush).toBeUndefined();
  });

  it('storage is Map-backed for both areas and tri-state, never window storage', () => {
    const a = make();
    const { local, session } = a.storage;
    expect(local.get('k')).toBeNull();
    local.set('k', 'v');
    expect(local.get('k')).toBe('v');
    expect(session.get('k')).toBeNull();
    local.remove('k');
    expect(local.get('k')).toBeNull();
    expect(make().storage.local).not.toBe(local);
  });
});
