import type { ApiResponse } from '@swift2/content';
import type {
  HapticKind,
  Insets,
  NotificationPrefs,
  NotificationPrefsState,
  NotificationPrefsUpdate,
  NotificationStatus,
  SharePayload,
  ThemeChange,
} from '../host/types';
import type { Envelope, ResResult } from './envelope';
import { makeRes, resErr } from './envelope';
import type { BridgeApiRequest, ExternalUrl, MailtoUrl, WebPath } from './validate';
import type { VersionRange } from './version';

type Spec<P, R> = { payload: P; result: R };

/** DOM -> native commands. `null` result = completed, nothing to return. */
export type DomCommandSpec = {
  /**
   * Native-owned routes only (`isWebPath`, and a route the native shell owns);
   * anything else is answered `invalid`, never navigated.
   */
  navigate: Spec<{ path: WebPath; replace?: boolean }, null>;
  share: Spec<SharePayload & { image?: { url: string } }, { imageCopied: boolean } | null>;
  haptic: Spec<{ kind: HapticKind }, null>;
  /** Native clipboard write for the share Copy-link fallback. `text` is a non-empty string of at most 2048 chars. Add-only. */
  'clipboard.write': Spec<{ text: string }, null>;
  /** `https:` (`isExternalUrl`) or a bare `mailto:` (`isMailtoUrl`); anything else is `invalid`. */
  openExternal: Spec<{ url: ExternalUrl | MailtoUrl }, null>;
  'notifications.status': Spec<Record<string, never>, NotificationStatus>;
  'notifications.request': Spec<Record<string, never>, NotificationStatus>;
  'notifications.register': Spec<Record<string, never>, null>;
  'notifications.updatePrefs': Spec<{ prefs: NotificationPrefs }, null>;
  'notifications.getPrefs': Spec<Record<string, never>, NotificationPrefsState>;
  'notifications.savePrefs': Spec<NotificationPrefsUpdate, NotificationPrefsState>;
  'notifications.unregister': Spec<Record<string, never>, null>;
  'notifications.registration': Spec<Record<string, never>, { registered: boolean }>;
  /** Add-only (W6): the native one-time push-offer flag, shared with the native OnboardingScreen's SecureStore key. */
  'notifications.onboardingOffered': Spec<Record<string, never>, { offered: boolean }>;
  'notifications.markOnboardingOffered': Spec<Record<string, never>, null>;
  /**
   * `stream: true` (ClownChat only) answers at headers with an `ApiStreamHead`; the DOM then pulls the body
   * with `apiRead`. A non-2xx answers the buffered `ApiResponse` shape (no streamId). Add-only (W6-stream).
   */
  api: Spec<{ req: BridgeApiRequest; stream?: true }, ApiResponse | ApiStreamHead>;
  /**
   * Pull the next decoded chunk of an open stream (long-poll, `{ chunk: '', done: false }` on an idle poll). Any ambiguity
   * (a timed-out or lost read) fails the stream; there is no replay.
   */
  apiRead: Spec<{ streamId: string }, ApiStreamChunk>;
  /** `targetId` is a command id, or an open stream's id (which aborts that stream). */
  cancel: Spec<{ targetId: string }, null>;
  /** The reader's persistent `local` storage, one native blob. Add-only. */
  'storage.load': Spec<Record<string, never>, { entries: Record<string, string> }>;
  /** The FULL map; native replaces the blob wholesale. `invalid` if any key is over 256 chars or the blob is over 192 KiB (UTF-8). */
  'storage.write': Spec<{ entries: Record<string, string> }, null>;
};

/** Headers of a streamed `api` response; the body follows via `apiRead`. */
export type ApiStreamHead = { status: number; headers: Record<string, string>; streamId: string };
export type ApiStreamChunk = { chunk: string; done: boolean };

/** Native -> DOM commands. */
export type NativeCommandSpec = {
  back: Spec<Record<string, never>, 'handled' | 'exit'>;
};

export type CommandSpec = DomCommandSpec & NativeCommandSpec;

/** DOM -> native events (fire and forget, no `res`). */
export type DomEventSpec = {
  ready: { v: number; range?: VersionRange };
  diag: { stage: string; detail?: string };
  ack: { seq: number };
  /** The DOM `navigate` subscriber is installed (once per client; repeats are idempotent). Add-only (W2-I). */
  navReady: Record<string, never>;
  // Atomicity invariant: the 'use dom' reader HTML/JS ships as hashed assets of the same expo-updates update
  // as the native JS and launches only when every asset is present, so DOM/native skew cannot occur.
  /** Outcome of a native `navigate` that carried an `id`: `ok` after the reader committed, false on failure. Add-only (W2-I). */
  navigated: { id: string; ok: boolean };
  /** Fire-and-forget (no res, no ack): the surface theme colour changed. `background` is #rrggbb, `statusBarStyle` light|dark. Add-only. */
  theme: ThemeChange;
  /** Fire-and-forget (no res, no ack): the DOM's current route (`/`-rooted path plus query/hash, <= 2048 chars) changed. Queued/coalesced like `theme`: only the latest matters. Add-only. */
  route: { path: string; /** The user is mid-interaction (ClownBot ask/draft, feedback form): native defers content adoption. Absent = idle. */ busy?: boolean; /** The reader is away from rest (not the front door, an overlay or legal page open, or scrolled down): native defers content adoption until it idles. Absent = idle. */ engaged?: boolean };
};

/** Native -> DOM events. */
export type NativeEventSpec = {
  insets: Insets;
  contentVersion: { token: string };
  /** Unsequenced reply to each accepted `ready`: the host's cmd-id high-water mark (-1 -> 0). */
  readyAck: { hwm: number };
  /** `id` (optional, add-only) asks the DOM to answer with a `navigated` event once the navigation committed. */
  navigate: { path: WebPath; source: 'notification' | 'deeplink'; id?: string };
};

export type EventSpec = DomEventSpec & NativeEventSpec;

export type DomCommandType = keyof DomCommandSpec;
export type NativeCommandType = keyof NativeCommandSpec;
export type CommandType = DomCommandType | NativeCommandType;
export type DomEventType = keyof DomEventSpec;
export type NativeEventType = keyof NativeEventSpec;
export type EventType = DomEventType | NativeEventType;

export type PayloadOf<T extends CommandType> = CommandSpec[T]['payload'];
export type ResultOf<T extends CommandType> = CommandSpec[T]['result'];
export type EventPayloadOf<T extends EventType> = EventSpec[T];

export type HandlerContext = {
  signal: AbortSignal;
  /** The command id (absent in unit tests). */
  id?: string;
  /**
   * Registers a resource that outlives its command (an open `api` stream) under `id`: a later `cancel { targetId: id }`
   * calls `cancel`, as does the host's abort-all (shutdown, DOM re-handshake). Returns an unregister. Absent in unit tests.
   */
  own?: (id: string, cancel: () => void) => () => void;
};

/**
 * A handler resolves with the `res` body, so a handler can answer `invalid`
 * (e.g. a non-web `navigate` path) without throwing. A rejection or throw is
 * mapped by the dispatcher to `failed`; an explicit `resErr('failed')` and a
 * dispatcher-mapped rejection are indistinguishable on the wire (intended).
 */
export type Handler<T extends CommandType> = (
  payload: PayloadOf<T>,
  ctx: HandlerContext,
) => Promise<ResResult<ResultOf<T>>>;

/**
 * Exhaustive over the DOM -> native command union: the native host (B)
 * implements it, the DOM contract test (C) imports it. Adding a command
 * without a handler fails typecheck.
 */
export type HandlerMap = { [T in DomCommandType]: Handler<T> };

/** Native -> DOM command responders (the DOM client implements these). */
export type ResponderMap = { [T in NativeCommandType]: Handler<T> };

/** Runtime lists, exhaustive by construction (a `Record` over the union). */
const DOM_COMMANDS: Record<DomCommandType, true> = {
  navigate: true,
  share: true,
  haptic: true,
  'clipboard.write': true,
  openExternal: true,
  'notifications.status': true,
  'notifications.request': true,
  'notifications.register': true,
  'notifications.updatePrefs': true,
  'notifications.getPrefs': true,
  'notifications.savePrefs': true,
  'notifications.unregister': true,
  'notifications.registration': true,
  'notifications.onboardingOffered': true,
  'notifications.markOnboardingOffered': true,
  api: true,
  apiRead: true,
  cancel: true,
  'storage.load': true,
  'storage.write': true,
};
const NATIVE_COMMANDS: Record<NativeCommandType, true> = { back: true };
const DOM_EVENTS: Record<DomEventType, true> = { ready: true, diag: true, ack: true, navReady: true, navigated: true, theme: true, route: true };
const NATIVE_EVENTS: Record<NativeEventType, true> = {
  insets: true,
  contentVersion: true,
  readyAck: true,
  navigate: true,
};

export const DOM_COMMAND_TYPES = Object.keys(DOM_COMMANDS) as readonly DomCommandType[];
export const NATIVE_COMMAND_TYPES = Object.keys(NATIVE_COMMANDS) as readonly NativeCommandType[];
export const COMMAND_TYPES: readonly CommandType[] = [
  ...DOM_COMMAND_TYPES,
  ...NATIVE_COMMAND_TYPES,
];
export const DOM_EVENT_TYPES = Object.keys(DOM_EVENTS) as readonly DomEventType[];
export const NATIVE_EVENT_TYPES = Object.keys(NATIVE_EVENTS) as readonly NativeEventType[];
export const EVENT_TYPES: readonly EventType[] = [...DOM_EVENT_TYPES, ...NATIVE_EVENT_TYPES];

export const isDomCommandType = (t: string): t is DomCommandType => Object.hasOwn(DOM_COMMANDS, t);
export const isNativeCommandType = (t: string): t is NativeCommandType =>
  Object.hasOwn(NATIVE_COMMANDS, t);
/**
 * The `res` for a `cmd` whose type is not a DOM command: `unsupported`, never a
 * throw. Returns null when `cmd` is known (the dispatcher handles it).
 */
export function answerUnknown(
  cmd: Pick<Envelope, 'id' | 'type'>,
  v: number,
  ts: number,
): Envelope | null {
  if (isDomCommandType(cmd.type)) return null;
  return makeRes(cmd, resErr('unsupported', `unknown command: ${cmd.type.slice(0, 64)}`), v, ts);
}

export const isDomEventType = (t: string): t is DomEventType => Object.hasOwn(DOM_EVENTS, t);
export const isNativeEventType = (t: string): t is NativeEventType =>
  Object.hasOwn(NATIVE_EVENTS, t);
