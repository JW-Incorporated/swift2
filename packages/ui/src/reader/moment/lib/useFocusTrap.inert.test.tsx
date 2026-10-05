// @vitest-environment jsdom
import { StrictMode, createElement as h, useRef, type RefObject } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

// A11Y-1: aria-modal dialogs must make the rest of the page inert, restore the prior state on close, and nest.
function Dialog({ open, name, keep }: { open: boolean; name: string; keep?: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, ref, null, keep);
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

describe('useFocusTrap inert ownership and edge cases', () => {
  it('out-of-order close: A open, B open, A closes, then B closes', () => {
    const { rerender } = render(h(App, { a: true, b: true }));
    const main = screen.getByTestId('main');
    const top = screen.getByTestId('top');
    const dialogA = document.querySelector('[aria-label="A"]') as HTMLElement;
    const dialogB = document.querySelector('[aria-label="B"]') as HTMLElement;
    expect(main.hasAttribute('inert') && top.hasAttribute('inert') && dialogA.hasAttribute('inert')).toBe(true);
    rerender(h(App, { a: false, b: true }));
    expect(main.hasAttribute('inert')).toBe(true);
    expect(top.hasAttribute('inert')).toBe(true);
    expect(dialogB.closest('[inert]')).toBeNull();
    rerender(h(App, { a: false, b: false }));
    expect(main.hasAttribute('inert')).toBe(false);
    expect(top.hasAttribute('inert')).toBe(false);
  });

  it('survives the StrictMode double effect and still releases fully', () => {
    const { rerender } = render(h(StrictMode, null, h(App, { a: true })));
    expect(screen.getByTestId('main').hasAttribute('inert')).toBe(true);
    expect(screen.getByRole('dialog', { name: 'A' }).closest('[inert]')).toBeNull();
    rerender(h(StrictMode, null, h(App, { a: false })));
    expect(document.querySelectorAll('[inert]').length).toBe(0);
  });

  it('never removes an inert that a non-trap owner set mid-claim (React inert prop toggling)', () => {
    const { rerender } = render(h(App, { a: false }));
    const main = screen.getByTestId('main');
    rerender(h(App, { a: true }));
    expect(main.getAttribute('inert')).toBe('focus-trap');
    main.setAttribute('inert', ''); // an owner (React 19 inert prop) takes the attribute over mid-claim
    rerender(h(App, { a: false }));
    expect(main.getAttribute('inert')).toBe('');
    main.removeAttribute('inert'); // owner clears it
    rerender(h(App, { a: true }));
    main.setAttribute('inert', '');
    main.removeAttribute('inert');
    rerender(h(App, { a: false }));
    expect(main.hasAttribute('inert')).toBe(false);
  });

  it('keepLive exempts the opener (and its ancestors) while the rest stays inert', () => {
    function Page({ open }: { open: boolean }) {
      const toggle = useRef<HTMLButtonElement>(null);
      return h(
        'div',
        null,
        h('p', { 'data-testid': 'other' }, 'other'),
        h('div', { 'data-testid': 'cluster' }, h('button', { ref: toggle }, 'toggle'), h('button', { 'data-testid': 'sib' }, 'dismiss')),
        h(Dialog, { open, name: 'A', keep: toggle }),
      );
    }
    const { rerender } = render(h(Page, { open: false }));
    rerender(h(Page, { open: true }));
    expect(screen.getByText('toggle').closest('[inert]')).toBeNull();
    expect(screen.getByTestId('cluster').hasAttribute('inert')).toBe(false);
    expect(screen.getByTestId('sib').hasAttribute('inert')).toBe(true);
    expect(screen.getByTestId('other').hasAttribute('inert')).toBe(true);
    rerender(h(Page, { open: false }));
    expect(document.querySelectorAll('[inert]').length).toBe(0);
  });
});
