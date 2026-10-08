// Native-safe: imports types only. Never import a slot component from here.
import type { NativeRouteEntry, RouteModule, RouteRegistry } from './types';

type StoredMatch = string | { readonly source: string; readonly flags: string };
type Stored = Readonly<{ id: string; match: StoredMatch }>;

const matcherKey = (m: StoredMatch) => (typeof m === 'string' ? `s:${m}` : `r:${m.flags}/${m.source}`);

function toStored(e: NativeRouteEntry): Stored {
  if (typeof e.match === 'string') return Object.freeze({ id: e.id, match: e.match });
  if (e.match.global || e.match.sticky) {
    throw new Error(`route registry: route "${e.id}" uses a g/y regex (stateful)`);
  }
  return Object.freeze({ id: e.id, match: Object.freeze({ source: e.match.source, flags: e.match.flags }) });
}

const sameEntries = (a: readonly Stored[], b: readonly Stored[]) =>
  a.length === b.length && a.every((x, i) => x.id === b[i]?.id && matcherKey(x.match) === matcherKey((b[i] as Stored).match));

export function createRouteRegistry(): RouteRegistry {
  const bySlice = new Map<string, readonly Stored[]>();
  const routes: Stored[] = [];
  // Private compiled matchers, built once at registration and never returned.
  const testers: ((path: string) => boolean)[] = [];
  const idOwner = new Map<string, string>();
  const matcherOwner = new Map<string, string>();

  return {
    registerRoutes(mod: RouteModule) {
      const incoming = mod.nativeRoutes.map(toStored);
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
        const m = r.match;
        if (typeof m === 'string') testers.push((p) => p === m);
        else {
          const re = new RegExp(m.source, m.flags);
          testers.push((p) => re.test(p));
        }
        idOwner.set(r.id, mod.slice);
        matcherOwner.set(matcherKey(r.match), r.id);
      }
    },
    /** Diagnostic only: each regex `match` is freshly minted per call, so identity comparison on `match` is unsupported. */
    nativeRoutes: () =>
      Object.freeze(
        routes.map((r) =>
          Object.freeze({ id: r.id, match: typeof r.match === 'string' ? r.match : new RegExp(r.match.source, r.match.flags) }),
        ),
      ),
    isNativeRoute: (path) => testers.some((t) => t(path)),
  };
}
