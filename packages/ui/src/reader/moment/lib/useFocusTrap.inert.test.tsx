// @vitest-environment jsdom
import { createElement as h, useRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

// A11Y-1: aria-modal dialogs must make the rest of the page inert, restore the prior state on close, and nest.
function Dialog({ open, name }: { open: boolean; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, ref);
  if (!open) return null;
  return h('div', { ref, role: 'dialog', 'aria-modal': 'true', 'aria-label': name, tabIndex: -1 }, h('button', null, `${name} button`));
}

function App({ a, b }: { a: boolean; b?: boolean }) {
  return h(
    'div',
    null,
    h('header', { 'data-testid': 'top' }, 'bar'),
    h('main', { 'data-testid': 'main' }, h('button', null, 'opener')),
    h(Dialog, { open: a, name: 'A' }),
    h(Dialog, { open: !!b, name: 'B' }),
  );
}

afterEach(cleanup);

describe('useFocusTrap inert background', () => {
  it('sets inert on siblings while open and restores on close, keeping the dialog live', () => {
    const { rerender } = render(h(App, { a: false }));
    expect(screen.getByTestId('top').hasAttribute('inert')).toBe(false);
    rerender(h(App, { a: true }));
    expect(screen.getByTestId('top').hasAttribute('inert')).toBe(true);
    expect(screen.getByTestId('main').hasAttribute('inert')).toBe(true);
    expect(screen.getByRole('dialog', { name: 'A' }).closest('[inert]')).toBeNull();
    rerender(h(App, { a: false }));
    expect(screen.getByTestId('top').hasAttribute('inert')).toBe(false);
    expect(screen.getByTestId('main').hasAttribute('inert')).toBe(false);
  });

  it('restores exactly the previous inert state of an already-inert region', () => {
    const { rerender } = render(h(App, { a: false }));
    screen.getByTestId('main').setAttribute('inert', '');
    rerender(h(App, { a: true }));
    rerender(h(App, { a: false }));
    expect(screen.getByTestId('main').hasAttribute('inert')).toBe(true);
    expect(screen.getByTestId('top').hasAttribute('inert')).toBe(false);
  });

  it('nested dialogs: only the topmost is live, and closing the top re-opens the one beneath', () => {
    const { rerender } = render(h(App, { a: true, b: false }));
    rerender(h(App, { a: true, b: true }));
    const dialogA = document.querySelector('[aria-label="A"]') as HTMLElement;
    const dialogB = document.querySelector('[aria-label="B"]') as HTMLElement;
    expect(dialogA.hasAttribute('inert')).toBe(true);
    expect(dialogB.closest('[inert]')).toBeNull();
    rerender(h(App, { a: true, b: false }));
    expect(dialogA.closest('[inert]')).toBeNull();
    expect(screen.getByTestId('main').hasAttribute('inert')).toBe(true);
    rerender(h(App, { a: false, b: false }));
    expect(screen.getByTestId('main').hasAttribute('inert')).toBe(false);
  });

  it('restores focus to the opener after the inert is released', () => {
    const { rerender } = render(h(App, { a: false }));
    const opener = screen.getByText('opener');
    opener.focus();
    rerender(h(App, { a: true }));
    expect(document.activeElement).not.toBe(opener);
    rerender(h(App, { a: false }));
    expect(document.activeElement).toBe(opener);
  });
});
