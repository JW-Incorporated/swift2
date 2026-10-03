import type { ApiFetch, ApiResponse } from '@swift2/content';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { HostAdapter, NotificationPrefs } from '../host/types';
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
import type { BridgeApiRequest, ExternalUrl, WebPath } from './validate';

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

  it('runtime: registered maps match the type lists', () => {
    const handlers: HandlerMap = {
      navigate: async () => ({ ok: true, value: null }),
      share: async () => ({ ok: true, value: null }),
      haptic: async () => ({ ok: true, value: null }),
      openExternal: async () => ({ ok: true, value: null }),
      'notifications.status': async () => ({ ok: true, value: 'granted' }),
      'notifications.request': async () => ({ ok: true, value: 'granted' }),
      'notifications.register': async () => ({ ok: true, value: null }),
      'notifications.updatePrefs': async () => ({ ok: true, value: null }),
      api: async () => ({ ok: true, value: { status: 200, headers: {}, body: '' } }),
      cancel: async () => ({ ok: true, value: null }),
    };
    const responders: ResponderMap = { back: async () => ({ ok: true, value: 'handled' }) };
    expect(Object.keys(handlers).sort()).toEqual([...DOM_COMMAND_TYPES].sort());
    expect(Object.keys(responders).sort()).toEqual([...NATIVE_COMMAND_TYPES].sort());
    expect([...COMMAND_TYPES].sort()).toEqual([...DOM_COMMAND_TYPES, ...NATIVE_COMMAND_TYPES].sort());
    expect(EVENT_TYPES).toEqual(expect.arrayContaining([...NATIVE_EVENT_TYPES, 'ready', 'diag', 'ack']));
  });
});

describe('leg 3: HostAdapter <-> PayloadOf/ResultOf (void <-> null)', () => {
  type Share = NonNullable<HostAdapter['share']>;
  type Haptic = NonNullable<HostAdapter['haptic']>;
  type Open = NonNullable<HostAdapter['openExternal']>;
  type Notif = NonNullable<HostAdapter['notifications']>;

  it('navigate(path, {replace}) <-> navigate {path, replace}', () => {
    expectTypeOf<WebPath>().toExtend<Parameters<HostAdapter['navigate']>[0]>();
    expectTypeOf<NonNullable<Parameters<HostAdapter['navigate']>[1]>['replace']>().toEqualTypeOf<
      PayloadOf<'navigate'>['replace']
    >();
    expectTypeOf<ReturnType<HostAdapter['navigate']>>().toEqualTypeOf<void>();
    expectTypeOf<ResultOf<'navigate'>>().toEqualTypeOf<null>();
  });

  it('share/haptic/openExternal', () => {
    expectTypeOf<Parameters<Share>[0]>().toEqualTypeOf<PayloadOf<'share'>>();
    expectTypeOf<Awaited<ReturnType<Share>>>().toEqualTypeOf<void>();
    expectTypeOf<ResultOf<'share'>>().toEqualTypeOf<null>();
    expectTypeOf<Parameters<Haptic>[0]>().toEqualTypeOf<PayloadOf<'haptic'>['kind']>();
    expectTypeOf<ExternalUrl>().toExtend<Parameters<Open>[0]>();
    expectTypeOf<PayloadOf<'openExternal'>['url']>().toEqualTypeOf<ExternalUrl>();
    expectTypeOf<ResultOf<'haptic'> & ResultOf<'openExternal'>>().toEqualTypeOf<null>();
  });

  it('notifications.*', () => {
    expectTypeOf<Awaited<ReturnType<Notif['status']>>>().toEqualTypeOf<ResultOf<'notifications.status'>>();
    expectTypeOf<Awaited<ReturnType<Notif['request']>>>().toEqualTypeOf<ResultOf<'notifications.request'>>();
    expectTypeOf<Awaited<ReturnType<Notif['register']>>>().toEqualTypeOf<void>();
    expectTypeOf<ResultOf<'notifications.register'>>().toEqualTypeOf<null>();
    expectTypeOf<Parameters<Notif['updatePrefs']>[0]>().toEqualTypeOf<PayloadOf<'notifications.updatePrefs'>['prefs']>();
    expectTypeOf<PayloadOf<'notifications.updatePrefs'>['prefs']>().toEqualTypeOf<NotificationPrefs>();
    expectTypeOf<ResultOf<'notifications.updatePrefs'>>().toEqualTypeOf<null>();
  });

  it('apiFetch and insets', () => {
    expectTypeOf<Awaited<ReturnType<ApiFetch>>>().toEqualTypeOf<ResultOf<'api'>>();
    expectTypeOf<ResultOf<'api'>>().toEqualTypeOf<ApiResponse>();
    expectTypeOf<Parameters<ApiFetch>[0]['method']>().toEqualTypeOf<BridgeApiRequest['method']>();
    expectTypeOf<Parameters<ApiFetch>[0]['path']>().toEqualTypeOf<BridgeApiRequest['path']>();
    expectTypeOf<HostAdapter['insets']>().toEqualTypeOf<EventPayloadOf<'insets'>>();
  });

  it('onBack: boolean consumption <-> back res handled|exit', () => {
    expectTypeOf<ReturnType<Parameters<HostAdapter['onBack']>[0]>>().toEqualTypeOf<boolean>();
    expectTypeOf<ResultOf<'back'>>().toEqualTypeOf<'handled' | 'exit'>();
  });
});
