// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HostProvider } from '../../host/context';
import type { HostAdapter } from '../../host/types';
import { FeedbackButton } from './FeedbackButton';
import { FEEDBACK_DRAFT_KEY, FEEDBACK_QUEUE_KEY } from './lib/feedback-outbox';

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

const store = (m: Map<string, string>) => ({
  get: (k: string) => m.get(k) ?? null,
  set: (k: string, v: string) => void m.set(k, v),
  remove: (k: string) => void m.delete(k),
});

function makeHost(local: Map<string, string>, apiFetch: ReturnType<typeof vi.fn>) {
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

const send = () => fireEvent.click(screen.getByRole('button', { name: 'Send' }));
const fireOnline = () =>
  act(async () => {
    window.dispatchEvent(new Event('online'));
  });
const queueOf = (local: Map<string, string>) => JSON.parse(local.get(FEEDBACK_QUEUE_KEY) ?? '[]');
const bodyOf = (apiFetch: ReturnType<typeof vi.fn>, call = 0) =>
  JSON.parse(apiFetch.mock.calls[call]![0].body);

describe('FeedbackButton outbox', () => {
  let local: Map<string, string>;
  let apiFetch: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    local = new Map();
    apiFetch = vi.fn().mockResolvedValue(ok);
  });
  afterEach(() => setOnline(true));

  it('is attempt-first: navigator.onLine=false does not stop the send, and the POST carries an id', async () => {
    setOnline(false);
    mount(local, apiFetch);
    await openAndType('typo');
    send();
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
    expect(bodyOf(apiFetch).id).toMatch(/\S{8,}/);
    await waitFor(() => expect(local.has(FEEDBACK_QUEUE_KEY)).toBe(false));
  });

  it('a transport failure queues with a stable id; one resend on online reuses it and clears on 2xx', async () => {
    apiFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    mount(local, apiFetch);
    await openAndType('typo on page');
    send();
    await waitFor(() => expect(queueOf(local)).toHaveLength(1));
    const [{ id }] = queueOf(local);
    expect(local.has(FEEDBACK_DRAFT_KEY)).toBe(false);

    await fireOnline();
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    expect(bodyOf(apiFetch, 1).id).toBe(id);
    await waitFor(() => expect(local.has(FEEDBACK_QUEUE_KEY)).toBe(false));

    await fireOnline();
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it('a failed auto-resend is not retried again and stays queued', async () => {
    apiFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    mount(local, apiFetch);
    await openAndType('broken');
    send();
    await waitFor(() => expect(queueOf(local)).toHaveLength(1));
    await fireOnline();
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    await fireOnline();
    expect(apiFetch).toHaveBeenCalledTimes(2);
    expect(queueOf(local)).toHaveLength(1);
  });

  it('HTTP errors are shown, never queued or retried', async () => {
    apiFetch.mockResolvedValue({ status: 429, body: JSON.stringify({ error: 'Slow down.' }) });
    mount(local, apiFetch);
    await openAndType('spam?');
    send();
    expect(await screen.findByText('Slow down.')).toBeTruthy();
    expect(local.has(FEEDBACK_QUEUE_KEY)).toBe(false);
    await fireOnline();
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('spam?');
  });

  it('persists the draft on edit (debounced) and clears it when emptied', async () => {
    mount(local, apiFetch);
    await openAndType('half-written');
    expect(local.has(FEEDBACK_DRAFT_KEY)).toBe(false);
    await waitFor(() => expect(local.get(FEEDBACK_DRAFT_KEY)).toContain('half-written'), {
      timeout: 2000,
    });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    await waitFor(() => expect(local.has(FEEDBACK_DRAFT_KEY)).toBe(false), { timeout: 2000 });
  });

  it('a new mount restores the unsent draft', async () => {
    const first = mount(local, apiFetch);
    await openAndType('keep me');
    await waitFor(() => expect(local.get(FEEDBACK_DRAFT_KEY)).toContain('keep me'), {
      timeout: 2000,
    });
    first.unmount();
    mount(local, apiFetch);
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    expect(((await screen.findByRole('textbox')) as HTMLTextAreaElement).value).toBe('keep me');
  });

  it('a new mount sends a queued report once, then clears it', async () => {
    local.set(
      FEEDBACK_QUEUE_KEY,
      JSON.stringify([{ id: 'queued-id-0001', message: 'from before' }]),
    );
    mount(local, apiFetch);
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
    expect(bodyOf(apiFetch).id).toBe('queued-id-0001');
    await waitFor(() => expect(local.has(FEEDBACK_QUEUE_KEY)).toBe(false));
  });
});
