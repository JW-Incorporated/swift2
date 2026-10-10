// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrackGuideBar } from './TrackGuideBar';

describe('TrackGuideBar accessible name (WCAG 2.5.3, #5471)', () => {
  it.each([
    [12, /^track guide 12 songs$/i],
    [1, /^track guide 1 song$/i],
  ])('derives the name from the visible text for %i track(s)', (count, name) => {
    const { getByRole } = render(<TrackGuideBar trackCount={count} onOpen={() => {}} />);
    const btn = getByRole('button', { name });
    expect(btn.hasAttribute('aria-label')).toBe(false);
    expect((btn.textContent ?? '').replace(/\s+/g, ' ').toLowerCase()).toContain('track guide');
  });
});
