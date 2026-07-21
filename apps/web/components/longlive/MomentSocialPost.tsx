'use client';

// lucide-react 1.x has no brand glyphs (no `Instagram` export). The caption
// says the platform in words, so a neutral camera mark is enough here.
import { Camera, ExternalLink } from 'lucide-react';
import type { SocialPost } from '@/lib/longlive/types';

/**
 * A social post the moment is about, rendered INLINE on our page (issue #1074).
 *
 * Some moments simply ARE a post: the Kamala Harris endorsement is a photo of
 * Swift holding Benjamin Button, captioned and signed "Childless Cat Lady".
 * That page used to carry only substitutes — a Getty file photo plus portraits
 * of the other people named — because Instagram is not on the image-host
 * allowlist and its CDN urls are signed and expiring, so there is nothing
 * stable to hotlink. Checking how the press solved it settled the approach:
 * CBS, NPR and TODAY all EMBED rather than re-host, which is why no allowlisted
 * host has a copy and why Photo Enrichment would never have found one.
 *
 * Founder direction (Wyatt, 2026-07-21) on an earlier click-to-load version:
 * "can we see the post on our page? ... The intent is to have a seamless flow
 * in the app, not just push users over to instagram." So the embed renders
 * directly — the post is part of the article, not a link out of it.
 *
 * `loading="lazy"` is what keeps that affordable: the iframe (and therefore
 * anything Instagram loads with it) is deferred by the browser until the reader
 * is actually near it, so a page nobody scrolls to the bottom of never pays.
 * The "Open on Instagram" link stays as a secondary affordance for comments and
 * the full thread, not as the way to see the thing.
 *
 * The `/embed/captioned` variant is deliberate: for a post like this one the
 * caption IS the story, and the photo alone loses the sign-off the page is
 * named for.
 */
export function MomentSocialPost({
  post,
  className = 'mt-8',
}: {
  post: SocialPost;
  className?: string;
}) {
  const permalink = `https://www.instagram.com/p/${post.shortcode}/`;

  return (
    <figure className={className}>
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: 'var(--era-line)', background: 'var(--era-surface)' }}
      >
        <iframe
          title={post.label}
          src={`https://www.instagram.com/p/${post.shortcode}/embed/captioned`}
          loading="lazy"
          scrolling="no"
          className="w-full"
          // Instagram's embed is a fixed-width card that letterboxes itself in
          // a wider frame; it does not reflow to an arbitrary aspect ratio, so
          // this is a generous height clamped to the viewport rather than a
          // ratio box. min() keeps it from running off a short screen.
          style={{ border: 0, height: 'min(860px, 92vh)', display: 'block' }}
        />
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[color:var(--era-ink-soft)]">
        <Camera className="size-3.5 shrink-0" aria-hidden />
        <span>{post.label}</span>
        {post.postedOn && <span>· {post.postedOn}</span>}
        <a
          href={permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-4"
        >
          Open on Instagram
          <ExternalLink className="size-3 shrink-0" aria-hidden />
        </a>
      </figcaption>
    </figure>
  );
}
