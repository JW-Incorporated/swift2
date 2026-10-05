import { SPOTIFY_ID_PATTERN, SPOTIFY_TYPE_PATTERN } from '@/lib/security-headers.mjs';

/**
 * Spotify wrapper page (One UI W6), same reason and shape as the YouTube one
 * (`/embed/youtube/[id]`): the app's DOM host is a null origin with no Referer,
 * so it frames THIS page instead, which embeds Spotify from the real
 * https://www.longlivets.com origin. A route handler: no root layout or host
 * provider, just the player. Frameable by design: proxy.ts drops
 * frame-ancestors / X-Frame-Options for exactly
 * /embed/spotify/<album|track|playlist>/<22-char id> (security-headers.mjs).
 */
const SPOTIFY_TYPE = new RegExp(`^${SPOTIFY_TYPE_PATTERN}$`);
const SPOTIFY_ID = new RegExp(`^${SPOTIFY_ID_PATTERN}$`);

function embedHtml(type: string, id: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Spotify player</title>
</head>
<body style="margin:0;background:transparent;overflow:hidden">
<iframe title="Spotify player" src="https://open.spotify.com/embed/${type}/${id}?utm_source=generator&amp;theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" style="position:fixed;inset:0;width:100%;height:100%;border:0;color-scheme:normal"></iframe>
</body>
</html>
`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (!SPOTIFY_TYPE.test(type) || !SPOTIFY_ID.test(id)) return new Response('Not found', { status: 404 });
  return new Response(embedHtml(type, id), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
    },
  });
}
