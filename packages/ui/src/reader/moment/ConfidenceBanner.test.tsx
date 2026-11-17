// @vitest-environment jsdom
// Sub-confirmed moments carry a compact chip under the title and a footer
// note (owner 2026-11-09), never the old full-width box; confirmed ones carry
// nothing.
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConfidenceBanner, ConfidenceNote, chipOutlet } from './ConfidenceBanner';

describe('chipOutlet', () => {
  it('keeps a short outlet name and derives a long headline-style name from the host', () => {
    expect(chipOutlet({ name: 'NPR', url: 'https://www.npr.org/x' })).toBe('NPR');
    expect(
      chipOutlet({ name: 'Taylor Swift Bachelorette Party Buzz Grows in Rhode Island', url: 'https://people.com/x' }),
    ).toBe('People');
    expect(chipOutlet(undefined)).toBeUndefined();
  });
});

describe('ConfidenceBanner', () => {
  it('renders a chip named by the label and outlet', () => {
    render(createElement(ConfidenceBanner, { confidence: 'reputable_reporting', outlet: 'People' }));
    const chip = screen.getByRole('note', { name: 'Reported — not confirmed, per People' });
    expect(chip.tagName).toBe('SPAN');
    expect(chip.className).toContain('rounded-full');
    expect(chip.textContent).toContain('per People');
    expect(chip.textContent).not.toContain('Press reporting');
  });

  it('renders nothing for a confirmed moment', () => {
    const { container } = render(createElement(ConfidenceBanner, { confidence: 'official' }));
    expect(container.innerHTML).toBe('');
  });
});

describe('ConfidenceNote', () => {
  it('carries the explainer for the footer', () => {
    render(createElement(ConfidenceNote, { confidence: 'plausible' }));
    expect(screen.getByText(/A plausible but unconfirmed claim\./)).toBeTruthy();
    expect(screen.getByText('Rumor — unconfirmed.')).toBeTruthy();
  });

  it('renders nothing for a confirmed moment', () => {
    const { container } = render(createElement(ConfidenceNote, { confidence: 'official' }));
    expect(container.innerHTML).toBe('');
  });
});
