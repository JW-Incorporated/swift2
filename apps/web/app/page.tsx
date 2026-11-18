import type { Metadata, ResolvingMetadata } from 'next';

import { LongLive } from '@/components/longlive/LongLive';
import { OG_IMAGE_SIZE } from '@/lib/longlive/og-card';
import { resolveShareTarget, type ShareParams } from '@/lib/longlive/share-target';

// The "cool feature only" fix (social-strategy.md §2, PR #3922 2026-09-06):
// a shared deep link must unfurl showing that target, not the generic brand
// card. `resolveShareTarget` is the one resolver shared with `app/api/og`, so
// the card text here and the picture it points at cannot disagree. A param
// that does not resolve keeps the layout's generic metadata.
//
// Next merges `openGraph`/`twitter` shallowly, so setting either replaces the
// layout's whole object; the unchanged layout fields are carried over from
// `parent`. Home's og:title/twitter:title follow the document title.
type PageSearchParams = ShareParams;

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<PageSearchParams> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await searchParams;
  const resolved = await parent;
  const siteTitle = typeof resolved.title === 'string' ? resolved.title : resolved.title?.absolute;
  const target = resolveShareTarget(params);

  if (!target) {
    if (!siteTitle) return {};
    return {
      openGraph: { ...resolved.openGraph, title: siteTitle } as Metadata['openGraph'],
      twitter: { ...resolved.twitter, title: siteTitle } as Metadata['twitter'],
    };
  }

  // og:url is the shared target itself, so Facebook/LinkedIn do not fold a
  // moment share into the home card. `alternates.canonical` stays `/` (from
  // the layout): every deep link serves the same shell, so a per-query
  // canonical would read as duplicate pages.
  const images = [{ url: `/api/og?${target.param}`, ...OG_IMAGE_SIZE, alt: target.imageAlt }];
  const title = `${target.title} — Long Live`;
  return {
    title,
    description: target.description,
    openGraph: { ...resolved.openGraph, title, description: target.description, url: target.path, images } as Metadata['openGraph'],
    twitter: { ...resolved.twitter, title, description: target.description, images } as Metadata['twitter'],
  };
}

export default function Page() {
  return <LongLive />;
}
