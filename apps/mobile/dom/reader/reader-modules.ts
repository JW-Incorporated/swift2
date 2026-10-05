/* eslint-disable @typescript-eslint/no-require-imports -- call-time require is deliberate (Metro lazy eval, see below) */
// Lazy load of the packages/ui reader, called only after `fill(snapshot)` (never import the shell, store or
// slots statically: module-level constants would freeze empty). Metro evaluates a module on its first
// `require`, so a call-time require gives the same ordering as a dynamic import without async chunks, which
// Expo's DOM export cannot serialize (it fails with "Asset not found: __common"). Returns one component:
// the host adapter + snapshot providers around packages/ui ReaderRoot with the registered slots (D2).
import { createElement, useEffect, useMemo, type ComponentType } from 'react';
import type { ReaderSnapshotCore, ReaderSnapshotExtensions } from '@swift2/experience/reader-snapshot';
import { HostProvider, ReaderExtensionsProvider, ReaderSnapshotProvider } from '@swift2/ui';
import type { BridgeClient, HostAdapter, HostStorage, Insets } from '@swift2/ui';
import { createBridgeApiFetch, createBridgeApiStream } from '../bridge/api-fetch';
import { createAppAdapter } from '../bridge/app-adapter';
import { installBlankCapture } from '../bridge/app-adapter-nav';
import { ReaderControlsContext, type ReaderControls } from '../bridge/reader-controls';
import { isNativeRoute } from '../slots/routes';
import { createWriteCoalescer } from './storage-sync';

export type ReaderProps = {
  client: Pick<BridgeClient, 'call'> & Partial<Pick<BridgeClient, 'sendDiag'>>;
  insets: Insets;
  controls: Omit<ReaderControls, 'slottedModes'>;
  navigateDom: (path: string) => void;
  getPath: () => string;
};

/** Identical on iOS and Android (the Android DOM has no storage, G3). Tri-state: null = absent. The Map is authoritative and
 * synchronous; `onWrite` (absent for per-launch `session` storage) mirrors each mutation to the native blob. */
export function createMapStorage(
  seed: Record<string, string> = {},
  onWrite?: (change: { set?: [string, string]; remove?: string }) => void,
): HostStorage {
  const m = new Map<string, string>(Object.entries(seed));
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
      onWrite?.({ set: [k, v] });
    },
    remove: (k) => {
      m.delete(k);
      onWrite?.({ remove: k });
    },
  };
}

/** One adapter per client lifetime (host and transport share it); insets are layered on without rebuilding it. */
export function createReaderAdapter(
  p: Pick<ReaderProps, 'client' | 'navigateDom' | 'getPath'> & { insets: Insets; storageSeed?: Record<string, string> },
): HostAdapter {
  const apiFetch = createBridgeApiFetch(p.client);
  const sync = createWriteCoalescer(p.client, (detail) => p.client.sendDiag?.('storage-sync', detail));
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sync.flush();
    });
    window.addEventListener('pagehide', () => sync.flush());
  }
  return {
    ...createAppAdapter({
      client: p.client,
      insets: p.insets,
      isNativeRoute,
      navigateDom: p.navigateDom,
      getPath: p.getPath,
      apiFetch,
      storage: { local: createMapStorage(p.storageSeed, sync.push), session: createMapStorage() },
      onBack: () => () => {},
    }),
    apiStream: createBridgeApiStream(apiFetch),
  };
}

export function loadReader(
  snapshot: ReaderSnapshotCore,
  extensions: ReaderSnapshotExtensions,
  storageSeed: Record<string, string> = {},
): ComponentType<ReaderProps> {
  // Merch and songMoods are poured and attached here, after the core fill and apart from it, as the web's lazy chunks do.
  const fillExt = require('./shims/fill-extensions') as typeof import('./shims/fill-extensions');
  fillExt.fillExtensions(extensions);
  const { ReaderRoot } = require('@swift2/ui/reader/shell/ReaderShell') as typeof import('@swift2/ui/reader/shell/ReaderShell');
  const registry = require('../slots') as typeof import('../slots');
  const { buildReaderSlots } = require('../slots/reader-slots') as typeof import('../slots/reader-slots');
  const fallbacks = require('../slots/overlay-fallback') as typeof import('../slots/overlay-fallback');
  const { ReaderBridge } = require('../bridge/reader-bridge') as typeof import('../bridge/reader-bridge');

  const registered = registry.slots();
  const slots = buildReaderSlots(registered, {
    overlays: [ReaderBridge, fallbacks.OverlayFallback],
    fallback: fallbacks.ModeFallback,
  });
  const slottedModes = new Set(Object.keys(slots.surfaces));

  return function Reader({ client, insets, controls, navigateDom, getPath }: ReaderProps) {
    const base = useMemo(() => createReaderAdapter({ client, insets, navigateDom, getPath, storageSeed }), [client]);
    const adapter = useMemo(() => ({ ...base, insets }), [base, insets.top, insets.right, insets.bottom, insets.left]);
    useEffect(
      () => installBlankCapture(document as unknown as Parameters<typeof installBlankCapture>[0], { origin: adapter.env.origin, navigate: adapter.navigate, openExternal: adapter.openExternal! }),
      [base],
    );
    const withModes = useMemo(() => ({ ...controls, slottedModes }), [controls]);
    return createElement(
      HostProvider,
      { adapter },
      createElement(ReaderSnapshotProvider, {
        value: snapshot,
        children: createElement(ReaderExtensionsProvider, {
          extensions,
          children: createElement(ReaderControlsContext.Provider, { value: withModes }, createElement(ReaderRoot, { slots })),
        }),
      }),
    );
  };
}
