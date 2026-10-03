// @vitest-environment jsdom
import { createElement } from 'react';
import { render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HostProvider, useHost } from './context';
import type { HostAdapter } from './types';

const stubStorage = { get: () => null, set: () => {}, remove: () => {} };
const adapter: HostAdapter = {
  Link: () => null,
  Image: () => null,
  navigate: () => {},
  onBack: () => () => {},
  apiFetch: async () => ({ status: 200, headers: {}, body: '' }),
  storage: { local: stubStorage, session: stubStorage },
  env: { turnstileSiteKey: null, origin: 'https://example.test' },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

describe('useHost', () => {
  it('throws a clear error outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useHost())).toThrow(/outside <HostProvider>/);
    spy.mockRestore();
  });

  it('passes the adapter through the provider (same identity)', () => {
    const { result } = renderHook(() => useHost(), {
      wrapper: ({ children }) => createElement(HostProvider, { adapter, children }),
    });
    expect(result.current).toBe(adapter);
  });

  it('renders children', () => {
    const { container } = render(createElement(HostProvider, { adapter }, createElement('p', null, 'hi')));
    expect(container.textContent).toBe('hi');
  });
});
