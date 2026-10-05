import { EMBED_ID_PATTERN } from '@/lib/security-headers.mjs';

/**
 * YouTube wrapper page (#4954). The app's DOM host is a null origin, so a
 * YouTube iframe inside it gets no Referer and fails with error 153. The app
 * frames THIS page instead (a navigation, so no CORS); it embeds YouTube from
 * the real https://www.longlivets.com origin. A route handler, not a page: no
 * root layout, fonts, JSON-LD, Analytics or host provider, just the player.
 * Frameable by design: proxy.ts drops frame-ancestors /
 * X-Frame-Options for exactly /embed/youtube/<id> (security-headers.mjs).
 */
const YOUTUBE_ID = new RegExp(`^${EMBED_ID_PATTERN}$`);

function embedHtml(id: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Video</title>
</head>
<body style="margin:0;background:#000;overflow:hidden">
<iframe title="YouTube video" src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&amp;playsinline=1&amp;rel=0&amp;enablejsapi=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>
<script src="/embed-bridge.js" data-provider="youtube"></script>
</body>
</html>
`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!YOUTUBE_ID.test(id)) return new Response('Not found', { status: 404 });
  return new Response(embedHtml(id), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
    },
  });
}
