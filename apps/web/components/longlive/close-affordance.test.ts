import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// #525: every overlay close/dismiss (X) must use the shared `.era-icon-btn`
// affordance — solid, high-contrast, with the class-level 44px min tap target
// (globals.css / globals.test.ts) — never a per-component translucent or
// low-contrast button. These four were the off-class holdouts left after the
// shared-class fix (#853): Crossings, ShareSheet, FeedbackButton and the Love
// Story EntryDetail each rolled their own faint X (text-ink-soft, bg-white/10,
// era-btn-ghost, sub-24px padding). This source-locks them onto the standard
// so a future edit can't quietly revert one below the a11y floor.

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

/** The opening `<button …>` tag that carries the given close aria-label. */
function closeButtonTag(src: string, aria: string): string {
  const marker = `aria-label="${aria}"`;
  const at = src.indexOf(marker);
  if (at === -1) throw new Error(`no close button with aria-label="${aria}"`);
  const openStart = src.lastIndexOf('<button', at);
  const openEnd = src.indexOf('>', at);
  if (openStart === -1 || openEnd === -1) throw new Error(`malformed button tag for "${aria}"`);
  return src.slice(openStart, openEnd + 1);
}

const CLOSE_BUTTONS: Array<{ file: string; aria: string }> = [
  { file: './Crossings.tsx', aria: 'Close crossing detail' },
  { file: './ShareSheet.tsx', aria: 'Close share' },
  { file: './FeedbackButton.tsx', aria: 'Close feedback' },
  { file: './love-story/EntryDetail.tsx', aria: 'Close' },
];

// The faint, off-standard patterns these buttons used before #525 — none may
// reappear on a close affordance.
const LOW_CONTRAST_TOKENS = ['text-ink-soft', 'bg-white/10', 'era-btn-ghost', 'var(--era-ink-soft)'];

describe('#525 off-class close affordances adopt the shared .era-icon-btn standard', () => {
  for (const { file, aria } of CLOSE_BUTTONS) {
    describe(file, () => {
      const tag = closeButtonTag(read(file), aria);

      it('uses the shared .era-icon-btn class (solid, high-contrast, 44px floor)', () => {
        expect(tag).toContain('era-icon-btn');
      });

      it('carries none of the pre-#525 low-contrast styles', () => {
        for (const token of LOW_CONTRAST_TOKENS) {
          expect(tag).not.toContain(token);
        }
      });
    });
  }
});
