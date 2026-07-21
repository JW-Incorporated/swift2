// Social-post checker — pages that are ABOUT a post but do not show it.
//
// Some moments simply ARE a post: the Kamala Harris endorsement is a photo and
// a caption signed "Childless Cat Lady"; the engagement was an Instagram
// carousel; reputation was announced with a snake video. Until `socialPost`
// existed (issue #1074) those pages could only carry substitutes — a Getty file
// photo, a portrait of someone else named in the story — because Instagram is
// not on the image-host allowlist and its CDN urls are signed and expiring.
//
// Founder (Wyatt, 2026-07-21): "Adding instagram seems to be a huge value add -
// which bot should be checking if we should have IG posts in line, and which
// bot should be adding them?"
//
// THIS checker is the "checking" half, and it is a checker rather than an agent
// pass on purpose: it walks every item every run, so the latency is bounded.
// Lex would find these only when one happened to fall in its shard, and it
// skips anything with an open ledger — the same gap that let a stale rumor
// banner sit for weeks.
//
// The "adding" half is the Photo Enrichment worker, which already sources and
// verifies visual media per page. Findings here are its queue.
import { makeFinding } from '../lib/finding.mjs';

export const id = 'content.social-post-missing';

/**
 * Phrases that mean "this page is about a post", not merely "a post exists
 * somewhere in this story". Deliberately narrow: `on Instagram` alone matches
 * a great deal of incidental prose ("she later said on Instagram"), which
 * would bury the real cases in noise the way the old fashion checker did.
 */
const ABOUT_A_POST = [
  'instagram post',
  'posted on instagram',
  'instagram carousel',
  'the post read',
  'captioned the post',
  'signed the post',
  'in the caption',
  'her instagram story',
  'posted a photo',
  'posted a video',
  'shared a photo',
  'announced on instagram',
  'the announcement post',
];

/**
 * Strong signals that the post IS the artifact — a page carrying one of these
 * is a P1 rather than a P2, because the reader has been told about a specific
 * image they are then not shown.
 */
const THE_POST_IS_THE_STORY = [
  'the photo',
  'the caption',
  'the carousel',
  'the video',
  'signed',
];

export async function check(items) {
  const findings = [];

  for (const it of items) {
    if (it.type !== 'moment') continue;
    // Already answered.
    if (it.raw?.moment?.socialPost ?? it.raw?.socialPost) continue;

    const text = [it.title, it.texts?.snippet, it.texts?.context].filter(Boolean).join('\n');
    const lower = text.toLowerCase();

    const phrase = ABOUT_A_POST.find((p) => lower.includes(p));
    if (!phrase) continue;

    const strong = THE_POST_IS_THE_STORY.some((p) => lower.includes(p));

    findings.push(
      makeFinding({
        checker: id,
        severity: strong ? 'P1' : 'P2',
        title: `Page is about an Instagram post but does not show it: "${it.title}"`,
        itemRef: { type: it.type, file: it.file, era: it.era, key: it.key, field: 'socialPost' },
        excerpt: String(it.title ?? '').slice(0, 160),
        evidence:
          `The page says "${phrase}" but carries no \`moment.socialPost\`, so the reader is told about ` +
          'a specific image and then shown a substitute — a file photo, or a portrait of someone else ' +
          'in the story. Embedding is the only route: Instagram is not on the image-host allowlist, its ' +
          'CDN urls are signed and expiring, and every outlet that covered these embeds rather than ' +
          're-hosting, so no allowlisted host has a copy to hotlink.',
        suggestedFix:
          'Photo Enrichment: find the post permalink in press coverage that embeds it (instagram.com/p/<shortcode>), ' +
          'then VERIFY by loading https://www.instagram.com/p/<shortcode>/embed and confirming the account is ' +
          'taylorswift and the image matches the story — the embed is client-rendered, so an HTTP 200 proves ' +
          'nothing about which post it is. Add { platform, shortcode, label, postedOn } to moment.socialPost. ' +
          'If no permalink can be found or the post is deleted, add nothing and say so.',
        confidence: strong ? 0.8 : 0.55,
      }),
    );
  }

  return findings;
}
