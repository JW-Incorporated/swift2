import {
  buildShareUrl,
  clownbotShareCopy,
  communityShareCopy,
  getEra,
  getThread,
  merchShareCopy,
  momentShareCopy,
  moodShareCopy,
  siteShareCopy,
  theoryGuideShareCopy,
  threadsGalleryShareCopy,
  trackGuideShareCopy,
  trackShareCopy,
  type ShareCopy,
  type ShareTarget,
} from '@swift2/experience';
import type { ReaderQueries } from '@swift2/experience/reader-snapshot';
import {
  triggerImageShare,
  triggerWebShare,
  type ImageShareResult,
  type WebSharePayload,
  type WebShareResult,
} from './share-action';
import type { HostAdapter } from '../../host/types';
import { shareCardPath, type ShareCardSize, type ShareCardSource } from './share-card-params';

/** The lookups a share payload needs, from the reader snapshot (`useReader()`); required, never defaulted. */
export type SharePayloadData = Pick<ReaderQueries, 'getContentItem' | 'resolveTrackKey'>;

/**
 * The host members a share needs (`useHost()`). Omitted on the web: the
 * navigator.share / clipboard path and same-origin URLs are unchanged.
 */
export type ShareHost = Pick<HostAdapter, 'share' | 'resolveUrl' | 'clipboard' | 'currentUrl'>;

/**
 * The query-free logical path to share. A host that owns its own routing (the app: the WebView document is a
 * file:// bundle URL) reports it through `currentUrl()`; `window.location.pathname` is only the web's answer.
 */
function logicalPathname(host: ShareHost | undefined): string {
  const current = host?.currentUrl?.();
  if (current) {
    try {
      return new URL(current, 'https://logical.invalid').pathname;
    } catch {
      // fall through
    }
  }
  return host?.resolveUrl ? '/' : window.location.pathname;
}

function shareBaseUrl(host: ShareHost | undefined): string {
  if (typeof window === 'undefined') return host?.resolveUrl ? host.resolveUrl('/') : '/';
  const path = logicalPathname(host);
  return host?.resolveUrl ? host.resolveUrl(path) : window.location.origin + path;
}

export function sharePayloadForTarget(
  target: ShareTarget,
  baseUrl: string,
  data: SharePayloadData,
): WebSharePayload {
  let copy: ShareCopy;
  if (target.kind === 'item') {
    const item = data.getContentItem(target.itemId);
    copy = item ? momentShareCopy(item, getEra(item.eraId)) : siteShareCopy();
  } else if (target.kind === 'era') {
    const era = getEra(target.eraId);
    copy = {
      title: `${era.name} — Long Live`,
      text: `${era.name} (${era.yearLabel}) — ${era.tagline} Explore it on Long Live.`,
    };
  } else if (target.kind === 'lens') {
    const thread = getThread(target.lensId);
    copy = { title: `${thread.title} — Long Live`, text: `${thread.what} — on Long Live.` };
  } else if (target.kind === 'track') {
    const resolved = data.resolveTrackKey(target.trackKey);
    copy = resolved ? trackShareCopy(resolved.track, getEra(resolved.eraId)) : siteShareCopy();
  } else if (target.kind === 'trackGuide') {
    copy = trackGuideShareCopy(getEra(target.eraId));
  } else if (target.kind === 'theoryGuide') {
    copy = theoryGuideShareCopy(getEra(target.eraId));
  } else if (target.kind === 'threads') {
    copy = threadsGalleryShareCopy();
  } else if (target.kind === 'mood') {
    copy = moodShareCopy();
  } else if (target.kind === 'clownbot') {
    copy = clownbotShareCopy();
  } else if (target.kind === 'community') {
    copy = communityShareCopy();
  } else if (target.kind === 'merch') {
    copy = merchShareCopy();
  } else {
    copy = siteShareCopy();
  }
  return { ...copy, url: buildShareUrl(target, baseUrl) };
}

export async function shareTarget(
  target: ShareTarget,
  data: SharePayloadData,
  host?: ShareHost,
): Promise<WebShareResult> {
  const payload = sharePayloadForTarget(target, shareBaseUrl(host), data);
  const result = await triggerWebShare(payload, {
    share: host?.share ? async (p) => void (await host.share!(p)) : navigator.share?.bind(navigator),
    copyText: host?.clipboard
      ? (text) => host.clipboard!.writeText(text)
      : navigator.clipboard?.writeText.bind(navigator.clipboard),
  });
  if (result === 'fallback' || result === 'unavailable') {
    window.dispatchEvent(
      new CustomEvent<WebSharePayload & { copied: boolean }>('longlive-share-fallback', {
        detail: { ...payload, copied: result === 'fallback' },
      }),
    );
  }
  return result;
}

function downloadFile(file: File): void {
  const href = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = href;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

// Card PNGs fetched ahead of the tap. iOS Safari only honours navigator.share
// inside the click's transient activation, which a fetch + blob round trip
// can outlive — so the menu prefetches when it opens and the tap finds a
// ready File. A small FIFO bound keeps memory modest (a card is ~300 KB).
const MAX_PREFETCHED = 6;
const readyCards = new Map<string, File>();
const pendingCards = new Map<string, Promise<File | null>>();

async function fetchCardFile(
  path: string,
  size: ShareCardSize,
  resolveUrl: (path: string) => string,
): Promise<File | null> {
  try {
    const res = await fetch(resolveUrl(path));
    if (!res.ok) return null;
    return new File([await res.blob()], `long-live-${size}.png`, { type: 'image/png' });
  } catch {
    return null;
  }
}

/** Start (or reuse) the fetch for a card so a later share tap needs no await. */
export function prefetchShareCard(
  source: ShareCardSource,
  size: ShareCardSize,
  resolveUrl: (path: string) => string = (path) => path,
): Promise<File | null> {
  const path = shareCardPath(source, size);
  const ready = readyCards.get(path);
  if (ready) return Promise.resolve(ready);
  const pending = pendingCards.get(path);
  if (pending) return pending;
  const started = fetchCardFile(path, size, resolveUrl).then((file) => {
    pendingCards.delete(path);
    if (file) {
      readyCards.set(path, file);
      if (readyCards.size > MAX_PREFETCHED) readyCards.delete(readyCards.keys().next().value!);
    }
    return file;
  });
  pendingCards.set(path, started);
  return started;
}

/** Test seam: forget every prefetched card. */
export function clearPrefetchedShareCards(): void {
  readyCards.clear();
  pendingCards.clear();
}

/**
 * "Share as image": hand the deterministic card for `source` to the native
 * share sheet (or save it). The caption + deep link come from the same payload
 * a plain link share would use, so the image always points back at the page it
 * was made from. When the card was prefetched, no `await` runs before
 * `navigator.share`, so the call happens synchronously inside the tap.
 */
export async function shareCardImage(
  target: ShareTarget,
  source: ShareCardSource,
  size: ShareCardSize,
  data: SharePayloadData,
  host?: ShareHost,
): Promise<ImageShareResult | 'copied' | 'error'> {
  const payload = sharePayloadForTarget(target, shareBaseUrl(host), data);
  // The bridge carries a card URL, never bytes: the host downloads it and shares the file.
  if (host?.share) {
    try {
      const shared = await host.share(
        host.resolveUrl ? { ...payload, image: { url: host.resolveUrl(shareCardPath(source, size)) } } : payload,
      );
      return shared?.imageCopied === true ? 'copied' : 'native';
    } catch (error) {
      return error instanceof Error && error.name === 'AbortError' ? 'cancelled' : 'error';
    }
  }
  const file =
    readyCards.get(shareCardPath(source, size)) ?? (await prefetchShareCard(source, size, host?.resolveUrl));
  if (!file) return 'error';
  // Native file sharing only on touch devices: desktop Chromium reports
  // canShare({files}) too, but opens an OS share dialog where a saved PNG is
  // what people expect.
  const touch =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  return triggerImageShare(
    file,
    { title: payload.title, text: `${payload.text} ${payload.url}` },
    {
      canShareFiles: touch ? navigator.canShare?.bind(navigator) : undefined,
      share: navigator.share?.bind(navigator),
      download: downloadFile,
    },
  );
}
