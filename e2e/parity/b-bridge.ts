import { ENTRY_JS, NO_BRIDGE_CALL } from './b-api';
import { BASE } from './env';
import type { Page } from '@playwright/test';

/** What the stubbed native host answers on side b: the OS push permission, the persisted "offered" flag, and the inbox fetch. */
export interface NotificationBridgeStub {
  permission: 'granted' | 'undetermined';
  offered: boolean;
  /** `pending` never answers (the loading state); otherwise the HTTP status and JSON body of GET /api/notifications/inbox. */
  inbox: 'pending' | { status: number; json: unknown };
}

/**
 * Side b in a plain browser has NO_BRIDGE (every call fails closed), so the app-only notification surfaces never mount.
 * Same in-flight bundle patch as stubBridgeApiOnB (b-api.ts), but answering the notification calls and the inbox api path.
 * Anything else still fails closed.
 */
export async function stubNotificationBridgeOnB(page: Page, stub: NotificationBridgeStub): Promise<void> {
  await page.addInitScript((s) => {
    const fail = { ok: false, error: { code: 'failed', message: 'no bridge' } };
    (window as unknown as { __parityApi: unknown }).__parityApi = (type: string, payload: { req?: { path?: string } }) => {
      if (type === 'notifications.status') return Promise.resolve({ ok: true, value: s.permission });
      if (type === 'notifications.onboardingOffered') return Promise.resolve({ ok: true, value: { offered: s.offered } });
      if (type === 'notifications.markOnboardingOffered') return Promise.resolve({ ok: true, value: null });
      if (type === 'api' && payload.req?.path === '/api/notifications/inbox') {
        if (s.inbox === 'pending') return new Promise(() => {});
        return Promise.resolve({
          ok: true,
          value: { status: s.inbox.status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(s.inbox.json) },
        });
      }
      return Promise.resolve(fail);
    };
  }, stub);
  await page.route(
    (u) => u.origin === BASE.b && ENTRY_JS.test(u.pathname),
    async (route) => {
      const response = await route.fetch();
      const js = await response.text();
      if (!NO_BRIDGE_CALL.test(js)) throw new Error('parity: NO_BRIDGE.call was not found in the b entry bundle (AppReader changed?)');
      await route.fulfill({ response, body: js.replace(NO_BRIDGE_CALL, 'call:async(t,e)=>window.__parityApi(t,e)') });
    },
  );
}
