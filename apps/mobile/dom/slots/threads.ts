// WP 2.6-D (AT RISK: built ahead of H4/D2 + the iOS-1 gate). Threads tab +
// theories overlay, imported directly from @swift2/ui (G10). Slot names follow
// the D2 convention: `surface:<mode>` and `overlay:<name>`.
import { ThreadsMode } from '@swift2/ui/reader/threads/ThreadsMode';
import { TheoryGuide } from '@swift2/ui/reader/threads/TheoryGuide';
import { register } from './instance';

export const THREADS_SLICE = 'threads';

register({
  slice: THREADS_SLICE,
  slots: {
    'surface:threads': ThreadsMode,
    'overlay:theory-guide': TheoryGuide,
  },
});
