// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HostProvider } from '../../host/context';
import type { HostAdapter } from '../../host/types';
import { FeedbackButton } from './FeedbackButton';
import { FEEDBACK_DRAFT_KEY } from './lib/feedback-outbox';

vi.mock('../store', () => ({ useAppState: () => ({ clownChatExpanded: false }) }));
vi.mock('./lib/feedback-location', () => ({
  buildLocation: () => ({}),
  describeView: () => 'home',
}));
vi.mock('../lib/useReportBusy', () => ({ useReportBusy: () => {} }));
vi.mock('../moment/lib/useFocusTrap', () => ({ useFocusTrap: () => {} }));
vi.mock('../lib/useBackDismiss', () => ({ useBackDismiss: () => {} }));

function setOnline(v: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => v });
}

function makeHost(local: Map<string, string>, apiFetch: ReturnType<typeof vi.fn>) {
  const store = (m: Map<string, string>) => ({
    get: (k: string) => m.get(k) ?? null,
    set: (k: string, v: string) => void m.set(k, v),
    remove: (k: string) => void m.delete(k),
  });
  return {
    apiFetch,
    storage: { local: store(local), session: store(new Map()) },
  } as unknown as HostAdapter;
}

const ok = { status: 200, body: '{}' };

function mount(local: Map<string, string>, apiFetch: ReturnType<typeof vi.fn>) {
  return render(
    <HostProvider adapter={makeHost(local, apiFetch)}>
      <FeedbackButton />
    </HostProvider>,
  );
}

async function openAndType(text: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
  fireEvent.change(await screen.findByRole('textbox'), { target: { value: text } });
}

const fireOnline = () =>
  act(async () => {
    window.dispatchEvent(new Event('online'));
  });

describe('FeedbackButton outbox', () => {
  let local: Map<string, string>;
  let apiFetch: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    local = new Map();
    apiFetch = vi.fn().mockResolvedValue(ok);
  });
  afterEach(() => setOnline(true));

  it('offline submit saves a draft without sending, then one resend on online', async () => {
    setOnline(false);
    mount(local, apiFetch);
    await openAndType('typo on page');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(apiFetch).not.toHaveBeenCalled();
    expect(local.get(FEEDBACK_DRAFT_KEY)).toContain('typo on page');

    setOnline(true);
    await fireOnline();
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(local.has(FEEDBACK_DRAFT_KEY)).toBe(false));

    await fireOnline();
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('a failed auto-resend is not retried again', async () => {
    setOnline(false);
    apiFetch.mockResolvedValue({ status: 500, body: '{}' });
    mount(local, apiFetch);
    await openAndType('broken');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    setOnline(true);
    await fireOnline();
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
    await fireOnline();
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(local.get(FEEDBACK_DRAFT_KEY)).toContain('broken');
  });

  it('success clears the draft', async () => {
    mount(local, apiFetch);
    await openAndType('hello');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(local.has(FEEDBACK_DRAFT_KEY)).toBe(false));
  });

  it('a failed send keeps the draft, and a new mount restores it', async () => {
    apiFetch.mockResolvedValue({ status: 500, body: '{}' });
    const first = mount(local, apiFetch);
    await openAndType('keep me');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(local.get(FEEDBACK_DRAFT_KEY)).toContain('keep me'));
    first.unmount();

    mount(local, apiFetch);
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    const box = (await screen.findByRole('textbox')) as HTMLTextAreaElement;
    expect(box.value).toBe('keep me');
  });
});
