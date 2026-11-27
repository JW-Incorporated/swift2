// The not-subscribed face of notification settings: the pending-opt-out notice, permission/error hints and the enable button.
import { useState } from 'react';
import { SETTINGS_OPEN_FAILED } from './driver';

export type PromptKind = 'not_subscribed' | 'subscribing' | 'denied' | 'error';

export function SubscribePrompt({
  kind,
  message,
  deniedHint,
  optOutPending,
  onSubscribe,
  onOpenSettings,
}: {
  kind: PromptKind;
  message?: string;
  deniedHint?: string;
  optOutPending: boolean;
  onSubscribe: () => void;
  /** App only: a real OS denial offers "Open Settings" in place of the disabled enable button; resolves false when it could not open. */
  onOpenSettings?: () => Promise<boolean>;
}) {
  const [settingsFailed, setSettingsFailed] = useState(false);
  const settingsAction = kind === 'denied' && onOpenSettings;
  const openSettings = () => void onOpenSettings?.().then((opened) => setSettingsFailed(!opened));
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
      {settingsAction && settingsFailed && (
        <p role="alert" className="max-w-md text-center text-sm text-ink-soft">
          {SETTINGS_OPEN_FAILED}
        </p>
      )}
      <button
        type="button"
        onClick={settingsAction ? openSettings : onSubscribe}
        disabled={kind === 'subscribing' || (kind === 'denied' && !settingsAction)}
        className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-[color:var(--era-accent-fg)] transition-opacity hover:opacity-90 disabled:bg-surface disabled:text-ink-soft disabled:hover:opacity-100"
      >
        {settingsAction ? 'Open Settings' : kind === 'subscribing' ? 'Enabling\u2026' : 'Enable notifications'}
      </button>
    </div>
  );
}
