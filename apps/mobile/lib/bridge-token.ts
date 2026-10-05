/** Per-install random seed (persisted by lib/bridge-seed.ts); mixed into the fallback only. */
let installSeed = '';
export function setBridgeSeed(seed: string) {
  installSeed = seed;
}

type Cryptoish = { getRandomValues?: (a: Uint8Array) => Uint8Array };
let counter = 0;

/** 128 bits from a cyrb128-style mix of every weak source we have (used only when no CSPRNG exists). */
function mixedBytes(): Uint8Array {
  const perf = (globalThis as { performance?: { now?: () => number } }).performance;
  const parts: string[] = [installSeed, String(Date.now()), String(perf?.now?.() ?? ''), String(++counter)];
  for (let i = 0; i < 8; i++) parts.push(String(Math.random()));
  const s = parts.join('|');
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < s.length; i++) {
    const k = s.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  const out = new Uint8Array(16);
  [h1 ^ h2 ^ h3, h2 ^ h1, h3 ^ h1, h4 ^ h1].forEach((w, i) => {
    for (let b = 0; b < 4; b++) out[i * 4 + b] = (w >>> (b * 8)) & 255;
  });
  return out;
}

/**
 * 32 hex chars, fresh per epoch. Never put it in DOM props: injectedJavaScriptObject is readable from any iframe on Android.
 * Uses crypto.getRandomValues when the runtime has it. The shipped binary has no CSPRNG module, so on device this
 * may be the mixed fallback (generated in the RN JS runtime, which a WebView iframe cannot observe); expo-crypto is the durable fix.
 */
export function newBridgeToken(): string {
  const c = (globalThis as { crypto?: Cryptoish }).crypto;
  let bytes: Uint8Array;
  if (c?.getRandomValues) {
    bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
  } else bytes = mixedBytes();
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
