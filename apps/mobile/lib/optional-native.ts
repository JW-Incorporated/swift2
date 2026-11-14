// Native modules that exist only in store builds made after they were added to package.json. A static import of such a
// module throws at load on an older installed binary, so these load lazily and answer null when the binary lacks it
// (the JS can then ship over OTA ahead of the store build). Literal require() strings: Metro resolves them at bundle time.
type Sharing = { shareAsync(url: string, options?: { mimeType?: string; dialogTitle?: string }): Promise<void> };
type Crypto = { getRandomBytes(byteCount: number): Uint8Array };

export function optionalSharing(): Sharing | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy: a static import throws on older binaries
    const m = require('expo-sharing') as Sharing;
    return typeof m.shareAsync === 'function' ? m : null;
  } catch {
    return null;
  }
}

export function optionalCrypto(): Crypto | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy: a static import throws on older binaries
    const m = require('expo-crypto') as Crypto;
    return typeof m.getRandomBytes === 'function' ? m : null;
  } catch {
    return null;
  }
}
