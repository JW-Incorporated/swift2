// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { useHost } from '@swift2/ui';
import { Button } from '@/components/ui/button';
import { TestHostProvider } from './test-host';

function Probe({ seen }: { seen: { Image: unknown; Link: unknown }[] }) {
  const { Image, Link } = useHost();
  seen.push({ Image, Link });
  return (
    <Link href="/x" className="probe">
      <Image src="/a.png" alt="a" width={4} height={4} />
    </Link>
  );
}

function BellLink({ anchorRef }: { anchorRef: { current: HTMLAnchorElement | null } }) {
  const { Link } = useHost();
  return (
    <Button variant="surface" size="icon" aria-label="Bell" title="Bell tip" asChild>
      <Link href="/settings/notifications" ref={anchorRef as never}>
        <span>b</span>
      </Link>
    </Button>
  );
}

describe('Radix Slot props land on the host Link anchor', () => {
  it('forwards className, aria-label, title and ref to the anchor', () => {
    const anchorRef: { current: HTMLAnchorElement | null } = { current: null };
    const { container } = render(
      <TestHostProvider>
        <BellLink anchorRef={anchorRef} />
      </TestHostProvider>,
    );
    const a = container.querySelector('a');
    expect(a).not.toBeNull();
    expect(a!.getAttribute('href')).toBe('/settings/notifications');
    expect(a!.getAttribute('aria-label')).toBe('Bell');
    expect(a!.getAttribute('title')).toBe('Bell tip');
    expect(a!.className).toMatch(/\S/);
    expect(a!.className).toContain('inline-flex');
    expect(anchorRef.current).toBe(a);
  });
});

describe('reader call sites use a stable host Image/Link', () => {
  it('keeps the same element types and DOM nodes across re-renders (no remount)', () => {
    const seen: { Image: unknown; Link: unknown }[] = [];
    const { container, rerender } = render(
      <TestHostProvider>
        <Probe seen={seen} />
      </TestHostProvider>,
    );
    const anchor = container.querySelector('a.probe');
    const img = container.querySelector('img');
    expect(anchor).not.toBeNull();
    expect(img).not.toBeNull();

    rerender(
      <TestHostProvider>
        <Probe seen={seen} />
      </TestHostProvider>,
    );

    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen[seen.length - 1]!.Image).toBe(seen[0]!.Image);
    expect(seen[seen.length - 1]!.Link).toBe(seen[0]!.Link);
    expect(container.querySelector('a.probe')).toBe(anchor);
    expect(container.querySelector('img')).toBe(img);
  });
});
