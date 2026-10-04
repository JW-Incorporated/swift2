import { expect, type Page } from '@playwright/test';

/** Hydration effects (client-only text) land after React owns the DOM: wait until the root's text and size hold still. */
export async function quiet(page: Page, route: { root: string }): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const w = window as unknown as { __quiet?: { sig: string; n: number } };
      const el = document.querySelector(sel) as HTMLElement | null;
      const sig = el ? `${el.innerText.slice(0, 3000)}|${Math.round(el.getBoundingClientRect().height)}` : '';
      w.__quiet = w.__quiet?.sig === sig ? { sig, n: w.__quiet.n + 1 } : { sig, n: 0 };
      return w.__quiet.n >= 5;
    },
    route.root,
    { polling: 100 },
  );
}

/** Wait for React to own the page (the web build is server-rendered; hydration swaps client-only text). */
export async function hydrated(page: Page, route: RouteLike): Promise<void> {
  await page.waitForFunction((sel) => {
    const owned = (el: Element | null) =>
      !!el && Object.keys(el).some((k) => k.startsWith('__reactProps$'));
    const root = document.querySelector(sel);
    const button = root?.querySelector('button') ?? null;
    return owned(root) && (button === null || owned(button));
  }, route.root);
}

export const CLIP_HEIGHT = 480;
const IMAGE_TIMEOUT_MS = 10_000;

/**
 * Block until every image the capture can show is loaded and decoded: <img> and CSS background-image
 * in the root's first screen. A broken, undecodable or stuck image fails the test naming its URL, so it
 * can never be baked into a baseline unpainted (or silently pass).
 */
export async function imagesReady(page: Page, rootSel: string): Promise<void> {
  const problems = await page.evaluate(
    async ({ sel, clip, timeout }) => {
      const root = (document.querySelector(sel) ?? document.body) as HTMLElement;
      const limit = Math.max(window.innerHeight, root.getBoundingClientRect().top + window.scrollY + clip);
      const inRegion = (el: Element) => {
        const r = el.getBoundingClientRect();
        return (
          r.bottom + window.scrollY > 0 &&
          r.top + window.scrollY < limit &&
          r.right > 0 &&
          r.left < window.innerWidth
        );
      };
      const failed: string[] = [];
      const pending = new Set<string>();
      const jobs: Promise<void>[] = [];
      const track = (url: string, job: Promise<void>) => {
        pending.add(url);
        jobs.push(
          job.then(
            () => void pending.delete(url),
            (e: unknown) => {
              pending.delete(url);
              failed.push(`${url} (${e instanceof Error ? e.message : String(e)})`);
            },
          ),
        );
      };
      for (const img of Array.from(root.querySelectorAll('img')).filter(inRegion)) {
        if (img.loading === 'lazy') img.loading = 'eager';
        track(
          img.currentSrc || img.src || '(no src)',
          (async () => {
            if (!img.complete) {
              await new Promise<void>((ok, bad) => {
                img.addEventListener('load', () => ok(), { once: true });
                img.addEventListener('error', () => bad(new Error('load error')), { once: true });
                if (img.complete) ok();
              });
            }
            if (img.naturalWidth === 0) throw new Error('broken image');
            // decode() can reject for an SVG with no intrinsic size; a complete image with a width is loaded.
            await img.decode().catch((e: unknown) => {
              if (!(img.complete && img.naturalWidth > 0)) throw e;
            });
          })(),
        );
      }
      const bgUrls = new Set<string>();
      for (const el of [root, ...Array.from(root.querySelectorAll('*'))].filter(inRegion)) {
        for (const m of getComputedStyle(el).backgroundImage.matchAll(/url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g)) {
          const u = m[1] ?? m[2] ?? m[3];
          if (u) bgUrls.add(new URL(u, document.baseURI).href);
        }
      }
      for (const url of bgUrls) {
        track(
          url,
          (async () => {
            const bg = new Image();
            bg.src = url;
            await bg.decode().catch((e: unknown) => {
              if (!(bg.complete && bg.naturalWidth > 0)) throw e;
            });
          })(),
        );
      }
      let timer = 0;
      const timedOut = new Promise<void>((r) => {
        timer = window.setTimeout(r, timeout);
      });
      await Promise.race([Promise.all(jobs), timedOut]);
      window.clearTimeout(timer);
      for (const u of pending) failed.push(`${u} (still loading after ${timeout} ms)`);
      return failed;
    },
    { sel: rootSel, clip: CLIP_HEIGHT, timeout: IMAGE_TIMEOUT_MS },
  );
  expect(problems, 'parity: every image in the capture region must load and decode').toEqual([]);
}

/** Wait for every image to paint, then for layout to be quiet for two frames. */
export async function settle(page: Page, rootSel = 'body'): Promise<void> {
  await imagesReady(page, rootSel);
  await page.evaluate(
    () => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))),
  );
}
