// @vitest-environment jsdom
import { createElement, forwardRef } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HostProvider } from '../../host/context';
import type { HostAdapter } from '../../host/types';
import { Byline } from './Byline';

const Link = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) =>
  createElement('a', { ...props, ref }),
);

afterEach(cleanup);

// #6771 / WCAG 2.5.3: the accessible name must contain the visible "By <name>".
describe('Byline accessible name', () => {
  it('contains the visible text and keeps the desk context, with no aria-label', () => {
    render(
      createElement(
        HostProvider,
        { adapter: { Link } as unknown as HostAdapter },
        createElement(Byline, { author: 'vera' }),
      ),
    );
    const link = screen.getByTestId('byline');
    expect(link.hasAttribute('aria-label')).toBe(false);
    const name = screen.getByRole('link', { name: /^By Vera/ }).textContent ?? '';
    expect(name).toContain('By Vera');
    expect(name).toContain('one of our editorial characters. Meet the desk.');
    expect(link.querySelector('[aria-hidden="true"]')?.textContent).toBe('V');
  });
});
