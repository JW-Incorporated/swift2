// The not-subscribed face of notification settings: the pending-opt-out notice, permission/error hints and the enable button.
export type PromptKind = 'not_subscribed' | 'subscribing' | 'denied' | 'error';

export function SubscribePrompt({
  kind,
  message,
  deniedHint,
  optOutPending,
  onSubscribe,
}: {
  kind: PromptKind;
  message?: string;
  deniedHint?: string;
  optOutPending: boolean;
  onSubscribe: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      {optOutPending && (
        <p role="status" className="max-w-md text-center text-sm text-ink-soft">
          We’ll finish turning off notifications when you’re back online.
        </p>
      )}
      {kind === 'denied' && (
        <p className="max-w-md text-center text-sm text-ink-soft">
          {deniedHint ??
            'Notifications are blocked for this site in your browser settings. Allow them there, then reload this page.'}
        </p>
      )}
      {kind === 'error' && <p className="max-w-md text-center text-sm text-ink-soft">{message}</p>}
      <button
        type="button"
        onClick={onSubscribe}
        disabled={kind === 'subscribing' || kind === 'denied'}
        className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-[color:var(--era-accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {kind === 'subscribing' ? 'Enabling\u2026' : 'Enable notifications'}
      </button>
    </div>
  );
}
