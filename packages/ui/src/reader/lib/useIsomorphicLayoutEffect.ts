'use client';

import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` on the client, `useEffect` on the server.
 *
 * React logs a warning when `useLayoutEffect` runs during server rendering,
 * because layout effects cannot do anything useful without a DOM. Every
 * component in this app that measures the DOM before paint needs the real
 * `useLayoutEffect` in the browser — measuring in a plain `useEffect` runs
 * AFTER the first paint, which is visible as a jump (see FilterBar's seed
 * offset and TopBar's sliding indicator).
 *
 * This lived as a private copy inside `FilterBar.tsx`. It is shared here so
 * there is one definition rather than one per component — a duplicated helper
 * is how two call sites quietly drift apart.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
