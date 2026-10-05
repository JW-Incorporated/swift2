import type { Page } from '@playwright/test';
import { A_ONLY_ROUTES_BETA, expect, openAOnlyRoute, realInsets, test } from './helpers';
import { B_ONLY_ROUTES, INBOX_DIALOG, OFFER_DIALOG } from './routes-b-only';

// App-only surfaces (inbox, push-permission offer): design-token assertions (the side-b baselines are in baseline.spec.ts).
const SETTINGS = A_ONLY_ROUTES_BETA.find((r) => r.name === 'settings-notifications')!;
const byName = (name: string) => B_ONLY_ROUTES.find((r) => r.name === name)!;

const TEXT = ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'color'] as const;
const PILL = [...TEXT, 'borderTopColor', 'borderTopWidth', 'borderTopLeftRadius', 'paddingTop', 'paddingLeft'] as const;
type Style = Record<string, string>;
const styleOf = (page: Page, selector: string, props: readonly string[]): Promise<Style> =>
  page.locator(selector).first().evaluate((el, ps) => {
    const cs = getComputedStyle(el) as unknown as Record<string, string>;
    return Object.fromEntries(ps.map((p) => [p, cs[p]!]));
  }, props);
const pick = (s: Style, keys: readonly string[]): Style => Object.fromEntries(keys.map((k) => [k, s[k]!]));

// The website's Settings page is the style source of truth (same NEUTRAL palette and fonts): the app-only surfaces must use
// its heading, body-text and pill-button styles, not just look similar in a screenshot.
test('app-only surfaces use the website Settings page tokens', async ({ pages }, testInfo) => {
  await openAOnlyRoute(pages.a, SETTINGS, 'a');
  const aHeading = await styleOf(pages.a, 'main h1', TEXT);
  const aBody = await styleOf(pages.a, 'main section > p', ['fontFamily', 'color']);
  const aPill = await styleOf(pages.a, 'main a[href="/"]', PILL);
  const aBg = await pages.a.evaluate(() => getComputedStyle(document.body).backgroundColor);

  await openAOnlyRoute(pages.b, byName('inbox-empty'), 'b', realInsets(testInfo));
  expect(await styleOf(pages.b, `${INBOX_DIALOG} h1`, TEXT), 'inbox heading').toEqual(aHeading);
  expect(await styleOf(pages.b, `${INBOX_DIALOG} p`, ['fontFamily', 'color']), 'inbox body text').toEqual(aBody);
  expect(await styleOf(pages.b, `${INBOX_DIALOG} header button`, PILL), 'inbox Back pill').toEqual(aPill);
  expect(await styleOf(pages.b, INBOX_DIALOG, ['backgroundColor']), 'inbox background').toEqual({ backgroundColor: aBg });

  await openAOnlyRoute(pages.b, byName('onboarding-offer'), 'b', realInsets(testInfo));
  const headingKeys = ['fontFamily', 'fontWeight', 'color'];
  expect(pick(await styleOf(pages.b, `${OFFER_DIALOG} h2`, TEXT), headingKeys), 'offer heading').toEqual(pick(aHeading, headingKeys));
  expect(await styleOf(pages.b, `${OFFER_DIALOG} p`, ['fontFamily']), 'offer body font').toEqual({ fontFamily: aBody.fontFamily });
  const pillKeys = PILL.filter((k) => k !== 'letterSpacing' && k !== 'fontFamily');
  expect(pick(await styleOf(pages.b, `${OFFER_DIALOG} button:has-text("Customize")`, PILL), pillKeys), 'offer Customize pill').toEqual(pick(aPill, pillKeys));
  expect(await styleOf(pages.b, OFFER_DIALOG, ['backgroundColor']), 'offer background').toEqual({ backgroundColor: aBg });
});
