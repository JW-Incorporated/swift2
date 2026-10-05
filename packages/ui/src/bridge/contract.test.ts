import type { ApiFetch, ApiResponse } from '@swift2/content';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { HapticKind, HostAdapter, NotificationPrefs, NotificationPrefsState, NotificationPrefsUpdate, NotificationStatus, SharePayload } from '../host/types';
import { createBridgeClient } from './client';
import type { BridgeClient } from './client';
import type { ResResult } from './envelope';
import { COMMAND_TYPES, DOM_COMMAND_TYPES, EVENT_TYPES, NATIVE_COMMAND_TYPES, NATIVE_EVENT_TYPES } from './messages';
import type {
  DomCommandType,
  EventPayloadOf,
  HandlerMap,
  NativeEventType,
  PayloadOf,
  ResponderMap,
  ResultOf,
} from './messages';
import type { ApiStreamChunk, ApiStreamHead } from './messages';
import type { BridgeApiRequest, ExternalUrl, MailtoUrl, WebPath } from './validate';
import type { ShareHost } from '../reader/lib/share-payload';
import type { HostStorage } from '../host/types';

/**
 * Three-leg drift check (WP2.3-C, Fable REQUIRED 3). Compile-time legs are
 * enforced by `npm run typecheck`; the runtime leg pins the registered maps.
 * Leg 2 is type-only against `HandlerMap` (the host dispatcher, WP2.3-B, is
 * typed `HandlerMap`, so its handler signatures are exactly these).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used via `typeof` instantiation expressions
declare const callFn: BridgeClient['call'];
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used via `typeof` instantiation expressions
declare const onFn: BridgeClient['on'];
type ClientResult<T extends DomCommandType> = Awaited<ReturnType<typeof callFn<T>>>;
type ClientPayload<T extends DomCommandType> = Parameters<typeof callFn<T>>[1];
type ClientListenerPayload<T extends NativeEventType> = Parameters<Parameters<typeof onFn<T>>[1]>[0];
type HostPayload<T extends DomCommandType> = Parameters<HandlerMap[T]>[0];
type HostResult<T extends DomCommandType> = Awaited<ReturnType<HandlerMap[T]>>;

type PerCommand = { [T in DomCommandType]: [ClientPayload<T>, ClientResult<T>, HostPayload<T>, HostResult<T>] };
type Expected = { [T in DomCommandType]: [PayloadOf<T>, ResResult<ResultOf<T>>, PayloadOf<T>, ResResult<ResultOf<T>>] };

describe('leg 1 + 2: client <-> HandlerMap', () => {
  it('client call types, PayloadOf/ResultOf and the host handler signatures agree for every command', () => {
    expectTypeOf<PerCommand>().toEqualTypeOf<Expected>();
  });

  it('HandlerMap/ResponderMap are exhaustive over the command unions, both ways', () => {
    expectTypeOf<keyof HandlerMap>().toEqualTypeOf<DomCommandType>();
    expectTypeOf<keyof ResponderMap>().toEqualTypeOf<'back'>();
  });

  it('events the client listens for equal what the host emits', () => {
    type L = { [T in NativeEventType]: ClientListenerPayload<T> };
    type E = { [T in NativeEventType]: EventPayloadOf<T> };
    expectTypeOf<L>().toEqualTypeOf<E>();
  });

  it('HandlerMap equals an independently spelled-out signature set (exact, not assignable)', () => {
    type Ctx = { signal: AbortSignal; own?: (id: string, cancel: () => void) => () => void; id?: string };
    type H<P, R> = (payload: P, ctx: Ctx) => Promise<ResResult<R>>;
    type Empty = Record<string, never>;
    type Exact = {
      navigate: H<{ path: WebPath; replace?: boolean }, null>;
      share: H<SharePayload, null>;
      haptic: H<{ kind: HapticKind }, null>;
      openExternal: H<{ url: ExternalUrl | MailtoUrl }, null>;
      'notifications.status': H<Empty, NotificationStatus>;
      'notifications.request': H<Empty, NotificationStatus>;
      'notifications.register': H<Empty, null>;
      'notifications.updatePrefs': H<{ prefs: NotificationPrefs }, null>;
      'notifications.getPrefs': H<Empty, NotificationPrefsState>;
      'notifications.savePrefs': H<NotificationPrefsUpdate, NotificationPrefsState>;
      'notifications.unregister': H<Empty, null>;
      'notifications.registration': H<Empty, { registered: boolean }>;
      'notifications.onboardingOffered': H<Empty, { offered: boolean }>;
      'notifications.markOnboardingOffered': H<Empty, null>;
      api: H<{ req: BridgeApiRequest; stream?: true }, ApiResponse | ApiStreamHead>;
      apiRead: H<{ streamId: string }, ApiStreamChunk>;
      cancel: H<{ targetId: string }, null>;
      'storage.load': H<Empty, { entries: Record<string, string> }>;
      'storage.write': H<{ entries: Record<string, string> }, null>;
    };
    expectTypeOf<HandlerMap>().toEqualTypeOf<Exact>();
    expectTypeOf<ResponderMap>().toEqualTypeOf<{ back: H<Empty, 'handled' | 'exit'> }>();
  });

  it('runtime: the client posts exactly the registered DOM commands, and the lists are pinned', async () => {
    expect([...DOM_COMMAND_TYPES].sort()).toEqual(
      ['api', 'apiRead', 'cancel', 'haptic', 'navigate', 'notifications.register', 'notifications.request', 'notifications.status', 'notifications.updatePrefs', 'notifications.getPrefs', 'notifications.savePrefs', 'notifications.unregister', 'notifications.registration', 'notifications.onboardingOffered', 'notifications.markOnboardingOffered', 'openExternal', 'share', 'storage.load', 'storage.write'].sort(),
    );
    expect([...NATIVE_COMMAND_TYPES]).toEqual(['back']);
    expect([...COMMAND_TYPES].sort()).toEqual([...DOM_COMMAND_TYPES, 'back'].sort());
    expect([...NATIVE_EVENT_TYPES].sort()).toEqual(['contentVersion', 'insets', 'navigate', 'readyAck']);
    expect([...EVENT_TYPES].sort()).toEqual(['ack', 'contentVersion', 'diag', 'insets', 'navReady', 'navigate', 'navigated', 'ready', 'readyAck', 'theme']);
    const posted: string[] = [];
    let i = 0;
    const c = createBridgeClient({ post: (e) => void posted.push(e.type), now: () => 1, idGen: () => `y${i++}`, setTimer: () => 0 });
    for (const t of DOM_COMMAND_TYPES) void c.call(t, {} as never);
    expect(posted).toEqual([...DOM_COMMAND_TYPES]);
  });
});

describe('leg 3: HostAdapter <-> PayloadOf/ResultOf (void <-> null)', () => {
  type Share = NonNullable<HostAdapter['share']>;
  type Haptic = NonNullable<HostAdapter['haptic']>;
  type Theme = NonNullable<HostAdapter['theme']>;
  type Open = NonNullable<HostAdapter['openExternal']>;
  type Notif = NonNullable<HostAdapter['notifications']>;

  type VoidToNull<T> = [T] extends [void] ? null : T;
  type Mutual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

  it('navigate(path, {replace}) <-> navigate {path, replace}', () => {
    // The host takes a plain string; the DOM payload narrows it to a WebPath (validated before send).
    expectTypeOf<Parameters<HostAdapter['navigate']>[0]>().toEqualTypeOf<string>();
    expectTypeOf<WebPath>().toExtend<string>();
    expectTypeOf<NonNullable<Parameters<HostAdapter['navigate']>[1]>['replace']>().toEqualTypeOf<
      PayloadOf<'navigate'>['replace']
    >();
    expectTypeOf<VoidToNull<ReturnType<HostAdapter['navigate']>>>().toEqualTypeOf<ResultOf<'navigate'>>();
  });

  it('share/haptic/openExternal', () => {
    expectTypeOf<Mutual<Parameters<Share>[0], PayloadOf<'share'>>>().toEqualTypeOf<true>();
    expectTypeOf<VoidToNull<Awaited<ReturnType<Share>>>>().toEqualTypeOf<ResultOf<'share'>>();
    expectTypeOf<Mutual<Parameters<Haptic>[0], PayloadOf<'haptic'>['kind']>>().toEqualTypeOf<true>();
    expectTypeOf<VoidToNull<ReturnType<Haptic>>>().toEqualTypeOf<ResultOf<'haptic'>>();
    // theme is a fire-and-forget DOM event (no res): the host hook takes exactly the event payload and returns void.
    expectTypeOf<Mutual<Parameters<Theme>[0], EventPayloadOf<'theme'>>>().toEqualTypeOf<true>();
    expectTypeOf<ReturnType<Theme>>().toEqualTypeOf<void>();
    // Exact host parameter: widening it (e.g. `string | URL`) fails here.
    expectTypeOf<Parameters<Open>[0]>().toEqualTypeOf<string>();
    expectTypeOf<ExternalUrl>().toExtend<Parameters<Open>[0]>();
    expectTypeOf<MailtoUrl>().toExtend<Parameters<Open>[0]>();
    expectTypeOf<PayloadOf<'openExternal'>['url']>().toEqualTypeOf<ExternalUrl | MailtoUrl>();
    expectTypeOf<VoidToNull<ReturnType<Open>>>().toEqualTypeOf<ResultOf<'openExternal'>>();
  });

  it('notifications.*', () => {
    expectTypeOf<Awaited<ReturnType<Notif['status']>>>().toEqualTypeOf<ResultOf<'notifications.status'>>();
    expectTypeOf<Awaited<ReturnType<Notif['request']>>>().toEqualTypeOf<ResultOf<'notifications.request'>>();
    expectTypeOf<VoidToNull<Awaited<ReturnType<Notif['register']>>>>().toEqualTypeOf<ResultOf<'notifications.register'>>();
    expectTypeOf<VoidToNull<Awaited<ReturnType<Notif['updatePrefs']>>>>().toEqualTypeOf<ResultOf<'notifications.updatePrefs'>>();
    expectTypeOf<Parameters<Notif['updatePrefs']>[0]>().toEqualTypeOf<PayloadOf<'notifications.updatePrefs'>['prefs']>();
    expectTypeOf<PayloadOf<'notifications.updatePrefs'>['prefs']>().toEqualTypeOf<NotificationPrefs>();
    expectTypeOf<ResultOf<'notifications.updatePrefs'>>().toEqualTypeOf<null>();
    expectTypeOf<Awaited<ReturnType<Notif['loadPrefs']>>>().toEqualTypeOf<ResultOf<'notifications.getPrefs'>>();
    expectTypeOf<Awaited<ReturnType<Notif['savePrefs']>>>().toEqualTypeOf<ResultOf<'notifications.savePrefs'>>();
    expectTypeOf<Parameters<Notif['savePrefs']>[0]>().toEqualTypeOf<PayloadOf<'notifications.savePrefs'>>();
    expectTypeOf<VoidToNull<Awaited<ReturnType<Notif['unregister']>>>>().toEqualTypeOf<ResultOf<'notifications.unregister'>>();
  });

  it('apiFetch and insets', () => {
    expectTypeOf<Awaited<ReturnType<ApiFetch>>>().toEqualTypeOf<Extract<ResultOf<'api'>, { body: string }>>();
    expectTypeOf<ResultOf<'api'>>().toEqualTypeOf<ApiResponse | ApiStreamHead>();
    expectTypeOf<Parameters<ApiFetch>[0]['method']>().toEqualTypeOf<BridgeApiRequest['method']>();
    expectTypeOf<Parameters<ApiFetch>[0]['path']>().toEqualTypeOf<BridgeApiRequest['path']>();
    expectTypeOf<HostAdapter['insets']>().toEqualTypeOf<EventPayloadOf<'insets'>>();
  });

  it('onBack: boolean consumption <-> back res handled|exit', () => {
    expectTypeOf<ReturnType<Parameters<HostAdapter['onBack']>[0]>>().toEqualTypeOf<boolean>();
    expectTypeOf<ResultOf<'back'>>().toEqualTypeOf<'handled' | 'exit'>();
  });

  it('reader consumers (WP2.4-A2): ShareHost, resolveUrl and storage.local', () => {
    expectTypeOf<ShareHost>().toEqualTypeOf<Pick<HostAdapter, 'share' | 'resolveUrl' | 'clipboard'>>();
    expectTypeOf<NonNullable<ShareHost['share']>>().toEqualTypeOf<NonNullable<HostAdapter['share']>>();
    expectTypeOf<NonNullable<HostAdapter['resolveUrl']>>().toEqualTypeOf<(path: string) => string>();
    expectTypeOf<HostAdapter['storage']['local']>().toEqualTypeOf<HostStorage>();
    expectTypeOf<ReturnType<HostStorage['get']>>().toEqualTypeOf<string | null | undefined>();
  });
});
