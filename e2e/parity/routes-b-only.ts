import { stubNotificationBridgeOnB, type NotificationBridgeStub } from './b-bridge';
import { ROUTES, type AOnlyRoute } from './routes';
import { EXTRA_ROUTES } from './routes-coverage';
import { assertNoBaselineCollisions } from './sides';
import { expect } from '@playwright/test';

// App-only surfaces (sides: 'b'): the website has no notifications host, so they have b-* baselines and token assertions
// (b-only.spec.ts) but no a-vs-b compare. All of them open over the settings overlay (the path the parity harness already loads
// on b), with the native host's notification answers and the inbox fetch stubbed (b-bridge.ts).
export const INBOX_DIALOG = '[role="dialog"][aria-label="Notification inbox"]';
export const OFFER_DIALOG = '[role="dialog"][aria-label="Stay in the loop"]';
const SETTINGS_PATH = '/settings/notifications';

const ROW = (n: number, category: string, title: string, body: string, minutesAgo: number) => ({
  id: `parity-inbox-${n}`,
  category,
  tier: 1,
  title,
  body,
  deep_link: 'https://www.longlivets.com/?current=inbox',
  available_at: new Date(Date.UTC(2026, 0, 15, 18, 0) - minutesAgo * 60_000).toISOString(),
});
// The inbox is read-only (InboxEventRow has no read/unread state), so the list covers a fresh row, a long body that wraps,
// and an unknown category that falls back to the humanised raw id.
const ITEMS = [
  ROW(1, 'song_drop', 'A new song just dropped', 'Listen now on every platform.', 5),
  ROW(2, 'tour_news', 'Tour dates announced', 'The new run of dates is live, with presale details for fans who signed up for the mailing list last year.', 3 * 60),
  ROW(3, 'some_future_category', 'Something else happened', 'Fallback label for a category the app does not know yet.', 26 * 60),
];

const inboxRoute = (name: string, inbox: NotificationBridgeStub['inbox'], ready: string | RegExp): AOnlyRoute => ({
  name,
  path: SETTINGS_PATH,
  root: 'main',
  sides: 'b',
  clip: INBOX_DIALOG,
  init: (page) => stubNotificationBridgeOnB(page, { permission: 'granted', offered: true, inbox }),
  prepare: async (page) => {
    await page.getByRole('button', { name: 'Notification inbox' }).click();
    await expect(page.locator(INBOX_DIALOG)).toBeVisible();
    await expect(page.locator(INBOX_DIALOG).getByText(ready)).toBeVisible();
  },
});

export const B_ONLY_ROUTES: readonly AOnlyRoute[] = [
  inboxRoute('inbox-empty', { status: 200, json: { events: [] } }, /Nothing here yet/),
  inboxRoute('inbox-loading', 'pending', /Loading/),
  inboxRoute('inbox-list', { status: 200, json: { events: ITEMS } }, 'A new song just dropped'),
  inboxRoute('inbox-error', { status: 500, json: {} }, /load the inbox \(HTTP 500\)/),
  {
    name: 'onboarding-offer',
    path: SETTINGS_PATH,
    root: 'main',
    sides: 'b',
    clip: OFFER_DIALOG,
    init: (page) => stubNotificationBridgeOnB(page, { permission: 'undetermined', offered: false, inbox: 'pending' }),
    prepare: async (page) => {
      await expect(page.locator(OFFER_DIALOG)).toBeVisible();
    },
  },
];
assertNoBaselineCollisions(ROUTES, [...EXTRA_ROUTES, ...B_ONLY_ROUTES]);
