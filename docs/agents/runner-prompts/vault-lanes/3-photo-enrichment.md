# Lane 3 — Photo Enrichment (visual media)

**Due:** daily. **Cap:** up to 10 pages of photos, plus up to 3 embedded posts.

You own the visual media on a page: the photos, and the embedded posts.

## Part A — photos

Read the comment headed PHOTO-ENRICHMENT WORKER PROTOCOL on issue #762
(`gh issue view 762 --comments`) and follow it exactly. You may download and
Read images to vision-confirm them. Never fabricate a photo or a page; skip
anything you cannot verify.

### FIELD ORDER RULE — follow this exactly, it prevents a real corruption

Inside a photo object, ALWAYS write `focalPoint` on the line IMMEDIATELY AFTER
`url`, before credit/caption/kind. Never after `caption` or anywhere else.

Why: on 2026-07-20 one run wrote `focalPoint` after `url` and the next wrote it
after `caption`. Git saw two different lines in different positions, reported NO
conflict, and merged BOTH — leaving 14 photo objects with duplicate
`focalPoint` keys. Duplicate keys are legal JavaScript (the last one silently
wins), so `node --check` passed and `validate:content` passed; only
`eslint no-dupe-keys` caught it. A consistent position turns a silent overwrite
into an ordinary git conflict a human can see.

*(Inside the Vault Run this specific race is mostly gone — one session means one
writer — but the rule stays: the file is still edited by humans and by Karen's
fix lane.)*

## Part B — embedded Instagram posts

Some moments simply ARE a post — the engagement announcement, the snake video
that launched reputation, the Harris endorsement. Those pages used to carry only
substitutes because Instagram is not on the image-host allowlist and its CDN
URLs are signed and expiring. `moment.socialPost` embeds the real post instead.

Queue is the checker, not your judgment: run
`node --use-env-proxy scripts/content-engine/run.mjs scan --no-images` and read the
`content.social-post-missing` findings. Take up to 3, P1 before P2.

1. Find the post PERMALINK in press coverage that embeds it. Outlets embed
   rather than re-host, so it is in their page source: curl the article with a
   browser User-Agent and grep for `instagram.com/p/`. Two independent outlets
   agreeing is the standard.
2. **VERIFY IT — HTTP 200 IS NOT VERIFICATION.** The embed page is
   client-rendered, so it returns 200 with the shortcode present even for a
   deleted or unrelated post. Fetch
   `https://www.instagram.com/p/<shortcode>/embed/captioned` and confirm the
   rendered post is the `taylorswift` account AND that the image matches what
   the page describes. If you cannot confirm both, add nothing.
3. Add `socialPost: { platform: 'instagram', shortcode: '<id only, never a full
   url>', label: '<one line — this is ALL a reader sees if the embed fails>',
   postedOn: 'YYYY-MM-DD' }`.
4. Never invent a shortcode, never use a fan repost, never use a Story (they
   expire). If the post was deleted, add nothing and say so.

## Confirm it actually landed

`socialPost` was silently dropped on its very first build because one link in
the seed → caller → normalizer → serializer chain was missing, and every layer
looked correct. After the orchestrator syncs, grep your shortcode in
`apps/web/lib/longlive/content-vault.generated.ts`. Do not trust the layers.

## Note for the gate

If `lint` reports `Duplicate key`, you have hit the `focalPoint` bug — remove
the duplicate rather than leaving both.
