import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { newBridgeToken } from '../lib/bridge-token';

const host = readFileSync(new URL('./SharedUiHost.tsx', import.meta.url), 'utf8');

describe('bridge token', () => {
  it('is 32 hex chars and fresh each time', () => {
    const a = newBridgeToken();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(newBridgeToken()).not.toBe(a);
  });

  it('without globalThis.crypto it still yields distinct 32-hex tokens (mixed fallback)', () => {
    vi.stubGlobal('crypto', undefined);
    try {
      const seen = new Set(Array.from({ length: 50 }, () => newBridgeToken()));
      expect(seen.size).toBe(50);
      for (const t of seen) expect(t).toMatch(/^[0-9a-f]{32}$/);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('uses the native CSPRNG when the module is present', () => {
    const getRandomBytes = vi.fn((n: number) => new Uint8Array(n).fill(171));
    expect(newBridgeToken({ getRandomBytes })).toBe('ab'.repeat(16));
    expect(getRandomBytes).toHaveBeenCalledWith(16);
  });

  it('falls back when the native module is missing (null)', () => {
    expect(newBridgeToken(null)).toMatch(/^[0-9a-f]{32}$/);
  });

  it('never rides a DOM prop: not in the dom props object, not passed to AppReader/SharedUiTest as a prop', () => {
    const domProps = host.slice(host.indexOf('const dom = {'), host.indexOf('};', host.indexOf('const dom = {')));
    expect(domProps).not.toMatch(/token/i);
    const jsx = host.slice(host.indexOf('<SharedUiTest'));
    expect(jsx).not.toMatch(/\btoken=/);
    expect(jsx).not.toContain('injectedJavaScriptObject');
    expect(host).not.toContain('injectedJavaScriptObject');
  });
});
