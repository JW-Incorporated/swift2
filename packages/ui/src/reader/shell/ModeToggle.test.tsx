// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ModeToggle, type ToggleMode } from './ModeToggle';

const MODES: [ToggleMode, string][] = [
  ['era', 'Eras'],
  ['threads', 'Threads'],
  ['mood', 'Mood'],
  ['clownbot', 'Clownbot'],
  ['community', 'Community'],
  ['merch', 'Merch'],
];

// #6457 (WCAG 1.4.3): the active tab's label is painted over the `bg-accent`
// indicator, so it must use the on-fill token (#3318), not `text-bg` —
// Red's --era-bg on --era-accent is only 4.08:1.
describe('ModeToggle active-tab contrast (#6457)', () => {
  it.each(MODES)('%s: active label uses --era-accent-fg, never text-bg', (mode, name) => {
    const { getByRole } = render(<ModeToggle mode={mode} onChange={() => {}} />);
    const active = getByRole('button', { name });
    expect(active.getAttribute('aria-pressed')).toBe('true');
    const classes = active.className.split(/\s+/);
    expect(classes).toContain('text-[color:var(--era-accent-fg)]');
    expect(classes).not.toContain('text-bg');
  });

  it('inactive tabs keep the soft ink colour', () => {
    const { getByRole } = render(<ModeToggle mode="era" onChange={() => {}} />);
    const inactive = getByRole('button', { name: 'Threads' });
    expect(inactive.className.split(/\s+/)).toContain('text-ink-soft');
    expect(inactive.className).not.toContain('--era-accent-fg');
  });
});
