import {
  buildShareUrl,
  clownbotShareCopy,
  communityShareCopy,
  getEra,
  getThread,
  merchShareCopy,
  momentShareCopy,
  moodShareCopy,
  resolveTrackKey,
  siteShareCopy,
  theoryGuideShareCopy,
  threadsGalleryShareCopy,
  trackGuideShareCopy,
  trackShareCopy,
  type ShareCopy,
  type ShareTarget,
} from '@swift2/experience';
import { getContentItem } from './content';
import {
  triggerImageShare,
  triggerWebShare,
  type ImageShareResult,
  type WebSharePayload,
  type WebShareResult,
} from './share-action';
import { shareCardPath, type ShareCardSize, type ShareCardSource } from './share-card-params';

export function sharePayloadForTarget(target: ShareTarget, baseUrl: string): WebSharePayload {
  let copy: ShareCopy;
  if (target.kind === 'item') {
    const item = getContentItem(target.itemId);
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
    const resolved = resolveTrackKey(target.trackKey);
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

export async function shareTarget(target: ShareTarget): Promise<WebShareResult> {
  const payload = sharePayloadForTarget(target, window.location.origin + window.location.pathname);
  const result = await triggerWebShare(payload, {
    share: navigator.share?.bind(navigator),
    copyText: navigator.clipboard?.writeText.bind(navigator.clipboard),
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

/**
 * "Share as image": fetch the deterministic card for `source` and hand the PNG
 * to the native share sheet (or save it). The caption + deep link come from
 * the same payload a plain link share would use, so the image always points
 * back at the page it was made from.
 */
export async function shareCardImage(
  target: ShareTarget,
  source: ShareCardSource,
  size: ShareCardSize,
): Promise<ImageShareResult | 'error'> {
  const payload = sharePayloadForTarget(target, window.location.origin + window.location.pathname);
  let file: File;
  try {
    const res = await fetch(shareCardPath(source, size));
    if (!res.ok) return 'error';
    file = new File([await res.blob()], `long-live-${size}.png`, { type: 'image/png' });
  } catch {
    return 'error';
  }
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
