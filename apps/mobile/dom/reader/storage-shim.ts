// WP0.5b: the Android DOM webview has DOM storage disabled, so web code that
// touches localStorage would throw. Install a Map-backed stand-in BEFORE any
// reader module is imported (UI state lives in memory; persistence = WP0.6).
interface ShimTarget {
  localStorage?: unknown;
  sessionStorage?: unknown;
}

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
  };
}

function usable(win: ShimTarget, name: 'localStorage' | 'sessionStorage'): boolean {
  try {
    (win[name] as { getItem(k: string): unknown }).getItem('__wp05');
    return true;
  } catch {
    return false;
  }
}

/** Returns the names of the stores that had to be shimmed. */
export function installStorageShim(win: ShimTarget): string[] {
  const shimmed: string[] = [];
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    if (usable(win, name)) continue;
    Object.defineProperty(win, name, { value: memoryStorage(), configurable: true });
    shimmed.push(name);
  }
  return shimmed;
}
