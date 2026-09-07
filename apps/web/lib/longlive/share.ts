/**
 * Long Live — pure share-copy builders for the ShareSheet.
 *
 * OS-038: the copy builders, the `ShareTarget` model, and the `shareUrl`
 * builder moved into `@swift2/experience`'s `share-copy.ts` (headless core)
 * so `apps/mobile`'s native share sheet shares the exact same copy —
 * mirroring the OS-025 move that put the search ranking engine in the core.
 * This module re-exports everything unchanged so every existing import of
 * `./share` (and `./store`'s `ShareTarget`) keeps working.
 */

export {
  buildShareUrl,
  clownbotShareCopy,
  communityShareCopy,
  merchShareCopy,
  momentShareCopy,
  moodShareCopy,
  siteShareCopy,
  theoryGuideShareCopy,
  threadsGalleryShareCopy,
  topbarShareTarget,
  trackGuideShareCopy,
  trackShareCopy,
  type ShareCopy,
  type ShareTarget,
} from '@swift2/experience';
