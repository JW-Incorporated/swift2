import * as FileSystem from 'expo-file-system';
import { createHostStorage, type HostStorage } from './host-storage';

const DIR = new FileSystem.Directory(FileSystem.Paths.document, 'swift2-host-storage');

/**
 * `local.json` is the blob, `local.json.bak` the last good one. A write goes to `local.json.tmp` first, then the old
 * main is moved to `.bak` and the tmp becomes main, so a crash at any point leaves a readable main or a readable .bak.
 */
export function createFileHostStorage(): HostStorage {
  const at = (name: string) => new FileSystem.File(DIR, name);
  const readText = (name: string) => {
    const f = at(name);
    return f.exists ? f.textSync() : null;
  };
  return createHostStorage({
    read: () => readText('local.json'),
    readBackup: () => readText('local.json.bak'),
    write: (text) => {
      if (!DIR.exists) DIR.create({ intermediates: true });
      const tmp = at('local.json.tmp');
      tmp.write(text);
      const main = at('local.json');
      if (main.exists) main.moveSync(at('local.json.bak'), { overwrite: true });
      tmp.moveSync(at('local.json'), { overwrite: true });
    },
  });
}
