import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BASE, fixture, repo } from './env';
import { assertNoBaselineCollisions, type Sides } from './sides';
import { expect, type Page } from '@playwright/test';

/** `root` is the element both sides share: the era stream (`main`) or the open moment (`dialog`). */
export const ROUTES = [
  { name: 'home', path: '/', root: 'main' },
  { name: 'item', path: `/?item=${fixture.itemId}`, root: '[role="dialog"]' },
] as const;
export type Route = (typeof ROUTES)[number];
export type RouteLike = { readonly name: string; readonly path: string; readonly root: string };

const frozenTracks = JSON.parse(
  readFileSync(resolve(repo, 'scripts/parity/fixture/content/frozen/tracks.json'), 'utf-8'),
) as { eraId: string; tracks: { trackNumber?: number; title: string }[] }[];
// Mirrors trackKey() in packages/experience/src/track-guide.ts; importing @swift2/experience needs sync:content's generated files, which the baseline job does not run.
const SONG_TRACK = frozenTracks.find((e) => e.eraId === 'fearless')!.tracks[1]!;
const SONG_KEY = `fearless::${SONG_TRACK.trackNumber ?? 'x'}::${SONG_TRACK.title}`;

/** Side-a-only baselines (One UI PR0, WP2.5-2.8): surfaces side b does not render yet. `prepare` runs after the route settles; `clip` (when set) is captured instead of the root. */
export interface AOnlyRoute extends RouteLike {
  prepare?: (page: Page) => Promise<void>;
  init?: (page: Page) => Promise<void>;
  clip?: string;
  /** Default 'a'. 'both' adds the a-vs-b viewport compare and b-* baselines (a slice D sets it; see docs/one-ui/parity.md). */
  sides?: Sides;
}
/**
 * Side b serves only the DOM entry's index.html, which the reader seeds its legal path from (dom-path.ts reads the page
 * pathname): answer the legal paths on b with that file, keeping the URL. Side a (the real web routes) is untouched.
 */
// Side b also renders the reader's own <main> under the legal layer, so the root is the legal document's <main> (its breadcrumb is its first child on both sides).
const LEGAL_MAIN = 'main:has(> nav[aria-label="Breadcrumb"])';
const LEGAL_PATHS = ['/privacy', '/terms', '/support'];
const serveLegalOnB: NonNullable<AOnlyRoute['init']> = async (page) => {
  await page.route(
    (u) => u.origin === BASE.b && LEGAL_PATHS.includes(u.pathname),
    async (route) => route.fulfill({ response: await route.fetch({ url: `${BASE.b}/${new URL(route.request().url()).search}` }) }),
  );
};
const threadLens = (id: string): AOnlyRoute => ({ name: `lens-${id}`, path: `/?lens=${id}`, root: 'main' });
const SEARCH_DIALOG = '[role="dialog"][aria-label="Search the archive"]';
const SEARCH_OPEN_BUTTON = 'button[aria-label="Search the archive (press /)"]';
export const A_ONLY_ROUTES: readonly AOnlyRoute[] = [
  { name: 'item-video', path: '/?item=vault-tloas-the-fate-of-ophelia-video-premieres', root: '[role="dialog"]', sides: 'both' },
  {
    name: 'item-social',
    path: '/?item=vault-tloas-the-ring-designer-gets-a-wedding-invite-of-her-own',
    root: '[role="dialog"]',
    sides: 'both',
  },
  { name: 'threads', path: '/?mode=threads', root: 'main' },
  threadLens('love-story'),
  threadLens('fashion'),
  threadLens('taylors-version'),
  threadLens('easter-eggs'),
  threadLens('hidden-clues'),
  threadLens('the-proposal'),
  {
    name: 'crossing',
    path: '/?mode=threads',
    root: 'main',
    prepare: async (page) => {
      await page.getByRole('button', { name: /Where threads cross/ }).first().click();
    },
  },
  { name: 'guide', path: '/?guide=fearless', root: '[role="dialog"][aria-label$="track guide"]', sides: 'both' },
  {
    name: 'song',
    path: `/?song=${encodeURIComponent(SONG_KEY)}`,
    root: '[role="dialog"][aria-label$="song detail"]',
    sides: 'both',
  },
  { name: 'theories', path: '/?theories=fearless', root: '[role="dialog"][aria-label$="theories and easter eggs"]' },
  {
    name: 'search-open',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: SEARCH_DIALOG,
    prepare: async (page) => {
      await page.locator(SEARCH_OPEN_BUTTON).first().click();
      await expect(page.locator(SEARCH_DIALOG)).toBeVisible();
    },
  },
  {
    name: 'search-results',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: SEARCH_DIALOG,
    prepare: async (page) => {
      await page.locator(SEARCH_OPEN_BUTTON).first().click();
      await page.locator(`${SEARCH_DIALOG} [role="combobox"]`).fill('fearless');
      await expect(page.locator(`${SEARCH_DIALOG} [role="listbox"] [role="option"]`).first()).toBeVisible();
    },
  },
];

/** Element-clip selectors for the A-only captures (existing roles, aria labels and headings only). */
export const ITEM_SOCIAL = A_ONLY_ROUTES[1]!;
export const RAIL_CLIP = '.era-card:has(> div:has-text("Keep reading"))';
export const FOLLOW_CLIP = '.era-card:has(> div:has-text("Part of a bigger story"))';
export const LIGHTBOX_CLIP = '[role="dialog"][aria-label="Photo viewer"]';
export const SCRUBBER_CLIP = '[role="slider"][aria-label="Career timeline"]';
export const SONG_NAV_CLIP = '[role="dialog"][aria-label$="song detail"] nav[aria-label="Track overlay navigation"]';
export const SEARCH_ROW_CLIP = `${SEARCH_DIALOG} div:has(> [role="combobox"])`;

const CLOWN_ANSWER_NDJSON =
  JSON.stringify({
    type: 'answer',
    answer: {
      kind: 'take',
      theoryName: null,
      segments: [
        { role: 'stance', text: 'Parity fixture stance.' },
        { role: 'argument', text: 'Parity fixture argument, fixed for the screenshot.' },
      ],
      delulu: 3,
      sources: [],
      investigation: [],
    },
  }) + '\n';

/** Side-a-only baselines (One UI PR0-beta, WP2.9-2.13): merch, community, clownbot, mood, notification settings and the legal pages. */
export const A_ONLY_ROUTES_BETA: readonly AOnlyRoute[] = [
  { name: 'merch', path: '/?mode=merch', root: 'main', sides: 'both' },
  { name: 'community', path: '/?mode=community', root: 'main', sides: 'both' },
  { name: 'clownbot', path: '/?mode=clownbot', root: 'main', sides: 'both' },
  {
    name: 'clownbot-transcript',
    path: '/?mode=clownbot',
    root: 'main',
    prepare: async (page) => {
      await page.route('**/api/clown', (route) =>
        route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: CLOWN_ANSWER_NDJSON }),
      );
      await page.locator('#clown-input').fill('parity question');
      await page.getByRole('button', { name: 'Send to clown bot' }).click();
      await expect(page.getByText('Parity fixture argument, fixed for the screenshot.')).toBeVisible();
    },
  },
  // TODO(One UI 2.11-D2): sides 'both' once the b footer matches a on a short page (iPad: footer text offset ~1px; the pill is fixed by #5000).
  { name: 'mood', path: '/?mode=mood', root: 'main' },
  {
    name: 'settings-notifications',
    path: '/settings/notifications',
    root: 'main',
    sides: 'both',
    init: async (page) => {
      await page.addInitScript(() => {
        const define = (target: object, key: string, value: unknown) =>
          Object.defineProperty(target, key, { configurable: true, get: () => value });
        class FakeNotification {
          static permission = 'default';
          static requestPermission() {
            return Promise.resolve('default');
          }
        }
        if ('Notification' in window) define(window.Notification, 'permission', 'default');
        else define(window, 'Notification', FakeNotification);
        if (!('PushManager' in window)) define(window, 'PushManager', class PushManager {});
        if (!('serviceWorker' in navigator)) define(navigator, 'serviceWorker', {});
      });
    },
  },
  { name: 'privacy', path: '/privacy', root: LEGAL_MAIN, init: serveLegalOnB, sides: 'both' },
  { name: 'terms', path: '/terms', root: LEGAL_MAIN, init: serveLegalOnB, sides: 'both' },
  { name: 'support', path: '/support', root: LEGAL_MAIN, init: serveLegalOnB, sides: 'both' },
];

/** One element per new surface for the 1px negatives (a root clip is under the iPad tolerance). */
export const BETA_NEGATIVE_TARGETS: Record<string, string> = {
  merch: '.merch-shell > div:first-child',
  community: 'main h1',
  clownbot: 'div:has(> button[aria-label="Expand to full screen"])',
  'clownbot-transcript': 'div:has(> button[aria-label="Expand to full screen"])',
  mood: 'form:has(#mood-input)',
  'settings-notifications': 'main h1',
  privacy: `${LEGAL_MAIN} h1`,
  terms: `${LEGAL_MAIN} h1`,
  support: `${LEGAL_MAIN} h1`,
};

assertNoBaselineCollisions(ROUTES, [...A_ONLY_ROUTES, ...A_ONLY_ROUTES_BETA]);
