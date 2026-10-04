'use client';

// Notifications Phase 6 (NOTIFICATIONS_SPEC.md §5/§8, NOTIFICATIONS_PLAN.md
// Phase 6) — the web equivalent of apps/mobile's
// NotificationSettingsScreen.tsx, now that Phase 6 gives web a real device
// identity (a subscribed PushSubscription registered as `platform: 'web'`
// through the SAME `/api/devices/:id/prefs` route the mobile apps already
// use — same shared @swift2/shared types, same instant-apply contract,
// same "changes apply instantly, no save button" spec §8 requirement).
//
// Before subscribing, this renders the "enable notifications" call to
// action only — there is no device_id-backed settings state to show yet
// (spec §7 applied to web: never surface controls for a permission that
// hasn't been granted). After subscribing, the full settings UI appears,
// reusing the exact same DevicePrefsResponse shape and PUT semantics.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  NOTIFICATION_GROUPS,
  SETTINGS_CATEGORY_DEFS,
  cadenceVariantFor,
  STEADY_CADENCES,
  FUN_CADENCES,
  EVENT_CADENCES,
  type AnyNotificationCategory,
  type DevicePrefsResponse,
  type NotificationCadence,
  type NotificationGroup,
} from '@swift2/shared';
import { useHost } from '../../host/context';
import { selectDriver } from './lib/driver';

const CADENCE_LABEL: Record<NotificationCadence, string> = {
  instant: 'Instant',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  on: 'On',
  off: 'Off',
};

function groupedCategories(): Record<NotificationGroup, (typeof SETTINGS_CATEGORY_DEFS)[number][]> {
  const groups: Record<NotificationGroup, (typeof SETTINGS_CATEGORY_DEFS)[number][]> = {
    News: [],
    Merch: [],
    Community: [],
    Fun: [],
  };
  for (const def of SETTINGS_CATEGORY_DEFS) groups[def.group].push(def);
  return groups;
}

function cadenceOptions(category: AnyNotificationCategory): readonly NotificationCadence[] {
  const variant = cadenceVariantFor(category);
  return variant === 'steady' ? STEADY_CADENCES : variant === 'fun' ? FUN_CADENCES : EVENT_CADENCES;
}

type SubscribeState =
  | { kind: 'checking' }
  | { kind: 'unsupported' }
  | { kind: 'not_subscribed' }
  | { kind: 'subscribing' }
  | { kind: 'subscribed' }
  | { kind: 'denied' }
  | { kind: 'error'; message: string };

export function WebNotificationSettings({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  // No driver (neither webPush nor notifications on the host) means unsupported; every driver! below sits behind that gate.
  const host = useHost();
  const driver = useMemo(() => selectDriver(host, vapidPublicKey), [host, vapidPublicKey]);
  const [subscribeState, setSubscribeState] = useState<SubscribeState>({ kind: 'checking' });
  const [prefsState, setPrefsState] = useState<DevicePrefsResponse | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!driver) {
      setSubscribeState({ kind: 'unsupported' });
      return;
    }
    // An active permission grant is a strong signal this device already subscribed
    // in a prior visit — re-read it on every mount rather than assuming, since
    // permission can be revoked outside the app.
    let live = true;
    void driver.permission().then((p) => {
      if (!live) return;
      setSubscribeState(
        p === 'granted' ? { kind: 'subscribed' } : p === 'denied' ? { kind: 'denied' } : p === 'unsupported' ? { kind: 'unsupported' } : { kind: 'not_subscribed' },
      );
    });
    return () => {
      live = false;
    };
  }, [driver]);

  const loadPrefs = useCallback(async () => {
    try {
      setPrefsState((await driver!.loadPrefs()) as DevicePrefsResponse);
      setPrefsError(null);
    } catch (e) {
      setPrefsError(e instanceof Error ? e.message : String(e));
    }
  }, [driver]);

  useEffect(() => {
    if (subscribeState.kind === 'subscribed') void loadPrefs();
  }, [subscribeState, loadPrefs]);

  const savePrefs = useCallback(
    async (key: string, body: { settings?: object; prefs?: object[] }) => {
      setPendingKeys((prev) => new Set(prev).add(key));
      try {
        setPrefsState((await driver!.savePrefs(body)) as DevicePrefsResponse);
        setPrefsError(null);
      } catch (e) {
        setPrefsError(e instanceof Error ? e.message : String(e));
      } finally {
        setPendingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [driver],
  );

  async function handleSubscribe() {
    setSubscribeState({ kind: 'subscribing' });
    const result = await driver!.subscribe();
    if (result.status === 'subscribed') {
      setSubscribeState({ kind: 'subscribed' });
    } else if (result.status === 'permission_denied') {
      setSubscribeState({ kind: 'denied' });
    } else if (result.status === 'unsupported') {
      setSubscribeState({ kind: 'unsupported' });
    } else if (result.status === 'vapid_not_configured') {
      setSubscribeState({
        kind: 'error',
        message: 'Web push isn\u2019t configured on this deployment yet.',
      });
    } else {
      setSubscribeState({ kind: 'error', message: result.error });
    }
  }

  async function handleUnsubscribe() {
    const outcome = await driver!.unsubscribe();
    if (outcome.ok) {
      setSubscribeState({ kind: 'not_subscribed' });
      setPrefsState(null);
    }
  }

  const groups = useMemo(groupedCategories, []);

  if (subscribeState.kind === 'checking') {
    return <p className="text-ink-soft">Checking notification support…</p>;
  }

  if (subscribeState.kind === 'unsupported') {
    return (
      <p className="text-ink-soft">
        This browser doesn&rsquo;t support web notifications. Get the Long Live app instead, or try
        a different browser.
      </p>
    );
  }

  if (subscribeState.kind !== 'subscribed') {
    return (
      <div className="flex flex-col items-center gap-4">
        {subscribeState.kind === 'denied' && (
          <p className="max-w-md text-center text-sm text-ink-soft">
            {driver?.deniedHint ??
              'Notifications are blocked for this site in your browser settings. Allow them there, then reload this page.'}
          </p>
        )}
        {subscribeState.kind === 'error' && (
          <p className="max-w-md text-center text-sm text-ink-soft">{subscribeState.message}</p>
        )}
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={subscribeState.kind === 'subscribing' || subscribeState.kind === 'denied'}
          className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-[color:var(--era-accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {subscribeState.kind === 'subscribing' ? 'Enabling\u2026' : 'Enable notifications'}
        </button>
      </div>
    );
  }

  if (!prefsState) {
    return <p className="text-ink-soft">{prefsError ?? 'Loading your settings\u2026'}</p>;
  }

  const { settings, prefs } = prefsState;
  const prefByCategory = new Map(prefs.map((p) => [p.category, p.cadence]));

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-12 text-left">
      {prefsError && <p className="text-sm text-red-400">{prefsError}</p>}

      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="font-medium text-ink">Notifications</p>
          <p className="text-sm text-ink-soft">Turn all Long Live notifications on or off.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.masterEnabled}
          disabled={pendingKeys.has('settings:masterEnabled')}
          onClick={() =>
            savePrefs('settings:masterEnabled', {
              settings: { masterEnabled: !settings.masterEnabled },
            })
          }
          className={`h-7 w-12 rounded-full p-0.5 transition-colors ${
            settings.masterEnabled ? 'bg-accent' : 'bg-white/20'
          }`}
        >
          <span
            className={`block h-6 w-6 rounded-full bg-white transition-transform ${
              settings.masterEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {NOTIFICATION_GROUPS.map((group) => (
        <div key={group} className="flex flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">{group}</p>
          {groups[group].map((def) => {
            const cadence = prefByCategory.get(def.id) ?? 'off';
            const options = cadenceOptions(def.id);
            const pendingKey = `cadence:${def.id}`;
            return (
              <div key={def.id} className="flex flex-col gap-1.5 border-b border-white/5 pb-4">
                <p className="text-sm font-medium text-ink">{def.name}</p>
                <p className="text-xs text-ink-soft">{def.description}</p>
                <div className="flex flex-wrap gap-1.5" role="radiogroup">
                  {options.map((option) => {
                    const active = option === cadence;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={pendingKeys.has(pendingKey)}
                        onClick={() =>
                          !active &&
                          savePrefs(pendingKey, {
                            prefs: [{ category: def.id, cadence: option }],
                          })
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                          active
                            ? 'border-accent bg-accent text-[color:var(--era-accent-fg)]'
                            : 'border-white/20 text-ink-soft hover:border-white/40'
                        }`}
                      >
                        {CADENCE_LABEL[option]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <button
        type="button"
        onClick={handleUnsubscribe}
        className="self-start text-xs text-ink-soft underline hover:text-ink"
      >
        Turn off web notifications for this browser
      </button>
    </div>
  );
}
