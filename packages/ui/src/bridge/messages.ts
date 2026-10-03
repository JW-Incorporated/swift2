import type { ApiRequest, ApiResponse } from '@swift2/content';
import type {
  HapticKind,
  Insets,
  NotificationPrefs,
  NotificationStatus,
  SharePayload,
} from '../host/types';
import type { JsonValue, ResResult } from './envelope';
import type { VersionRange } from './version';

/** A web path, exactly as the web routes it (X4): `/era/<id>?...`, never an app-only route name. */
export type WebPath = `/${string}`;

type Spec<P, R> = { payload: P; result: R };

/** DOM -> native commands. `null` result = completed, nothing to return. */
export type DomCommandSpec = {
  navigate: Spec<{ path: WebPath; replace?: boolean }, null>;
  share: Spec<SharePayload, null>;
  haptic: Spec<{ kind: HapticKind }, null>;
  openExternal: Spec<{ url: string }, null>;
  'notifications.status': Spec<Record<string, never>, NotificationStatus>;
  'notifications.request': Spec<Record<string, never>, NotificationStatus>;
  'notifications.register': Spec<Record<string, never>, null>;
  'notifications.updatePrefs': Spec<{ prefs: NotificationPrefs }, null>;
  api: Spec<{ req: ApiRequest }, ApiResponse>;
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
 * mapped by the dispatcher to `failed`.
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

/** Every payload and result in the protocol must stay JSON-serializable. */
export type AssertJson<T extends JsonValue | undefined> = T;

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
const NATIVE_EVENTS: Record<NativeEventType, true> = { insets: true, contentVersion: true, navigate: true };

export const DOM_COMMAND_TYPES = Object.keys(DOM_COMMANDS) as readonly DomCommandType[];
export const NATIVE_COMMAND_TYPES = Object.keys(NATIVE_COMMANDS) as readonly NativeCommandType[];
export const COMMAND_TYPES: readonly CommandType[] = [...DOM_COMMAND_TYPES, ...NATIVE_COMMAND_TYPES];
export const DOM_EVENT_TYPES = Object.keys(DOM_EVENTS) as readonly DomEventType[];
export const NATIVE_EVENT_TYPES = Object.keys(NATIVE_EVENTS) as readonly NativeEventType[];
export const EVENT_TYPES: readonly EventType[] = [...DOM_EVENT_TYPES, ...NATIVE_EVENT_TYPES];

export const isDomCommandType = (t: string): t is DomCommandType => Object.hasOwn(DOM_COMMANDS, t);
export const isNativeCommandType = (t: string): t is NativeCommandType => Object.hasOwn(NATIVE_COMMANDS, t);
export const isDomEventType = (t: string): t is DomEventType => Object.hasOwn(DOM_EVENTS, t);
export const isNativeEventType = (t: string): t is NativeEventType => Object.hasOwn(NATIVE_EVENTS, t);
