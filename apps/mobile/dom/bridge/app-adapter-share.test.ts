// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createAppAdapter } from './app-adapter';

function adapterWith(call: () => Promise<unknown>) {
  return createAppAdapter({
    client: { call } as never,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    isNativeRoute: () => false,
    navigateDom: vi.fn(),
    getPath: () => '/',
    apiFetch: vi.fn() as never,
    onBack: () => () => {},
  });
}

describe('app adapter share restores focus (accessibility)', () => {
  it('returns focus to the triggering button after the native sheet closes', async () => {
    document.body.innerHTML = '<button id="share">Share</button><button id="other">Other</button>';
    const trigger = document.getElementById('share')!;
    trigger.focus();
    const adapter = adapterWith(async () => {
      document.getElementById('other')!.focus();
      return { ok: true, value: null };
    });
    await adapter.share?.({ url: 'https://example.com' });
    expect(document.activeElement).toBe(trigger);
  });

  it('restores focus and still rejects when the bridge reports failure', async () => {
    document.body.innerHTML = '<button id="share">Share</button><button id="other">Other</button>';
    const trigger = document.getElementById('share')!;
    trigger.focus();
    const adapter = adapterWith(async () => {
      document.getElementById('other')!.focus();
      return { ok: false, error: { code: 'failed', message: 'x' } };
    });
    await expect(adapter.share?.({ text: 'x' })).rejects.toThrow('share failed');
    expect(document.activeElement).toBe(trigger);
  });
});
