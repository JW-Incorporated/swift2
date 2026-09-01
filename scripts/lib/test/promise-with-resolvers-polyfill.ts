// Vitest setup file: polyfills `Promise.withResolvers` (Node 24+) so the full
// suite can run on Node 20, which is what most local dev sandboxes still
// have installed even though the project's `engines.node` and CI both target
// 24.x (see issue #3513). Test-only shim — no production code depends on it,
// and it's a no-op wherever the runtime already provides the real thing.
if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
