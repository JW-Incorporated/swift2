import { BASE } from './env';
import type { Page } from '@playwright/test';

/**
 * Test-only stub of the DOM entry's api path (side b). In a plain browser AppReader hands the reader NO_BRIDGE, whose `call`
 * fails closed, so a page.route stub of /api/* (side a's way) never sees ClownChat's request: it goes through the bridge
 * apiFetch, not the network. The exported entry bundle is patched in flight so that NO_BRIDGE.call answers `window.__parityApi`,
 * which the init script defines and which serves `answers` by api path. A bundle that no longer contains NO_BRIDGE fails loudly.
 */
export const NO_BRIDGE_CALL = /call:async\(\)=>\(0,[\w$]+\.resErr\)\('failed','no bridge'\)/;
export const ENTRY_JS = /^\/_expo\/static\/js\/web\/index-[\w-]+\.js$/;

export async function stubBridgeApiOnB(page: Page, answers: Readonly<Record<string, string>>): Promise<void> {
  await page.addInitScript((byPath) => {
    (window as unknown as { __parityApi: unknown }).__parityApi = async (type: string, payload: { req?: { path?: string } }) => {
      const body = type === 'api' ? byPath[payload.req?.path ?? ''] : undefined;
      if (body === undefined) return { ok: false, error: { code: 'failed', message: 'no bridge' } };
      return { ok: true, value: { status: 200, headers: { 'content-type': 'application/x-ndjson' }, body } };
    };
  }, answers);
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
