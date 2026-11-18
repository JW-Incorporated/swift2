// Catches a render throw from the reader so the DOM host never goes blank. The error goes out through the host's
// reportError (a `dom-error` signal; a watchdog strike only before ready). A throw shortly after a remount retries
// automatically at most MAX_AUTO_RETRIES times inside RAPID_WINDOW_MS; past that the fallback waits for a tap.
import { Component, Fragment, type ReactNode } from 'react';

export const MAX_AUTO_RETRIES = 2;
export const RAPID_WINDOW_MS = 10_000;

/** Pure loop guard: `recent` holds earlier throw times; returns the decision and the history to keep. */
export function nextBoundaryStep(recent: readonly number[], now: number): { step: 'retry' | 'fallback'; recent: number[] } {
  const kept = recent.filter((t) => now - t >= 0 && now - t < RAPID_WINDOW_MS);
  const step = kept.length < MAX_AUTO_RETRIES ? 'retry' : 'fallback';
  return { step, recent: [...kept, now] };
}

interface Props {
  children: ReactNode;
  onError: (message: string) => void;
  now?: () => number;
}

interface State {
  failed: boolean;
  generation: number;
}

export class ReaderErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, generation: 0 };
  private recent: number[] = [];

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.props.onError(`reader-render: ${message}`.slice(0, 200));
    const { step, recent } = nextBoundaryStep(this.recent, (this.props.now ?? Date.now)());
    this.recent = recent;
    if (step === 'retry') this.remount();
  }

  private remount(): void {
    this.setState((s) => ({ failed: false, generation: s.generation + 1 }));
  }

  private reload = (): void => {
    this.recent = [];
    this.remount();
  };

  render(): ReactNode {
    if (!this.state.failed) return <Fragment key={this.state.generation}>{this.props.children}</Fragment>;
    return (
      <div role="alert" data-reader-fallback="" style={fallbackStyle}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Something went wrong</p>
        <button type="button" onClick={this.reload} style={buttonStyle}>
          Reload
        </button>
      </div>
    );
  }
}

const fallbackStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: 24,
  background: '#111',
  color: '#fff',
  fontFamily: 'system-ui, sans-serif',
  textAlign: 'center',
} as const;

const buttonStyle = {
  minHeight: 44,
  minWidth: 120,
  padding: '10px 24px',
  border: '1px solid #fff',
  borderRadius: 8,
  background: 'transparent',
  color: '#fff',
  fontSize: 16,
  fontWeight: 700,
} as const;
