// DOM -> native `evt` dispatch for the bridge host (split from bridge-host.ts). Pure: the host injects its hooks.
import type { Envelope, ThemeChange } from '@swift2/ui';
import { isRecord, validRoute, validTheme } from './bridge-host-validate';

export type DomEventHooks = {
  ready: () => boolean;
  onSignal: (stage: string, detail?: string) => void;
  onAck: (payload: unknown) => void;
  onNavReady?: () => void;
  onNavigated?: (e: { id: string; ok: boolean }) => void;
  onTheme?: (theme: ThemeChange) => void;
  onRoute?: (path: string, busy: boolean) => void;
};

/** Handles every non-`ready` DOM event. Events carry no reply: nothing here ever sends. */
export function handleDomEvent(env: Envelope, h: DomEventHooks): void {
  const p = env.payload;
  if (env.type === 'ack') return h.onAck(p);
  if ((env.type === 'navReady' || env.type === 'navigated' || env.type === 'theme' || env.type === 'route') && !h.ready()) {
    return h.onSignal('bridge-pre-ready', env.type);
  }
  if (env.type === 'theme') {
    const t = validTheme(p);
    if (t) h.onTheme?.(t);
    else h.onSignal('bridge-invalid', 'theme payload');
    return;
  }
  if (env.type === 'route') {
    const route = validRoute(p);
    if (route) h.onRoute?.(route.path, route.busy);
    else h.onSignal('bridge-invalid', 'route payload');
    return;
  }
  if (env.type === 'navReady') return h.onNavReady?.();
  if (env.type === 'navigated') {
    if (isRecord(p) && typeof p.id === 'string' && typeof p.ok === 'boolean') h.onNavigated?.({ id: p.id.slice(0, 64), ok: p.ok });
    else h.onSignal('bridge-invalid', 'navigated payload');
    return;
  }
  if (env.type === 'diag' && isRecord(p) && typeof p.stage === 'string') {
    h.onSignal(p.stage.slice(0, 64), typeof p.detail === 'string' ? p.detail.slice(0, 200) : undefined);
  } else {
    h.onSignal('bridge-ignored-evt', env.type.slice(0, 64));
  }
}
