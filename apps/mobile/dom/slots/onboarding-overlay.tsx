import { useEffect, useRef, useState } from 'react';
import { ONBOARDING_PRESETS, type OnboardingPresetId } from '@swift2/shared';
import { useHost } from '@swift2/ui';
import { useBackDismiss } from '@swift2/ui/reader/lib/useBackDismiss';
import { useFocusTrap } from '@swift2/ui/reader/moment/lib/useFocusTrap';
import { onboardingOverlay, useOnboardingPhase } from './onboarding-store';
import { NEUTRAL } from './settings-page';
import { settingsOverlay, useSettingsOpen } from './settings-store';

// The push-permission offer (spec §7), shown once at the first value moment: the first time the settings overlay
// opens (Settings button or bell). Capability-gated: it needs the native host (notifications + the persisted
// "offered" flag), an undetermined OS permission, and an unset flag, so the web adapter (no host.notifications)
// never renders it. Every failure to find out fails closed (not shown). The OS dialog fires only after a choice.
// It stacks above the settings overlay (registered after it); Settings is inert while it is up, Back dismisses it
// first (reader-bridge), and closing Settings withdraws it.
const SAVE_ERROR = "Couldn't save that. Try again.";
const SETUP_ERROR = "Couldn't finish setting that up. Try again, or pick Not now.";

export function OnboardingOverlay() {
  const { notifications, navigate } = useHost();
  const settingsOpen = useSettingsOpen();
  const phase = useOnboardingPhase();
  const [busy, setBusy] = useState<OnboardingPresetId | 'skip' | 'customize' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const capable = !!notifications?.onboardingOffered && !!notifications.markOnboardingOffered;
  useFocusTrap(phase === 'shown', root);
  // Back while a CTA is in flight is swallowed by the bridge's busy guard before the stack is consulted.
  useBackDismiss(phase === 'shown' && !!notifications, () => void (!onboardingOverlay.isBusy() && onboardingOverlay.set('done')));

  useEffect(() => {
    if (!settingsOpen || phase !== 'idle' || !notifications || !capable) return;
    onboardingOverlay.set('checking');
    (async () => {
      if ((await notifications.status()) !== 'undetermined') return 'done';
      return (await notifications.onboardingOffered!()) === false ? 'shown' : 'done';
    })().then(
      (next) => onboardingOverlay.set(settingsOverlay.isOpen() ? next : next === 'shown' ? 'idle' : 'done'),
      () => onboardingOverlay.set('done'),
    );
  }, [settingsOpen, phase, notifications, capable]);

  // Settings closing withdraws a showing offer (it re-checks on the next open); a pending check settles itself.
  useEffect(() => {
    if (!settingsOpen && onboardingOverlay.phase() === 'shown') onboardingOverlay.set('idle');
  }, [settingsOpen]);

  if (phase !== 'shown' || !notifications) return null;

  const persist = async (after?: () => void): Promise<boolean> => {
    try {
      await notifications.markOnboardingOffered!();
    } catch {
      setError(SAVE_ERROR);
      return false;
    }
    onboardingOverlay.set('done');
    if (settingsOverlay.isOpen()) after?.();
    return true;
  };

  const run = async (key: NonNullable<typeof busy>, fn: () => Promise<void>) => {
    if (busy) return;
    setError(null);
    setBusy(key);
    onboardingOverlay.setBusy(true);
    try {
      await fn();
    } finally {
      onboardingOverlay.setBusy(false);
      setBusy(null);
    }
  };

  const choose = (id: OnboardingPresetId) =>
    run(id, async () => {
      const preset = ONBOARDING_PRESETS.find((p) => p.id === id);
      if (!preset) return;
      try {
        // Prefs first, then the OS dialog: a denial still keeps the chosen prefs (same order as the native screen).
        await notifications.savePrefs({ prefs: [...preset.prefs] });
        if ((await notifications.request()) === 'granted') await notifications.register();
      } catch {
        setError(SETUP_ERROR);
        return;
      }
      await persist();
    });

  return (
    <div ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Stay in the loop" className="fixed inset-0 z-[60] overflow-y-auto outline-none" style={NEUTRAL}>
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-6 pb-16 pt-[max(4rem,var(--safe-top,0px))]">
        <h2 className="text-2xl font-semibold text-ink">Stay in the loop</h2>
        <p className="text-sm text-ink/70">Pick how much you want to hear from Long Live. You can change this any time.</p>
        {ONBOARDING_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy !== null}
            aria-busy={busy === p.id}
            onClick={() => void choose(p.id)}
            className="rounded-2xl border border-white/20 px-5 py-4 text-left text-ink disabled:opacity-60"
          >
            <span className="block text-base font-semibold">{p.title}</span>
            <span className="mt-1 block text-sm text-ink/70">{p.description}</span>
          </button>
        ))}
        {error && (
          <p role="alert" className="text-sm text-ink">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void run('customize', async () => void (await persist(() => navigate('/settings/notifications'))))}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
        >
          Customize
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void run('skip', async () => void (await persist()))}
          className="px-5 py-2.5 text-sm font-medium text-ink/70 disabled:opacity-60"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
