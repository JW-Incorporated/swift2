import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// #660: the era timeline scrubber is a `role="slider"` widget, and widget
// roles presume no interactive children (axe `nested-interactive`, WCAG
// 4.1.2). Laura's 2026-07-15 walk found focusable milestone buttons rendered
// inside the slider element; a later rewrite of the scrubber made every rail
// adornment (ticks, milestone markers, "now" tick, handle, pill, tooltip) a
// non-interactive `aria-hidden` layer, which resolved the finding. This test
// source-locks that state so a future edit can't nest a focusable control
// back inside the slider. The repo has no component-render setup (node test
// env, no jsdom/axe), so the lock is static, same as close-affordance.test.ts.

const src = readFileSync(join(__dirname, 'TimelineScrubber.tsx'), 'utf8');

/**
 * End index of the JSX tag that starts at `start`, skipping `>` characters
 * inside `{…}` attribute expressions (arrow functions, style objects).
 * Attribute expressions are balanced brace-wise, so a `>` at curly depth 0
 * is the tag's own terminator.
 */
function tagEnd(source: string, start: number): { end: number; selfClosing: boolean } {
  let curly = 0;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') curly++;
    else if (ch === '}') curly--;
    else if (ch === '>' && curly === 0) {
      return { end: i, selfClosing: source[i - 1] === '/' };
    }
  }
  throw new Error('unterminated JSX tag');
}

/** The `<div role="slider" …>…</div>` element's full JSX source. */
function sliderSubtree(source: string): string {
  const roleAt = source.indexOf('role="slider"');
  if (roleAt === -1) throw new Error('no role="slider" element in TimelineScrubber');
  const openStart = source.lastIndexOf('<div', roleAt);
  if (openStart === -1) throw new Error('role="slider" is not on a <div>');
  let depth = 0;
  let i = openStart;
  while (i < source.length) {
    if (source.startsWith('<div', i)) {
      const { end, selfClosing } = tagEnd(source, i);
      if (!selfClosing) depth++;
      i = end + 1;
    } else if (source.startsWith('</div>', i)) {
      depth--;
      i += '</div>'.length;
      if (depth === 0) return source.slice(openStart, i);
    } else {
      i++;
    }
  }
  throw new Error('unbalanced <div> nesting inside the slider');
}

const slider = sliderSubtree(src);
const sliderOpenTag = slider.slice(0, tagEnd(slider, 0).end + 1);

// Everything the browser treats as naturally focusable/interactive.
const NATURALLY_FOCUSABLE =
  /<(button|a|input|select|textarea|iframe|summary|embed|object|audio|video)\b/g;

// ARIA widget roles — any of these on a descendant recreates the violation
// even on a plain <span>/<div>.
const WIDGET_ROLES =
  /role="(button|link|checkbox|combobox|grid|listbox|menu|menubar|menuitem|option|radio|radiogroup|scrollbar|searchbox|slider|spinbutton|switch|tab|textbox|tree|treegrid)"/g;

describe('#660 role="slider" scrubber has no interactive descendants', () => {
  it('there is exactly one slider, and this file owns it', () => {
    expect(src.match(/role="slider"/g)).toHaveLength(1);
  });

  it('contains no naturally focusable elements', () => {
    expect(slider.match(NATURALLY_FOCUSABLE)).toBeNull();
  });

  it('the only tabIndex is the slider element itself', () => {
    expect(slider.match(/tabIndex/g)).toHaveLength(1);
    expect(sliderOpenTag).toContain('tabIndex={0}');
  });

  it('the only widget role is the slider element itself', () => {
    const roles = slider.match(WIDGET_ROLES);
    expect(roles).toHaveLength(1);
    expect(roles?.[0]).toBe('role="slider"');
  });

  it('no descendant is made editable', () => {
    expect(slider).not.toMatch(/contentEditable/i);
  });

  // The ticket's "what's already right (keep it)": the slider itself must
  // stay a real, keyboard-operable slider — losing these would fix
  // nested-interactive by breaking Name/Role/Value the other way.
  it('the slider keeps its accessible name, value, and keyboard wiring', () => {
    expect(sliderOpenTag).toContain('aria-label=');
    expect(sliderOpenTag).toContain('aria-valuemin=');
    expect(sliderOpenTag).toContain('aria-valuemax=');
    expect(sliderOpenTag).toContain('aria-valuenow=');
    expect(sliderOpenTag).toContain('aria-valuetext=');
    expect(sliderOpenTag).toContain('onKeyDown=');
  });
});
