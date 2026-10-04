export type SpotifyEmbedType = 'album' | 'track' | 'playlist';

/**
 * The iframe src for a Spotify player. Web embeds Spotify directly. A host with
 * `embedOrigin` is the app's DOM host (null origin, no Referer), so it frames
 * the site's `/embed/spotify/<type>/<id>` wrapper page on the `embedOrigin`
 * instead, which embeds Spotify from a real origin (same as YouTube, #4954).
 */
export function spotifyEmbedSrc(type: SpotifyEmbedType, id: string, embedOrigin?: string): string {
  return embedOrigin
    ? `${embedOrigin.replace(/\/+$/, '')}/embed/spotify/${type}/${id}`
    : `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
}
