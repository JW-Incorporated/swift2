'use client';

// Tidewatch D5 / P2-05: opt-in "Baby Watch: official announcements only" row. Rendered by
// WebNotificationSettings only when babyWatchUiEnabled(); opt-in stores cadence 'instant', opt-out 'off'.
import { BABY_WATCH_OPT_IN_CADENCE, BABY_WATCH_SETTINGS_DEF, type NotificationCadence } from '@swift2/shared';

export function BabyWatchToggle({
  cadence,
  pending,
  onChange,
}: {
  cadence: NotificationCadence | undefined;
  pending: boolean;
  onChange: (next: NotificationCadence) => void;
}) {
  const on = cadence === BABY_WATCH_OPT_IN_CADENCE;
  const def = BABY_WATCH_SETTINGS_DEF;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
      <div>
        <p id={`notif-cat-${def.id}`} className="text-sm font-medium text-ink">{def.name}</p>
        <p className="text-xs text-ink-soft">{def.description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-labelledby={`notif-cat-${def.id}`}
        aria-checked={on}
        disabled={pending}
        onClick={() => onChange(on ? 'off' : BABY_WATCH_OPT_IN_CADENCE)}
        className={`relative h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-[max(100%,44px)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] ${
          on ? 'bg-accent' : 'bg-white/20'
        }`}
      >
        <span className={`block h-6 w-6 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
