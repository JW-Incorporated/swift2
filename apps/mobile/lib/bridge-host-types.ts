// Types and limits for the native bridge host (split from bridge-host.ts).
import { NATIVE_SUPPORTED_RANGE } from '@swift2/ui';
import type { DomCommandType, Envelope, HandlerMap, NativeCommandType, ResResult, ThemeChange, VersionRange } from '@swift2/ui';
import { DEFAULT_TIMEOUT_MS } from './bridge-host-inflight';
import type { BridgeScheduler } from './bridge-host-timers';

export const HOST_RANGE: VersionRange = NATIVE_SUPPORTED_RANGE;
export { DEFAULT_TIMEOUT_MS };
export type { BridgeScheduler };
export const READY_LIMIT = 3;
export const READY_WINDOW_MS = 10_000;
export const MAX_INFLIGHT = 32;
export const MAX_PENDING = 64;

export interface BridgeHostDeps {
  /** The dispatcher owns `cancel`; handlers cover every other DOM command. */
  handlers: Omit<HandlerMap, 'cancel'>;
  /** Delivers one native-to-DOM envelope (transport-neutral). */
  send: (env: Envelope) => void;
  now: () => number;
  scheduler: BridgeScheduler;
  /** Only protocol-fatal failures: the watchdog strike hook. */
  onProtocolFatal: (reason: string) => void;
  onSignal: (stage: string, detail?: string) => void;
  /** Per-type overrides of DEFAULT_TIMEOUT_MS. */
  timeouts?: Partial<Record<DomCommandType, number>>;
  maxInflight?: number;
  outboxCap?: number;
  /** Runs once, FIRST in shutdown (protocol fatal or dispose), before anything is torn down: release leases here. */
  onBeforeShutdown?: () => void;
  /** A `ready` arrived while already ready (the DOM re-handshook: webview reload or a new client). */
  onReadyAgain?: () => void;
  /** The DOM announced its `navigate` subscriber (idempotent per client). */
  onNavReady?: () => void;
  /** The DOM's outcome for a `navigate` emitted with an `id`. */
  onNavigated?: (e: { id: string; ok: boolean }) => void;
  /** The DOM's theme event (validated; no reply is ever sent). */
  onTheme?: (theme: ThemeChange) => void;
  /** The DOM's route event (validated; no reply is ever sent): its current path plus query/hash, and whether the user is mid-interaction. */
  onRoute?: (path: string, busy: boolean) => void;
}

export type AckRef = { epoch: number; seq: number };
export type Pending = { type: NativeCommandType; resolve: (r: ResResult<never>) => void; timeoutMs: number; timer?: unknown };

