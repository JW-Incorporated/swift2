import type { Metadata, ResolvingMetadata } from 'next';

import { LongLive } from '@/components/longlive/LongLive';
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

  const ogUrl = `/api/og?${target.param}`;
  const title = `${target.title} — Long Live`;
  return {
    title,
    description: target.description,
    openGraph: { ...resolved.openGraph, title, description: target.description, images: [ogUrl] } as Metadata['openGraph'],
    twitter: { ...resolved.twitter, title, description: target.description, images: [ogUrl] } as Metadata['twitter'],
  };
}

export default function Page() {
  return <LongLive />;
}
