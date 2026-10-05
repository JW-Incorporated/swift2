// Real expo-file-system / expo-clipboard ports for "Share as image" (see ui-deps ShareCardPorts).
import * as Clipboard from 'expo-clipboard';
import { Directory, File, Paths } from 'expo-file-system';
import type { ShareCardPorts } from './ui-deps';

export const shareCardPorts: ShareCardPorts = {
  async download(url, name) {
    const dir = new Directory(Paths.cache, 'share');
    dir.create({ idempotent: true, intermediates: true });
    const file = await File.downloadFileAsync(url, new File(dir, `${name}.png`), { idempotent: true });
    return { uri: file.uri, base64: () => file.base64() };
  },
  copyImage: (base64) => Clipboard.setImageAsync(base64),
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
