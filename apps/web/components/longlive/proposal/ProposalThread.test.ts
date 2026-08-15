import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contentForThread } from '../../../lib/longlive/threads';
import { getContentItem } from '../../../lib/longlive/content';

// Every End Game beat card looked clickable (the shared .era-card hover glow
// applies to any element with that class, interactive or not) but had no
// onClick, no button, no anchor — a lying affordance. The fix wires each
// beat's outer `<article className="era-card …">` chrome around an inner
// `<button>` that opens the SAME item in MomentDetail via openItem(item.id),
// following the outer-article/inner-button split already used by
// AlbumNarrativeCard.tsx. The repo has no component-render setup (node test
// env, no jsdom — vitest.config.ts), so this source-locks the wiring, same
// as close-affordance.test.ts and scrubber-nested-interactive.test.ts.

const src = readFileSync(new URL('./ProposalThread.tsx', import.meta.url), 'utf8');

/**
 * End index of the JSX tag that starts at `start`, skipping `>` characters
 * inside `{…}` attribute expressions (arrow functions, style objects) — same
 * helper as scrubber-nested-interactive.test.ts, needed because `onClick={()
 * => …}` contains a `>` at curly depth 1.
 */
function tagEnd(source: string, start: number): number {
  let curly = 0;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') curly++;
    else if (ch === '}') curly--;
    else if (ch === '>' && curly === 0) return i;
  }
  throw new Error('unterminated JSX tag');
}

/** The `<button …>` opening tag rendered inside the beats.map() body. */
function beatButtonOpenTag(source: string): string {
  const mapAt = source.indexOf('beats.map(');
  if (mapAt === -1) throw new Error('no beats.map( call in ProposalThread');
  const buttonAt = source.indexOf('<button', mapAt);
  if (buttonAt === -1) throw new Error('no <button> rendered per beat');
  const openEnd = tagEnd(source, buttonAt);
  return source.slice(buttonAt, openEnd + 1);
}

const buttonTag = beatButtonOpenTag(src);

describe('End Game beats open their moment detail', () => {
  it('renders a real <button>, not a div with onClick', () => {
    expect(buttonTag.startsWith('<button')).toBe(true);
  });

  it('clicking a beat calls openItem with that beat’s id', () => {
    expect(buttonTag).toContain('onClick={() => openItem(item.id)}');
  });

  it('carries an aria-label naming the beat, since the button wraps an image and text', () => {
    expect(buttonTag).toContain('aria-label=');
    expect(buttonTag).toContain('item.title');
  });

  it('every End Game beat has an id that resolves back to a real content item', () => {
    const beats = contentForThread('the-proposal');
    expect(beats.length).toBeGreaterThan(0);
    for (const beat of beats) {
      expect(getContentItem(beat.id)).toBe(beat);
    }
  });
});
