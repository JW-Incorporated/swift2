import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// #525: the mobile back-swipe/browser-back gesture must always have an
// overlay to dismiss instead of falling through and leaving the app — every
// close-affordance component tracked in escape-dismiss.test.ts also wires
// `useBackDismiss`. `love-story/EntryDetail.tsx` is the one deliberate
// exception: its open/close state (`activeId`) lives in its parent
// `LoveStoryThread.tsx`, which already owns a `useBackDismiss` call for that
// exact state. Wiring a second hook directly into EntryDetail would push a
// second, redundant history entry on every open (the parent's effect fires
// for the transition, then EntryDetail's own effect would fire again for the
// identical transition), requiring two back-gestures to actually leave the
// entry. So EntryDetail is checked against its parent file instead of
// itself. Source-locks the full set so a future edit, or a future new
// overlay, can't quietly ship pointer/Escape-only dismiss.

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

const BACK_DISMISS_FILES = [
  './Crossings.tsx',
  './CurrentItemDetail.tsx',
  './EraSelector.tsx',
  './FeedbackButton.tsx',
  './MomentDetail.tsx',
  './SearchOverlay.tsx',
  './ShareSheet.tsx',
  './TheoryGuide.tsx',
  './TrackDetail.tsx',
  './TrackGuide.tsx',
  './decode/DecodeThread.tsx',
  './love-story/LoveStoryThread.tsx', // owns EntryDetail's back-dismiss — see note above
];

describe('#525 every close-affordance component (or its owning parent) supports back-swipe dismiss', () => {
  for (const file of BACK_DISMISS_FILES) {
    it(`${file} calls useBackDismiss`, () => {
      const src = read(file);
      expect(src).toMatch(/useBackDismiss\(/);
    });
  }
});
