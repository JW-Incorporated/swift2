// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { ClownChat } from './ClownChat';
import { AppProvider } from '@/lib/longlive/store';
import { MAX_TEXTAREA_HEIGHT_PX } from '@/lib/longlive/clown-chat-ui';
import { useStickToBottomScroll } from '@/lib/longlive/clown-chat-ui';

function renderClownChat() {
  return render(
    <AppProvider>
      <ClownChat />
    </AppProvider>,
  );
}

describe('ClownChat empty state', () => {
  it('never pre-fills a fake example conversation', () => {
    const { container } = renderClownChat();
    // No message row/turn is rendered before the reader sends anything —
    // the empty state renders instead of any transcript content.
    expect(screen.queryByText(/example conversation/i)).not.toBeInTheDocument();
    expect(container.querySelector('[class*="clown-seed-example"]')).toBeNull();
  });

  it('shows a small, unobtrusive line instead', () => {
    renderClownChat();
    expect(screen.getByText('Try our chat bot — ask a question below.')).toBeInTheDocument();
  });

  it('shows plain-language jargon definitions and prefill starters', () => {
    renderClownChat();
    // The empty state's starter buttons live in their own labeled group
    // (ClownEmptyState.tsx) and prefill the composer on tap — never send.
    const starterGroup = screen.getByRole('group', { name: /clownbot starter questions/i });
    const starterButtons = within(starterGroup).getAllByRole('button');
    expect(starterButtons.length).toBeGreaterThan(0);

    const textarea = screen.getByLabelText(/ask the clown/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
    fireEvent.click(starterButtons[0]);
    // Selecting a starter prefills the composer textarea with its prompt —
    // and must NOT submit (no fetch is triggered / busy state entered).
    expect(textarea.value.length).toBeGreaterThan(0);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('ClownChat composer auto-resize', () => {
  it('grows the textarea with typed content, capped at a fixed max height', () => {
    renderClownChat();
    const textarea = screen.getByLabelText(/ask the clown/i) as HTMLTextAreaElement;

    // jsdom never lays out text, so scrollHeight stays 0 — stub it to
    // exercise the real clamp-and-set-height logic in useAutoResizeTextarea
    // (clown-chat-ui.ts) rather than re-testing jsdom's lack of layout.
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      value: MAX_TEXTAREA_HEIGHT_PX + 40,
    });
    fireEvent.change(textarea, { target: { value: 'a longer question that would wrap several lines' } });

    expect(textarea.style.height).toBe(`${MAX_TEXTAREA_HEIGHT_PX}px`);
  });

  it('scrolls internally instead of growing further past the cap', () => {
    renderClownChat();
    const textarea = screen.getByLabelText(/ask the clown/i) as HTMLTextAreaElement;
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      value: MAX_TEXTAREA_HEIGHT_PX + 40,
    });
    fireEvent.change(textarea, { target: { value: 'x'.repeat(200) } });
    expect(textarea.style.overflowY).toBe('auto');
  });
});

describe('ClownChat message stream auto-scroll', () => {
  it('renders the stream as a polite live region so new content is announced', () => {
    const { container } = renderClownChat();
    // useStickToBottomScroll wires the stream container's scroll behavior;
    // aria-live="polite" is the render-observable contract that new turns
    // get announced/kept in view — the real scrollTop write itself is
    // exercised behaviorally below, against the real hook, not the
    // component's fetch-driven `deps` (which would need mocking the whole
    // network/stream path just to flip them).
    const stream = container.querySelector('[aria-live="polite"]');
    expect(stream).not.toBeNull();
    expect(stream).toHaveAttribute('aria-atomic', 'false');
  });
});

describe('useStickToBottomScroll (real behavior, not source-grep)', () => {
  function Harness({ dep }: { dep: number }) {
    const ref = useRef<HTMLDivElement>(null);
    useStickToBottomScroll(ref, [dep]);
    return <div ref={ref} data-testid="stream" />;
  }

  function stubScrollGeometry(el: HTMLElement, { scrollHeight, clientHeight, scrollTop = 0 }: { scrollHeight: number; clientHeight: number; scrollTop?: number }) {
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
    Object.defineProperty(el, 'scrollTop', { configurable: true, value: scrollTop, writable: true });
  }

  it('pins the container to its full scrollHeight while the reader stays near the bottom', () => {
    const { getByTestId, rerender } = render(<Harness dep={0} />);
    const stream = getByTestId('stream');
    stubScrollGeometry(stream, { scrollHeight: 400, clientHeight: 200 });
    // `deps` changing (a new message/step/error) re-runs the pin effect;
    // nearBottomRef starts true, so it must jump straight to the bottom.
    rerender(<Harness dep={1} />);
    expect(stream.scrollTop).toBe(400);
  });

  it('never yanks the container back down once the reader has scrolled up mid-stream', () => {
    const { getByTestId, rerender } = render(<Harness dep={0} />);
    const stream = getByTestId('stream');
    stubScrollGeometry(stream, { scrollHeight: 400, clientHeight: 200 });
    // 150px from the bottom — past AUTO_SCROLL_THRESHOLD_PX (96px) — is a
    // deliberate scroll-up, not noise.
    stream.scrollTop = 50;
    fireEvent.scroll(stream);
    rerender(<Harness dep={1} />);
    expect(stream.scrollTop).toBe(50);
  });
});
