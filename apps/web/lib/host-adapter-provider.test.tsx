// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useHost } from '@swift2/ui';

let currentRouter = { push: vi.fn(), replace: vi.fn() };
vi.mock('next/navigation', () => ({ useRouter: () => currentRouter }));
vi.mock('next/link', () => ({ default: () => null }));
vi.mock('next/image', () => ({ default: () => null }));

import { WebHostProvider } from './host-adapter-provider';

const wrapper = ({ children }: { children?: ReactNode }) => <WebHostProvider>{children}</WebHostProvider>;

describe('WebHostProvider', () => {
  it('keeps the adapter stable across re-renders and rebuilds it when the router changes', () => {
    currentRouter = { push: vi.fn(), replace: vi.fn() };
    const { result, rerender } = renderHook(() => useHost(), { wrapper });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    currentRouter = { push: vi.fn(), replace: vi.fn() };
    rerender();
    expect(result.current).not.toBe(first);
    expect(result.current.Link).toBe(first.Link);
  });
});
