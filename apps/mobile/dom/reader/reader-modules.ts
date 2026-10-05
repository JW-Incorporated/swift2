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
import { createWriteCoalescer, recoverStorage } from './storage-sync';

export type ReaderProps = {
  client: Pick<BridgeClient, 'call'> & Partial<Pick<BridgeClient, 'sendDiag'>>;
  insets: Insets;
  controls: Omit<ReaderControls, 'slottedModes'>;
  navigateDom: (path: string) => void;
  getPath: () => string;
};

/** Identical on iOS and Android (the Android DOM has no storage, G3). Tri-state: null = absent. The Map is authoritative and
 * synchronous; `onChange` (absent for per-launch `session` storage) fires after each mutation, and `snapshot` is the full map. */
export function createMapStorage(
  seed: Record<string, string> = {},
  onChange?: () => void,
): HostStorage & { snapshot(): Record<string, string>; track(): void; rebase(base: Record<string, string>): boolean } {
  const m = new Map<string, string>(Object.entries(seed));
  let touched: Map<string, string | null> | null = null;
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
      touched?.set(k, v);
      onChange?.();
    },
    remove: (k) => {
      m.delete(k);
      touched?.set(k, null);
      onChange?.();
    },
    snapshot: () => Object.fromEntries(m),
    /** Record key-level changes (value, or null = removed) until `rebase`. */
    track: () => {
      touched = new Map();
    },
    /** Replace the contents with `base`, then re-apply tracked changes; true when any were applied. */
    rebase: (base) => {
      const changes = touched ?? new Map<string, string | null>();
      touched = null;
      m.clear();
      for (const [k, v] of Object.entries(base)) m.set(k, v);
      for (const [k, v] of changes) {
        if (v === null) m.delete(k);
        else m.set(k, v);
      }
      return changes.size > 0;
    },
  };
}

const disposers = new WeakMap<object, () => void>();
/** Stops an adapter's pending storage recovery (call on unmount / re-key). */
export function disposeReaderAdapter(adapter: object): void {
  disposers.get(adapter)?.();
}

/** One adapter per client lifetime (host and transport share it); insets are layered on without rebuilding it. */
export function createReaderAdapter(
  p: Pick<ReaderProps, 'client' | 'navigateDom' | 'getPath'> & { insets: Insets; storageSeed?: Record<string, string> | null },
): HostAdapter {
  const apiFetch = createBridgeApiFetch(p.client);
  // eslint-disable-next-line prefer-const -- `local` needs `sync.push`, `sync` needs `local.snapshot` (late-bound)
  let local: ReturnType<typeof createMapStorage>;
  const sync = createWriteCoalescer(p.client, () => local.snapshot(), (detail) => p.client.sendDiag?.('storage-sync', detail));
  local = createMapStorage(p.storageSeed ?? {}, sync.push);
  // null seed = the load failed (not "empty"): keep working in memory, never push over the saved file, retry once.
  const stopRecovery =
    p.storageSeed === null ? recoverStorage(p.client, local, sync, (detail) => p.client.sendDiag?.('storage-sync', detail)) : null;
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sync.flush();
    });
    window.addEventListener('pagehide', () => sync.flush());
  }
  const adapter: HostAdapter = {
    ...createAppAdapter({
      client: p.client,
      insets: p.insets,
      isNativeRoute,
      navigateDom: p.navigateDom,
      getPath: p.getPath,
      apiFetch,
      storage: { local, session: createMapStorage() },
      onBack: () => () => {},
    }),
    apiStream: createBridgeApiStream(apiFetch),
  };
  if (stopRecovery) disposers.set(adapter, stopRecovery);
  return adapter;
}

export function loadReader(
  snapshot: ReaderSnapshotCore,
  extensions: ReaderSnapshotExtensions,
  storageSeed: Record<string, string> | null = {},
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
    useEffect(() => () => disposeReaderAdapter(base), [base]);
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
