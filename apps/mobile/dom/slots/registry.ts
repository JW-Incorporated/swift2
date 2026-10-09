import type { SlotRegistry } from './types';

const has = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

export function createSlotRegistry<C = unknown>(): SlotRegistry<C> {
  const bySlice = new Map<string, Readonly<Record<string, C>>>();
  const slots: Record<string, C> = Object.create(null);

  return {
    register(mod) {
      const incoming: Record<string, C> = Object.create(null);
      for (const k of Object.keys(mod.slots)) incoming[k] = mod.slots[k] as C;
      const prior = bySlice.get(mod.slice);
      if (prior) {
        const same =
          Object.keys(prior).length === Object.keys(incoming).length &&
          Object.keys(incoming).every((k) => has(prior, k) && Object.is(prior[k], incoming[k]));
        if (same) return;
        throw new Error(`slot registry: slice "${mod.slice}" re-registered with different slots`);
      }
      for (const name of Object.keys(incoming)) {
        if (has(slots, name)) throw new Error(`slot registry: duplicate slot "${name}" (slice "${mod.slice}")`);
      }
      bySlice.set(mod.slice, Object.freeze(incoming));
      Object.assign(slots, incoming);
    },
    slots: () => ({ ...slots }),
  };
}
