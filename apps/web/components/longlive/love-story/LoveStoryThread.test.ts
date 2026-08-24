import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// No jsdom/testing-library render harness for this component (same
// constraint FeedbackButton.test.ts documents), so this is a source-level
// regression pin for #659: white text hardcoded on the band's own
// per-relationship accent color measured as low as 2.18:1, since that
// color is composited over whichever era surface happens to be active.
const src = readFileSync(join(__dirname, 'LoveStoryThread.tsx'), 'utf8');

describe('LoveStoryThread — #659 (band label contrast)', () => {
  it('no longer paints the name label white directly on the band color', () => {
    expect(src).not.toContain("style={{ color: '#fff' }}");
  });

  it('renders the name labels in a separate row using --era-ink, which is guaranteed high-contrast on era surfaces', () => {
    expect(src).toMatch(
      /entry\.kind !== 'relationship' \|\| widthPct <= 6[\s\S]{0,400}color: 'var\(--era-ink\)'/,
    );
  });
});
