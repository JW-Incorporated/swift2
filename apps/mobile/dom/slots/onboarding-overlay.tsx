import { useEffect, useRef, useState } from 'react';
import { ONBOARDING_PRESETS, type OnboardingPresetId } from '@swift2/shared';
import { useHost } from '@swift2/ui';
import { NEUTRAL } from './neutral-style';
import { useSettingsOpen } from './settings-store';

// The push-permission offer (spec §7), shown once at the first value moment: the first time the settings overlay
// opens (Settings button or bell). Capability-gated: it needs the native host (notifications + the persisted
// "offered" flag), an undetermined OS permission, and an unset flag, so the web adapter (no host.notifications)
// never renders it. Every failure to find out fails closed (not shown). The OS dialog fires only after a choice.
// It stacks above the settings overlay (registered after it), which stays underneath for "Customize"/"Not now".
export function OnboardingOverlay() {
  const { notifications } = useHost();
  const settingsOpen = useSettingsOpen();
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState<OnboardingPresetId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const checked = useRef(false);

  useEffect(() => {
    if (!settingsOpen || checked.current || !notifications?.onboardingOffered || !notifications.markOnboardingOffered) return;
    checked.current = true;
    let live = true;
    (async () => {
      if ((await notifications.status()) !== 'undetermined') return;
      if ((await notifications.onboardingOffered!()) !== false) return;
      if (live) setShown(true);
    })().catch(() => undefined);
    return () => {
      live = false;
    };
  }, [settingsOpen, notifications]);

  if (!shown || !notifications) return null;

  const finish = async () => {
    await notifications.markOnboardingOffered?.().catch(() => undefined);
    setShown(false);
  };

  const choose = async (id: OnboardingPresetId) => {
    const preset = ONBOARDING_PRESETS.find((p) => p.id === id);
    if (!preset || busy) return;
    setError(null);
    setBusy(id);
    try {
      // Prefs first, then the OS dialog: a denial still keeps the chosen prefs (same order as the native screen).
      await notifications.savePrefs({ prefs: [...preset.prefs] });
      if ((await notifications.request()) === 'granted') await notifications.register();
      await finish();
    } catch {
      setError("Couldn't finish setting that up. Try again, or pick Not now.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Stay in the loop" className="fixed inset-0 z-[60] overflow-y-auto" style={NEUTRAL}>
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
          onClick={() => void finish()}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
        >
          Customize
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void finish()}
          className="px-5 py-2.5 text-sm font-medium text-ink/70 disabled:opacity-60"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
