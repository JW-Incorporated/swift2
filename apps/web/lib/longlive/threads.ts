import { CONTENT } from './content';
import { setThreadContentProvider } from '@swift2/experience';

export { contentForThread, contentForThreadInRange, contentForThreadInEra } from '@swift2/experience';

// Wires the app's real content corpus into `packages/experience`'s
// `threads.ts` (OS-023 — see `thread-content-provider.ts`'s doc comment):
// the headless package can't load content itself (content loading is
// OS-013/OS-014 scope), so the app injects the full `CONTENT` array in, at
// import time, rather than the headless module importing this app-layer
// module directly.
setThreadContentProvider(() => CONTENT);
