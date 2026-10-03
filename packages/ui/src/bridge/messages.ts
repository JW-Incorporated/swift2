import type { ApiResponse } from '@swift2/content';
import type {
  HapticKind,
  Insets,
  NotificationPrefs,
  NotificationStatus,
  SharePayload,
} from '../host/types';
import type { Envelope, ResResult } from './envelope';
import { makeRes, resErr } from './envelope';
import type { BridgeApiRequest, ExternalUrl, WebPath } from './validate';
import type { VersionRange } from './version';

type Spec<P, R> = { payload: P; result: R };

/** DOM -> native commands. `null` result = completed, nothing to return. */
export type DomCommandSpec = {
  /**
   * Native-owned routes only (`isWebPath`, and a route the native shell owns);
   * anything else is answered `invalid`, never navigated.
   */
  navigate: Spec<{ path: WebPath; replace?: boolean }, null>;
  share: Spec<SharePayload, null>;
  haptic: Spec<{ kind: HapticKind }, null>;
  /** `https:` only (`isExternalUrl`); anything else is `invalid`. */
  openExternal: Spec<{ url: ExternalUrl }, null>;
  'notifications.status': Spec<Record<string, never>, NotificationStatus>;
  'notifications.request': Spec<Record<string, never>, NotificationStatus>;
  'notifications.register': Spec<Record<string, never>, null>;
  'notifications.updatePrefs': Spec<{ prefs: NotificationPrefs }, null>;
  api: Spec<{ req: BridgeApiRequest }, ApiResponse>;
  cancel: Spec<{ targetId: string }, null>;
};

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
};

/** Native -> DOM events. */
export type NativeEventSpec = {
  insets: Insets;
  contentVersion: { token: string };
  navigate: { path: WebPath; source: 'notification' | 'deeplink' };
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

export type HandlerContext = { signal: AbortSignal };

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
  openExternal: true,
  'notifications.status': true,
  'notifications.request': true,
  'notifications.register': true,
  'notifications.updatePrefs': true,
  api: true,
  cancel: true,
};
const NATIVE_COMMANDS: Record<NativeCommandType, true> = { back: true };
const DOM_EVENTS: Record<DomEventType, true> = { ready: true, diag: true, ack: true };
const NATIVE_EVENTS: Record<NativeEventType, true> = {
  insets: true,
  contentVersion: true,
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
