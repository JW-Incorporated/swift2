// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { createElement as h } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HostProvider, resOk } from '@swift2/ui';
import { SubmitLinkForm } from '@swift2/ui/reader/merch/SubmitLinkForm';
// apps/mobile pins its own React; the render tests need the one @testing-library and react-dom use (apps/web's).
// @ts-expect-error no types for the deep path; only the runtime module matters
vi.mock('react', async () => await import('../../../web/node_modules/react/index.js'));
import { createAppAdapter } from '../bridge/app-adapter';

afterEach(cleanup);

function mount(section: 'community' | 'merch') {
  const call = vi.fn(async (..._args: unknown[]) => resOk(null));
  const apiFetch = vi.fn(async () => resOk(null));
  const adapter = createAppAdapter({
    client: { call: call as never },
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    isNativeRoute: () => false,
    navigateDom: vi.fn(),
    getPath: () => '/',
    apiFetch: apiFetch as never,
    onBack: () => () => {},
  });
  render(h(HostProvider, { adapter, children: h(SubmitLinkForm, { section }) }));
  return { call, apiFetch };
}

describe('Submit a link in the app (Turnstile cannot run in the DOM host)', () => {
  it.each(['community', 'merch'] as const)('%s: no inline form; the action opens the website form externally', (section) => {
    const { call, apiFetch } = mount(section);
    expect(screen.queryByLabelText('Link URL')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Submit' })).toBeNull();
    const link = screen.getByRole('link', { name: /Submit on longlivets\.com/ });
    expect(fireEvent.click(link)).toBe(false);
    expect(call).toHaveBeenCalledWith('openExternal', { url: `https://www.longlivets.com/?mode=${section}` });
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
