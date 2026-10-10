// Real expo-file-system / expo-clipboard ports for "Share as image" (see ui-deps ShareCardPorts).
import * as Clipboard from 'expo-clipboard';
import { Directory, File, Paths } from 'expo-file-system';
import { optionalSharing } from './optional-native';
import { assertCardFile, MAX_CARD_BYTES } from './share-card-guard';
import type { ShareCardPorts } from './ui-deps';

export const shareCardPorts: ShareCardPorts = {
  async download(url, name, signal) {
    const dir = new Directory(Paths.cache, 'share');
    dir.create({ idempotent: true, intermediates: true });
    const dest = new File(dir, `${name}.png`);
    const abort = new AbortController();
    const onOuterAbort = () => abort.abort();
    signal?.addEventListener('abort', onOuterAbort);
    try {
      const file = await File.downloadFileAsync(url, dest, {
        idempotent: true,
        signal: abort.signal,
        onProgress: (p) => {
          if (p.bytesWritten > MAX_CARD_BYTES || p.totalBytes > MAX_CARD_BYTES) abort.abort();
        },
      });
      assertCardFile(file.size, file.bytesSync().subarray(0, 8));
      return { uri: file.uri, base64: () => file.base64() };
    } catch (e) {
      try {
        if (dest.exists) dest.delete();
      } catch {
        // best-effort cleanup
      }
      throw e;
    } finally {
      signal?.removeEventListener('abort', onOuterAbort);
    }
  },
  copyImage: (base64) => Clipboard.setImageAsync(base64),
  // Present only when the installed binary includes expo-sharing (#5055); absent = Android keeps the clipboard path.
  shareFile: optionalSharing() ? (uri) => optionalSharing()!.shareAsync(uri, { mimeType: 'image/png' }) : undefined,
  async prune(keep) {
    try {
      const dir = new Directory(Paths.cache, 'share');
      const files = dir.list().filter((e): e is File => e instanceof File).sort((a, b) => a.name.localeCompare(b.name));
      for (const f of files.slice(0, Math.max(0, files.length - keep))) f.delete();
    } catch {
      // best-effort cleanup
    }
  },
};
