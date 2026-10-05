import * as FileSystem from 'expo-file-system';
import { createHostStorage, type HostStorage } from './host-storage';

const DIR = new FileSystem.Directory(FileSystem.Paths.document, 'swift2-host-storage');

export function createFileHostStorage(): HostStorage {
  const file = () => new FileSystem.File(DIR, 'local.json');
  return createHostStorage({
    read: () => {
      const f = file();
      return f.exists ? f.textSync() : null;
    },
    write: (text) => {
      if (!DIR.exists) DIR.create({ intermediates: true });
      file().write(text);
    },
  });
}
