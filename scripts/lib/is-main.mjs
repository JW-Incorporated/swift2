// Entrypoint guard that also works on Windows. The naive
// `import.meta.url === \`file://${process.argv[1]}\`` never matches a `C:\...`
// path, so the script silently exits 0 without running.
import { pathToFileURL } from 'node:url';

export function isMain(importMetaUrl, argv1) {
  if (!argv1) return false;
  return importMetaUrl === pathToFileURL(argv1).href;
}
