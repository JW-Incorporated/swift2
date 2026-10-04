// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HostProvider } from '@swift2/ui';
import { MailtoLink } from '@swift2/ui/reader/legal/MailtoLink';
import { createWebAdapter } from '@/lib/host-adapter';

const router = { push() {}, replace() {} };

function mount(href: string, openExternal?: (url: string) => void) {
  const adapter = { ...createWebAdapter(router), ...(openExternal ? { openExternal } : {}) };
  render(
    <HostProvider adapter={adapter}>
      <MailtoLink href={href}>mail</MailtoLink>
    </HostProvider>,
  );
  return screen.getByRole('link', { name: 'mail' });
}

// Records whether React/the link already cancelled the click, then cancels it so jsdom does not try to navigate.
function clickPrevented(a: HTMLElement): boolean {
  let prevented = false;
  const spy = (e: Event) => {
    prevented = e.defaultPrevented;
    e.preventDefault();
  };
  document.addEventListener('click', spy);
  fireEvent.click(a);
  document.removeEventListener('click', spy);
  return prevented;
}

describe('MailtoLink (WP2.13 A2b)', () => {
  afterEach(cleanup);

  it('web adapter has no openExternal; the click is not intercepted', () => {
    expect(createWebAdapter(router).openExternal).toBeUndefined();
    const a = mount('mailto:a@b.test');
    expect(a).toHaveAttribute('href', 'mailto:a@b.test');
    expect(clickPrevented(a)).toBe(false);
  });

  it('routes a valid mailto through host.openExternal and cancels the navigation', () => {
    const open = vi.fn();
    const a = mount('mailto:a@b.test', open);
    expect(clickPrevented(a)).toBe(true);
    expect(open).toHaveBeenCalledWith('mailto:a@b.test');
  });

  it('leaves a non-mailto href to the browser even with a host opener', () => {
    const open = vi.fn();
    const a = mount('mailto:a@b.test?bcc=c@d.test', open);
    expect(clickPrevented(a)).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });
});
