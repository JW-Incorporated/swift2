// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { HostProvider } from '@swift2/ui';
import { ReaderRoot, type ReaderSlots } from '@swift2/ui/reader/shell/ReaderShell';
import { useAppActions } from '@/lib/longlive/store';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { createWebAdapter } from '@/lib/host-adapter';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    require('react').createElement('a', { href, ...props }, children),
}));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

function ModeButtons() {
  const { setMode } = useAppActions();
  return <button data-testid="go-threads" onClick={() => setMode('threads')} />;
}

const slots: ReaderSlots = {
  surfaces: { era: () => <div />, threads: () => <div /> },
  overlays: [ModeButtons],
  fallback: () => <div />,
};

const web = createWebAdapter({ push() {}, replace() {} });

function tree(adapter: object) {
  return (
    <HostProvider adapter={adapter as never}>
      <ReaderRoot slots={slots} />
    </HostProvider>
  );
}

describe('ReaderShell theme emission', () => {
  it('web adapter has no theme hook, and markup matches the app-hosted markup', () => {
    expect('theme' in web).toBe(false);
    const a = renderWithReader(tree(web));
    const webHtml = a.container.innerHTML;
    a.unmount();
    const b = renderWithReader(tree({ ...web, theme: vi.fn() }));
    expect(b.container.innerHTML).toBe(webHtml);
    b.unmount();
  });

  it('with no hook it still syncs the theme-color meta', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
    renderWithReader(tree(web));
    expect(meta.getAttribute('content')).toMatch(/^#[0-9a-f]{6}$/i);
    act(() => screen.getByTestId('go-threads').click());
    expect(meta.getAttribute('content')).toBe('#0b0b0f');
    meta.remove();
  });

  it('with a hook it emits once per distinct colour (not per render) and again on a surface change', () => {
    const theme = vi.fn();
    const adapter = { ...web, theme };
    const r = renderWithReader(tree(adapter));
    expect(theme).toHaveBeenCalledTimes(1);
    expect(theme.mock.calls[0]![0]).toMatchObject({ background: expect.stringMatching(/^#[0-9a-f]{6}$/i) });
    r.rerender(tree({ ...adapter }));
    expect(theme).toHaveBeenCalledTimes(1);
    act(() => screen.getByTestId('go-threads').click());
    expect(theme).toHaveBeenCalledTimes(2);
    expect(theme).toHaveBeenLastCalledWith({ statusBarStyle: 'light', background: '#0b0b0f' });
  });
});
