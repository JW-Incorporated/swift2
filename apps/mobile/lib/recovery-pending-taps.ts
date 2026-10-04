// Notification taps that arrive while the Recovery screen is shown are never consumed by a native
// router. They stay held in the in-memory tap gate, are noted here, and are persisted when Retry
// is tapped so the reloaded process re-enqueues them; the gate then keeps them until the DOM host acks.
import * as SecureStore from 'expo-secure-store';
import type { RawTap } from './notification-tap-queue';

export const HELD_TAPS_KEY = 'longlive_recovery_taps_v1';
const MAX_HELD = 5;
const MAX_LINK = 150;

export interface HeldStorage {
  get(): Promise<string | null>;
  set(raw: string): Promise<void>;
  del(): Promise<void>;
}

const secureStorage: HeldStorage = {
  get: () => SecureStore.getItemAsync(HELD_TAPS_KEY),
  set: (raw) => SecureStore.setItemAsync(HELD_TAPS_KEY, raw),
  del: () => SecureStore.deleteItemAsync(HELD_TAPS_KEY),
};

export function createHeldTaps(storage: HeldStorage = secureStorage) {
  let held: { id: string; deepLink: string | null }[] = [];
  return {
    /** Remember an undelivered tap (id required: it is the dedupe key). */
    note(raw: RawTap): void {
      if (typeof raw.id !== 'string' || raw.id.length === 0 || held.some((t) => t.id === raw.id)) return;
      const deepLink = typeof raw.deepLink === 'string' ? raw.deepLink.slice(0, MAX_LINK) : null;
      held = [...held, { id: raw.id.slice(0, 256), deepLink }].slice(-MAX_HELD);
    },
    /** The DOM host consumed everything: forget. */
    clear(): void {
      held = [];
    },
    size: () => held.length,
    /** Called by Retry before the reload. Never throws. */
    async persist(): Promise<void> {
      try {
        if (held.length > 0) await storage.set(JSON.stringify(held));
      } catch {
        // taps stay in memory only
      }
    },
    /** Called once on launch: returns persisted taps, deletes the key, and notes them again. */
    async restore(): Promise<RawTap[]> {
      try {
        const raw = await storage.get();
        if (raw === null) return [];
        await storage.del().catch(() => {});
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const taps = parsed
          .filter((t): t is { id: string; deepLink: string | null } => !!t && typeof t.id === 'string' && (t.deepLink === null || typeof t.deepLink === 'string'))
          .slice(0, MAX_HELD);
        taps.forEach((t) => this.note(t));
        return taps;
      } catch {
        return [];
      }
    },
  };
}

export const heldTaps = createHeldTaps();
