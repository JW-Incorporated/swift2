/**
 * Isomorphic sha256 hex digest for `load.ts`'s integrity check. Uses the
 * WebCrypto `SubtleCrypto` API (`crypto.subtle.digest`), available on
 * `globalThis.crypto` in browsers, Node 18+, and Expo/React Native (via
 * `expo-standard-web-crypto` or Hermes's built-in `crypto.subtle` on recent
 * SDKs) — so the loader needs no platform-specific hashing dependency.
 */
export async function createHash(text: string): Promise<string> {
  const subtle = (globalThis.crypto as Crypto | undefined)?.subtle;
  if (!subtle) {
    throw new Error(
      'No crypto.subtle available in this runtime — packages/content requires WebCrypto ' +
        '(Node 18+, any browser, or an Expo/RN crypto.subtle polyfill) to verify bundle integrity.',
    );
  }
  const bytes = new TextEncoder().encode(text);
  const digest = await subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
