import { createElement, type ReactNode } from 'react';
import { HostProvider } from '@swift2/ui';
import { createWebAdapter } from './host-adapter';

// One adapter for the whole test run: Link/Image identity is module-level, so
// every render sees the same element types the production provider hands out.
const TEST_ADAPTER = createWebAdapter({ push() {}, replace() {} });

/** Mounts the real web adapter (next/image + next/link) without needing the App Router. */
export function TestHostProvider({ children }: { children?: ReactNode }) {
  return createElement(HostProvider, { adapter: TEST_ADAPTER }, children);
}
