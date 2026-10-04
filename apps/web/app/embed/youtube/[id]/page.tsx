import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

/**
 * YouTube wrapper page (#4954). The app's DOM host is a null origin, so a
 * YouTube iframe inside it gets no Referer and fails with error 153. The app
 * frames THIS page instead (a navigation, so no CORS), and it embeds YouTube
 * from the real https://www.longlivets.com origin. Frameable by design: proxy.ts
 * + next.config.mjs drop frame-ancestors / X-Frame-Options for
 * /embed/youtube/* only. Nothing but the player renders here.
 */
export const metadata: Metadata = {
  title: 'Video',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export default async function YouTubeEmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!YOUTUBE_ID.test(id)) notFound();

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 2147483647 }}>
      <iframe
        title="YouTube video"
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
      />
    </div>
  );
}
