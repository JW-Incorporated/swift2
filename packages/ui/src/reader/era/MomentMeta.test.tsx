// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ContentItem } from '@swift2/experience';
import { MomentMeta } from './MomentCardButton';

afterEach(cleanup);

const item = {
  id: 'm1',
  dateLabel: 'September 27, 2026',
  significance: 'major',
  confidence: 'rumor',
  hiddenClue: 'x',
} as unknown as ContentItem;

describe('MomentMeta', () => {
  it('keeps the date on one line and lets the badge cluster wrap instead', () => {
    render(<MomentMeta item={item} seen />);
    const date = screen.getByText('September 27, 2026');
    expect(date.className).toContain('whitespace-nowrap');
    expect(date.className).toContain('shrink-0');
    const cluster = date.nextElementSibling as HTMLElement;
    expect(cluster.className).toContain('flex-wrap');
    expect(cluster.className).toContain('min-w-0');
    expect(cluster.className).not.toContain('shrink-0');
  });
});
