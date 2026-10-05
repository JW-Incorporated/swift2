import * as FileSystem from 'expo-file-system';
import { createHostStorage, type HostStorage } from './host-storage';

const DIR = new FileSystem.Directory(FileSystem.Paths.document, 'swift2-host-storage');

/**
 * `local.json` is the blob, `local.json.bak` the last good one. A write goes to `local.json.tmp` first, then the old
 * main is moved to `.bak` (only when main is known-good, so a corrupt main never clobbers the last good copy) and the
 * tmp becomes main. Load order: main, tmp, bak; each must parse.
 */
export function createFileHostStorage(): HostStorage {
  const at = (name: string) => new FileSystem.File(DIR, name);
  const readText = (name: string) => {
    const f = at(name);
    return f.exists ? f.textSync() : null;
  };
  return createHostStorage({
    read: () => readText('local.json'),
    readTmp: () => readText('local.json.tmp'),
    readBackup: () => readText('local.json.bak'),
    write: (text, mainTrusted) => {
      if (!DIR.exists) DIR.create({ intermediates: true });
      const tmp = at('local.json.tmp');
      tmp.write(text);
      const main = at('local.json');
      if (mainTrusted && main.exists) main.moveSync(at('local.json.bak'), { overwrite: true });
      tmp.moveSync(at('local.json'), { overwrite: true });
    },
  });
}
