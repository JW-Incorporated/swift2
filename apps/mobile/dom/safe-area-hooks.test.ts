import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./reader-spike.css', import.meta.url), 'utf8');
const ui = (p: string) =>
  readFileSync(new URL(`../../../packages/ui/src/reader/${p}`, import.meta.url), 'utf8');

const hooks: Array<[string, string]> = [
  ['bottom-nav', 'shell/BottomNav.tsx'],
  ['bottom-spacer', 'shell/ReaderShell.tsx'],
  ['feedback-button', 'legal/FeedbackButton.tsx'],
  ['feedback-panel', 'legal/FeedbackButton.tsx'],
];

describe('app safe-area overrides use stable data-ll-safe hooks', () => {
  it.each(hooks)('%s is selected by the CSS and rendered by %s', (hook, file) => {
    expect(css).toContain(`[data-ll-safe='${hook}']`);
    expect(ui(file)).toContain(`data-ll-safe="${hook}"`);
  });

  it('no selector matches Tailwind class strings or inline-style text', () => {
    expect(css).not.toMatch(/\[class[~*^$|]?=/);
    expect(css).not.toMatch(/\[style[~*^$|]?=/);
  });
});
