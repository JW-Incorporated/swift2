import type { NativeRouteEntry, SliceModule, SlotRegistry } from './types';

export function createSlotRegistry<C = unknown>(): SlotRegistry<C> {
  const slices = new Set<string>();
  const slots: Record<string, C> = {};
  const routes: NativeRouteEntry[] = [];
  const routeIds = new Set<string>();

  return {
    register(mod) {
      if (slices.has(mod.slice)) throw new Error(`slot registry: duplicate slice "${mod.slice}"`);
      for (const name of Object.keys(mod.slots)) {
        if (name in slots) throw new Error(`slot registry: duplicate slot "${name}" (slice "${mod.slice}")`);
      }
      for (const r of mod.nativeRoutes ?? []) {
        if (routeIds.has(r.id)) throw new Error(`slot registry: duplicate native route "${r.id}" (slice "${mod.slice}")`);
      }
      slices.add(mod.slice);
      Object.assign(slots, mod.slots);
      for (const r of mod.nativeRoutes ?? []) {
        routeIds.add(r.id);
        routes.push(r);
      }
    },
    slots: () => ({ ...slots }),
    nativeRoutes: () => [...routes],
    isNativeRoute: (path) => routes.some((r) => (typeof r.match === 'string' ? r.match === path : r.match.test(path))),
  };
}

export type { SliceModule };
