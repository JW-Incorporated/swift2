const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
export const VIDEO_PRESENTATION_EXCEPTIONS = new Set([
  'unavailable',
  'removed',
  'rights',
  'privacy',
  'safety',
]);

export function youtubeIdFromUrl(value) {
  if (typeof value !== 'string') return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.+$/, '');
    const pathSegments = url.pathname.split('/').filter(Boolean);
    let candidate = null;

    if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
      candidate = pathSegments[0];
    } else if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      const firstSegment = pathSegments[0]?.toLowerCase();
      if (url.pathname.toLowerCase() === '/watch') candidate = url.searchParams.get('v');
      else if (['embed', 'live', 'shorts', 'v'].includes(firstSegment)) candidate = pathSegments[1];
    }

    return YOUTUBE_VIDEO_ID_RE.test(candidate ?? '') ? candidate : null;
  } catch {
    return null;
  }
}

export function videoPresentationErrors({ sources, video, videoPresentationException }) {
  if (VIDEO_PRESENTATION_EXCEPTIONS.has(videoPresentationException)) return [];

  const officialYoutubeIds = (sources ?? [])
    .filter((source) => source?.source_type === 'official')
    .map((source) => youtubeIdFromUrl(source?.url))
    .filter(Boolean);

  if (!officialYoutubeIds.length) return [];
  if (!video?.youtubeId)
    return [
      `official YouTube source ${officialYoutubeIds[0]} has no matching video — attach the canonical player or record videoPresentationException (unavailable|removed|rights|privacy|safety)`,
    ];
  if (!officialYoutubeIds.includes(video.youtubeId))
    return [
      `video.youtubeId "${video.youtubeId}" does not match the official YouTube source (${officialYoutubeIds.join(', ')}) — do not attach unrelated footage`,
    ];

  return [];
}
