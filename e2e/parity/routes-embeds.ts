import { stubBridgeApiOnB } from './b-api';
import { ERA_ART_ORIGIN, type Side } from './env';
import type { AOnlyRoute } from './routes';
import { expect, type Page } from '@playwright/test';

// Embed parity: a third-party player (YouTube, Spotify) is never compared. Every iframe request is answered with one fixed blank
// document on both sides (no network), the iframe is then hidden, and the pixel compare covers the facade frame around it.
// The src each side mounts is asserted separately (embeds.spec.ts): web embeds the provider directly, the app frames the
// site's /embed/<provider>/... wrapper page on its canonical origin (the device error 153 fix, #4954 / #5025).

export interface EmbedRoute extends AOnlyRoute {
  /** Expected iframe src per side. */
  readonly src: Record<Side, RegExp>;
}

const CLIP = '[data-parity-clip]';
const DIALOG = '[role="dialog"]';
const YT_ID = '[\\w-]{11}';
const SPOTIFY_ID = '[A-Za-z0-9]{22}';
const escapeOrigin = ERA_ART_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const FRAME_HOSTS = new Set(['www.youtube-nocookie.com', 'open.spotify.com']);
const FRAME_DOC = '<!doctype html><html><body style="margin:0;background:#222"></body></html>';

/** Answers every embed document (provider direct on a, the wrapper page on b) with the same blank page, so no request leaves the box. */
const stubEmbedFrames: NonNullable<AOnlyRoute['init']> = async (page) => {
  await page.route(
    (u) => FRAME_HOSTS.has(u.hostname) || (u.origin === ERA_ART_ORIGIN && u.pathname.startsWith('/embed/')),
    (route) => route.fulfill({ status: 200, contentType: 'text/html', body: FRAME_DOC }),
  );
};

/** Hides every iframe (its content is third-party, never compared); the src attribute stays for the src assertion. */
const maskIframes = (page: Page): Promise<void> =>
  page.evaluate(() => document.querySelectorAll('iframe').forEach((f) => f.style.setProperty('visibility', 'hidden')));

const show = async (page: Page, selector: string): Promise<void> => {
  const el = page.locator(selector).first();
  await expect(el).toBeVisible();
  await el.scrollIntoViewIfNeeded();
  await el.evaluate((node) => node.setAttribute('data-parity-clip', ''));
  // Mood chat scrolls its form into view with an explicit smooth behaviour (not tamed by the harness's scroll-behavior CSS), so wait
  // until the clip stops moving: a viewport capture taken mid-scroll differs run to run.
  let last = Number.NaN;
  await expect
    .poll(async () => {
      const top = (await el.boundingBox())?.y ?? Number.NaN;
      const still = top === last;
      last = top;
      return still;
    }, { intervals: [150] })
    .toBe(true);
};

const YOUTUBE_SRC = (id: string): Record<Side, RegExp> => ({
  a: new RegExp(`^https://www\\.youtube-nocookie\\.com/embed/${id}\\?autoplay=1&rel=0$`),
  b: new RegExp(`^${escapeOrigin}/embed/youtube/${id}$`),
});

const MOOD_PICK = {
  slug: 'tim-mcgraw',
  title: 'Tim McGraw',
  eraId: 'debut',
  youtubeId: 'GkD20ajVxnY',
  oneLiner: 'A debut goodbye that just wants to be remembered.',
};
const MOOD_ANSWER = JSON.stringify({ kind: 'matches', picks: [MOOD_PICK] });

export const EMBED_ROUTES: readonly EmbedRoute[] = [
  {
    name: 'embed-video-player',
    path: '/?item=vault-tloas-the-fate-of-ophelia-video-premieres',
    root: DIALOG,
    sides: 'both',
    clip: CLIP,
    src: YOUTUBE_SRC(YT_ID),
    init: stubEmbedFrames,
    prepare: async (page) => {
      await page.locator(`${DIALOG} button[aria-label^="Play music video"]`).first().click();
      await expect(page.locator(`${DIALOG} iframe`).first()).toBeAttached();
      await maskIframes(page);
      await show(page, `${DIALOG} figure:has(iframe)`);
    },
  },
  {
    name: 'embed-spotify-compare',
    path: '/?lens=taylors-version',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    src: {
      a: new RegExp(`^https://open\\.spotify\\.com/embed/album/${SPOTIFY_ID}\\?utm_source=generator&theme=0$`),
      b: new RegExp(`^${escapeOrigin}/embed/spotify/album/${SPOTIFY_ID}$`),
    },
    init: stubEmbedFrames,
    prepare: async (page) => {
      await page.locator('main article > button[aria-expanded="false"]').first().click();
      await page.locator('button[aria-label^="Play on Spotify"]:visible').first().click();
      await expect(page.locator('main iframe').first()).toBeAttached();
      await maskIframes(page);
      await show(page, 'main >> text=/^Listen( side by side)?$/ >> xpath=../..');
    },
  },
  {
    name: 'embed-mood-song',
    path: '/?mode=mood',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    src: YOUTUBE_SRC(MOOD_PICK.youtubeId),
    // Side a answers over the network, side b through the bridge (b-api.ts); the two stubs return the same body.
    init: async (page) => {
      await stubEmbedFrames(page);
      await stubBridgeApiOnB(page, { '/api/mood': MOOD_ANSWER });
      await page.route(
        (u) => u.pathname === '/api/mood',
        (route) => route.fulfill({ status: 200, contentType: 'application/json', body: MOOD_ANSWER }),
      );
    },
    prepare: async (page) => {
      await page.locator('#mood-input').fill('parity feeling');
      await page.getByRole('button', { name: 'Find songs' }).click();
      await page.locator('section[aria-label="Songs that match"] button[aria-label$="on YouTube"]').first().click();
      await expect(page.locator('section[aria-label="Songs that match"] iframe').first()).toBeAttached();
      await maskIframes(page);
      await show(page, 'section[aria-label="Songs that match"] article');
    },
  },
];
