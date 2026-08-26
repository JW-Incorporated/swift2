import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// #655: the Crossings overlay's lane dots were `aria-hidden` `<span>`s with
// only a hover `title` — invisible to mobile and screen readers, which is
// where this overlay is most fun. And CrossingDetail named two moments in
// plain text with no way to open either one. Both are now real, tappable
// navigation. Source-locked (same pattern as close-affordance.test.ts /
// escape-dismiss.test.ts) so a future edit can't quietly regress either back
// to inert markup.

const src = readFileSync(new URL('./Crossings.tsx', import.meta.url), 'utf8');

describe('#655 Crossings lane dots are real tappable elements', () => {
  it('renders lane A points as buttons, not aria-hidden spans', () => {
    const block = src.slice(src.indexOf('{/* Lane A points'), src.indexOf('{/* Lane B points'));
    expect(block).toMatch(/<button\b/);
    expect(block).not.toMatch(/<span\s+key=\{`a-/);
  });

  it('renders lane B points as buttons, not aria-hidden spans', () => {
    const block = src.slice(
      src.indexOf('{/* Lane B points'),
      src.indexOf('{/* Crossing connectors'),
    );
    expect(block).toMatch(/<button\b/);
    expect(block).not.toMatch(/<span\s+key=\{`b-/);
  });

  it('gives every lane dot an aria-label describing its destination', () => {
    const block = src.slice(src.indexOf('{/* Lane A points'), src.indexOf('{/* Crossing connectors'));
    // Both branches of the crossed/uncrossed ternary must produce a label.
    expect(block).toMatch(/aria-label=\{crossingIndex != null \? `Crossing: \$\{p\.label\}` : `\$\{p\.label\}/);
  });

  it('wires each dot to navigate — either its crossing or its own thread', () => {
    const block = src.slice(src.indexOf('{/* Lane A points'), src.indexOf('{/* Crossing connectors'));
    expect(block).toContain('setSelected(crossingIndex)');
    expect(block).toContain('openThread(a)');
    expect(block).toContain('openThread(b)');
  });

  it('keeps each dot at (or above) the WCAG 2.5.8 24px tap target floor', () => {
    const block = src.slice(src.indexOf('{/* Lane A points'), src.indexOf('{/* Crossing connectors'));
    expect(block).toContain('Math.max(crossed ? 11 : 7, 24)');
  });
});

describe('#655 CrossingDetail links each named moment to its thread', () => {
  const detail = src.slice(src.indexOf('function CrossingDetail'));

  it('renders the thread A moment label as a button that opens thread A', () => {
    const block = detail.slice(detail.indexOf('{metaATitle}'), detail.indexOf('{metaBTitle}'));
    expect(block).toMatch(/<button[\s\S]*?crossing\.a\.label[\s\S]*?<\/button>/);
    expect(block).toContain('onOpenThread(threadA)');
  });

  it('renders the thread B moment label as a button that opens thread B', () => {
    const afterA = detail.slice(detail.indexOf('{metaBTitle}'));
    const block = afterA.slice(0, afterA.indexOf('Pivot links'));
    expect(block).toMatch(/<button[\s\S]*?crossing\.b\.label[\s\S]*?<\/button>/);
    expect(block).toContain('onOpenThread(threadB)');
  });
});
