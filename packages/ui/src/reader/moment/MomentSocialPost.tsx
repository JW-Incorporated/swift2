'use client';

import { useState } from 'react';
// lucide-react 1.x has no brand glyphs (no `Instagram` export). The caption
// says the platform in words, so a neutral camera mark is enough here.
import { Camera, ExternalLink } from 'lucide-react';
import type { SocialPost } from '@swift2/experience';

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
 * Founder direction (Wyatt, 2026-07-21): "can we see the post on our page? ...
 * The intent is to have a seamless flow in the app, not just push users over to
 * instagram." That still holds and is why the embed mounts IN PLACE — one tap
 * and the post is part of the article, not a link out of it. What changed
 * (privacy audit, 2026-08-11) is that it no longer mounts before the reader
 * asks: `loading="lazy"` defers the iframe, but any reader who scrolls to it
 * still handed Instagram their IP, user-agent and the referring moment URL
 * without ever indicating interest. This is the same click-to-load contract
 * MomentVideo and MoodSongCard already use for YouTube — one established
 * pattern, not a new one.
 *
 * No poster image on the facade: Instagram's CDN urls are signed and expiring
 * (see above), so there is nothing stable to show. The facade instead names the
 * post and carries the same accent play affordance as the video embeds, so it
 * still reads as something you open rather than a dead placeholder.
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
  const [loaded, setLoaded] = useState(false);
  const permalink = `https://www.instagram.com/p/${post.shortcode}/`;

  return (
    <figure className={className}>
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: 'var(--era-line)', background: 'var(--era-surface)' }}
      >
        {loaded ? (
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
        ) : (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="group flex w-full flex-col items-center justify-center gap-3 px-6 py-14 text-center"
            aria-label={`Load Instagram post: ${post.label}`}
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: 'var(--era-accent)' }}
            >
              <Camera className="h-7 w-7" style={{ color: 'var(--era-bg)' }} aria-hidden />
            </span>
            <span className="max-w-sm">
              <span className="block text-[11px] uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
                Load Instagram post
              </span>
              <span className="mt-1 block text-sm font-semibold text-[color:var(--era-ink)]">
                {post.label}
              </span>
              <span className="mt-2 block text-xs text-[color:var(--era-ink-soft)]">
                Shows here on the page. Instagram only sees you once you tap.
              </span>
            </span>
          </button>
        )}
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
