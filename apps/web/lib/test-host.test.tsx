// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { useHost } from '@swift2/ui';
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
