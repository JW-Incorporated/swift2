import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Regression guard for the reported Mood-chat layout bug: the reply rendered
 * BELOW the "Not sure where to start?" starter chips, so the answer to the
 * reader's own question was pushed out of view behind a row of prompts they
 * had already moved past.
 *
 * Asserted against the source rather than a rendered tree because this
 * workspace has no React test renderer (vitest runs `environment: 'node'` and
 * only picks up `.test.ts`). The invariant is document order, which the source
 * order of these two blocks determines exactly — same approach as
 * `topbarLayout.test.ts`, which pins layout via exported constants.
 */
const SOURCE = readFileSync(join(__dirname, 'MoodChat.tsx'), 'utf8');

/** The wrapper around every result branch (crisis / refusal / unclear / matches). */
const ANSWER_REGION = 'ref={resultsRef}';
/** The starter-chip block. */
const STARTERS_REGION = 'Not sure where to start?';
/** The input the reader types into. */
const INPUT_REGION = 'id="mood-input"';

describe('MoodChat layout', () => {
  it('renders the answer directly under the input, above the starter chips', () => {
    const input = SOURCE.indexOf(INPUT_REGION);
    const answer = SOURCE.indexOf(ANSWER_REGION);
    const starters = SOURCE.indexOf(STARTERS_REGION);

    expect(input).toBeGreaterThan(-1);
    expect(answer).toBeGreaterThan(-1);
    expect(starters).toBeGreaterThan(-1);

    expect(answer).toBeGreaterThan(input);
    // The bug, stated as an assertion.
    expect(answer).toBeLessThan(starters);
  });

  it('announces the answer to screen readers', () => {
    // The reply arrives asynchronously with no focus change; without a live
    // region a screen-reader user is never told it landed.
    expect(SOURCE).toContain('aria-live="polite"');
    expect(SOURCE).toContain('aria-busy={busy}');
  });

  it('does not scroll the input out of view when the answer arrives', () => {
    // block: 'start' pinned the results container to the top of the viewport,
    // taking the text box with it. 'nearest' scrolls only if needed.
    expect(SOURCE).toContain("block: 'nearest'");
    expect(SOURCE).not.toContain("block: 'start'");
  });

  it('demotes the starters once there is an answer instead of hiding them', () => {
    // The approved crisis copy promises "the songs will still be here whenever
    // you want them" — removing every way back would make that line false.
    expect(SOURCE).toContain('Or try one of these:');
    expect(SOURCE).toContain('answered');
  });
});
