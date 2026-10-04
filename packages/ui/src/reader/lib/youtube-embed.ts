/**
 * The iframe src for a YouTube video. Web embeds YouTube directly (the page's
 * own origin is the Referer). A host with `resolveUrl` is the app's DOM host,
 * a null origin that sends no Referer, so YouTube refuses with error 153
 * (#4954); it frames the site's `/embed/youtube/<id>` wrapper page on the
 * canonical origin instead, which embeds YouTube from a real origin.
 */
export function youtubeEmbedSrc(id: string, resolveUrl?: (path: string) => string): string {
  return resolveUrl
    ? resolveUrl(`/embed/youtube/${id}`)
    : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}

export const YOUTUBE_REFERRER_POLICY = 'strict-origin-when-cross-origin';
