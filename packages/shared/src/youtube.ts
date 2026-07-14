// Pure YouTube URL parsing + embed helpers. No I/O.

/**
 * Extract the 11-character YouTube video ID from a URL.
 * Supports: https://www.youtube.com/watch?v=ID, https://youtu.be/ID,
 * https://www.youtube.com/embed/ID, https://m.youtube.com/watch?v=ID,
 * https://music.youtube.com/watch?v=ID
 * Returns null for non-YouTube URLs or unparseable input.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const urlObj = new URL(url);
    const { hostname, pathname, searchParams } = urlObj;

    // youtu.be/ID — video ID is the pathname without leading slash
    if (hostname === 'youtu.be') {
      const id = pathname.slice(1).split('?')[0]?.split('#')[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    // youtube.com/embed/ID — video ID is the first path segment
    if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
      if (pathname.startsWith('/embed/')) {
        const id = pathname.slice(7).split('/')[0]?.split('?')[0]?.split('#')[0];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      // youtube.com/watch?v=ID — video ID is in query param
      const id = searchParams.get('v');
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    // m.youtube.com/watch?v=ID
    if (hostname === 'm.youtube.com') {
      const id = searchParams.get('v');
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    // music.youtube.com/watch?v=ID
    if (hostname === 'music.youtube.com') {
      const id = searchParams.get('v');
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    return null;
  } catch {
    // URL parsing failed (not a valid URL)
    return null;
  }
}

/**
 * Return a privacy-friendly no-cookie YouTube embed URL for the given video ID.
 * The URL points to youtube-nocookie.com, which doesn't set tracking cookies.
 */
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
