import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// #525: keyboard-only dismiss must always work — every overlay/detail
// component with a close affordance also closes on Escape (Joey's 07-13
// decision: "complete Escape-key coverage to all 11 components"). Crossings,
// DecodeThread and the Love Story EntryDetail were the three original
// holdouts (PR #2033); CurrentItemDetail (the current-era live-item overlay)
// was a later addition to the app that shipped with useBackDismiss but no
// Escape handler — same gap, found by re-auditing every `.era-icon-btn`
// close affordance rather than assuming the original 11 was exhaustive. This
// source-locks the full set so a future edit, or a future new overlay, can't
// quietly ship pointer/back-only dismiss.

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

const ESCAPE_DISMISS_COMPONENTS = [
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
  './love-story/EntryDetail.tsx',
];

describe('#525 every close-affordance component dismisses on Escape', () => {
  for (const file of ESCAPE_DISMISS_COMPONENTS) {
    describe(file, () => {
      const src = read(file);

      it('handles the Escape key', () => {
        expect(src).toMatch(/e\.key (===|!==) 'Escape'/);
      });

      it("registers a window 'keydown' listener (not a focus-dependent JSX handler)", () => {
        expect(src).toContain("window.addEventListener('keydown'");
      });
    });
  }
});
