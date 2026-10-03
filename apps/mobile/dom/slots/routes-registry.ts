// Native-safe: imports types only. Never import a slot component from here.
import type { NativeRouteEntry, RouteModule, RouteRegistry } from './types';

type Stored = Readonly<NativeRouteEntry>;

const matcherKey = (m: string | RegExp) => (typeof m === 'string' ? `s:${m}` : `r:${m.flags}/${m.source}`);

function freezeEntry(e: NativeRouteEntry): Stored {
  if (typeof e.match !== 'string' && (e.match.global || e.match.sticky)) {
    throw new Error(`route registry: route "${e.id}" uses a g/y regex (stateful)`);
  }
  const match = typeof e.match === 'string' ? e.match : Object.freeze(new RegExp(e.match.source, e.match.flags));
  return Object.freeze({ id: e.id, match });
}

const sameEntries = (a: readonly Stored[], b: readonly Stored[]) =>
  a.length === b.length && a.every((x, i) => x.id === b[i]?.id && matcherKey(x.match) === matcherKey((b[i] as Stored).match));

export function createRouteRegistry(): RouteRegistry {
  const bySlice = new Map<string, readonly Stored[]>();
  const routes: Stored[] = [];
  const idOwner = new Map<string, string>();
  const matcherOwner = new Map<string, string>();

  return {
    registerRoutes(mod: RouteModule) {
      const incoming = mod.nativeRoutes.map(freezeEntry);
      const prior = bySlice.get(mod.slice);
      if (prior) {
        if (sameEntries(prior, incoming)) return;
        throw new Error(`route registry: slice "${mod.slice}" re-registered with different routes`);
      }
      const ids = new Set<string>();
      const matchers = new Map<string, string>();
      for (const r of incoming) {
        if (ids.has(r.id) || idOwner.has(r.id)) throw new Error(`route registry: duplicate native route "${r.id}" (slice "${mod.slice}")`);
        ids.add(r.id);
        const k = matcherKey(r.match);
        const other = matchers.get(k) ?? matcherOwner.get(k);
        if (other !== undefined) {
          throw new Error(`route registry: route "${r.id}" repeats the matcher of "${other}" (slice "${mod.slice}")`);
        }
        matchers.set(k, r.id);
      }
      bySlice.set(mod.slice, Object.freeze(incoming));
      for (const r of incoming) {
        routes.push(r);
        idOwner.set(r.id, mod.slice);
        matcherOwner.set(matcherKey(r.match), r.id);
      }
    },
    nativeRoutes: () => Object.freeze([...routes]),
    isNativeRoute: (path) => routes.some((r) => (typeof r.match === 'string' ? r.match === path : r.match.test(path))),
  };
}
