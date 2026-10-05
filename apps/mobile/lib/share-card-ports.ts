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
};
