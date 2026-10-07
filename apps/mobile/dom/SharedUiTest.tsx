'use dom';

// One UI WP0.4: minimal DOM-host test page. Proves, on device (S3): Tailwind v4
// CSS, a runtime-switched --era-* variable, a Radix dialog/portal, a 50-item
// scroll list, a bundled web font, and the watchdog signals (onReady +
// window.onerror/unhandledrejection -> reportError).
import './shared-ui-test.css';
import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

const ERA_ACCENTS = ['#c9a24b', '#7fb8d9', '#d97fa6'];

interface SharedUiTestProps {
  /** Native actions take the per-epoch token from `bridgeHello` as their LAST arg. */
  bridgeHello: () => Promise<string>;
  onReady: (token: string) => Promise<void>;
  reportError: (message: string, token: string) => Promise<void>;
  /** WP0.4b drill: 'throw' raises an uncaught error instead of ready; 'hang' never signals ready. */
  forceFailure?: 'off' | 'throw' | 'hang';
  dom?: import('expo/dom').DOMProps;
  ref?: React.Ref<object>;
}

export default function SharedUiTest({
  bridgeHello,
  onReady,
  reportError,
  forceFailure = 'off',
}: SharedUiTestProps) {
  const [eraIndex, setEraIndex] = useState(0);

  useEffect(() => {
    document.documentElement.style.setProperty('--era-accent', ERA_ACCENTS[eraIndex]);
  }, [eraIndex]);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void bridgeHello().then((t) => reportError(`error: ${event.message}`, t)).catch(() => undefined);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      void bridgeHello().then((t) => reportError(`unhandledrejection: ${String(event.reason)}`, t)).catch(() => undefined);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [reportError]);

  const readyFired = useRef(false);
  useEffect(() => {
    if (readyFired.current) return;
    readyFired.current = true;
    if (forceFailure === 'hang') return;
    if (forceFailure === 'throw') {
      setTimeout(() => {
        throw new Error('forced DOM failure');
      }, 0);
      return;
    }
    void bridgeHello().then(onReady).catch(() => undefined);
  }, []);

  return (
    <div
      className="flex h-screen flex-col gap-3 p-4 text-white"
      style={{ background: 'var(--era-bg)' }}
    >
      <h1 className="wp04-font text-2xl" style={{ color: 'var(--era-accent)' }}>
        Shared UI host
      </h1>
      <div className="flex gap-2">
        <button
          className="rounded-lg px-3 py-2 text-black"
          style={{ background: 'var(--era-accent)' }}
          onClick={() => setEraIndex((i) => (i + 1) % ERA_ACCENTS.length)}
        >
          Switch era
        </button>
        <Dialog.Root>
          <Dialog.Trigger className="rounded-lg border border-white/40 px-3 py-2">
            Open dialog
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60" />
            <Dialog.Content className="fixed top-1/2 left-1/2 w-72 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-zinc-900 p-4 text-white">
              <Dialog.Title className="wp04-font text-lg">Radix dialog</Dialog.Title>
              <Dialog.Description className="text-sm text-white/70">
                Rendered through a portal.
              </Dialog.Description>
              <Dialog.Close className="mt-3 rounded-lg border border-white/40 px-3 py-1">
                Close
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      <ul className="flex-1 overflow-y-auto rounded-lg border border-white/20">
        {Array.from({ length: 50 }, (_, i) => (
          <li key={i} className="border-b border-white/10 px-3 py-3">
            Row {i + 1}
          </li>
        ))}
      </ul>
    </div>
  );
}
