// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// next/link resolves react through Next's own dependency chain, which in
// this npm-hoisted monorepo can land on a different react copy than
// apps/web's (multiple React instances in one render tree break hooks).
// TopBar only uses Link for the static notification-settings icon button,
// so a plain anchor stand-in preserves the render contract this test cares
// about (the actions group's DOM shape) without dragging in Next's router.
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    require('react').createElement('a', { href, ...props }, children),
}));

import { TopBar } from './TopBar';
import { AppProvider } from '@/lib/longlive/store';
import { TOPBAR_ACTIONS_CLASS, TOPBAR_LEFT_CLASS, TOPBAR_ROW_CLASS } from './topbarLayout';

function renderTopBar() {
  return render(
    <AppProvider>
      <TopBar />
    </AppProvider>,
  );
}

describe('TopBar layout', () => {
  // Regression for #492: the #457 grid (`minmax(0,1fr)` side columns) split
  // the row 50/50 regardless of content, truncating long era names. What
  // carries the fix: no grid columns, a left group that can shrink
  // (min-w-0, so the era name truncates last), and an actions group that
  // never gets squeezed (shrink-0). Rendered for real (jsdom + AppProvider)
  // instead of source-string pins, so the assertions track what actually
  // lands on the DOM nodes rather than the constant definitions alone.
  it('gives the era name all width the actions group leaves free (#492)', () => {
    // The exported constants themselves still encode the layout contract...
    expect(TOPBAR_ROW_CLASS).not.toContain('grid-cols-');
    expect(TOPBAR_LEFT_CLASS).toContain('min-w-0');
    expect(TOPBAR_ACTIONS_CLASS).toContain('shrink-0');

    // ...and a real render proves they are actually wired onto the row's
    // left/actions groups, not just defined somewhere unused.
    renderTopBar();
    const header = screen.getByRole('banner');
    const row = header.querySelector(`.${CSS.escape(TOPBAR_ROW_CLASS.split(' ')[0])}`);
    expect(row).not.toBeNull();
    expect(row?.className).not.toMatch(/grid-cols-/);

    const leftGroup = header.querySelector('.min-w-0');
    expect(leftGroup).not.toBeNull();
    expect(leftGroup?.className).toContain('min-w-0');

    // The wordmark/era-name group renders inside the shrinkable left group,
    // and the icon actions render inside the never-squeezed actions group.
    expect(screen.getByRole('button', { name: /back to home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search the archive/i })).toBeInTheDocument();
  });
});
