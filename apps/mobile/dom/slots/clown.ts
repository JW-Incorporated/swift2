// WP 2.11-D2 (AT RISK: built ahead of H4/D2 + the iOS-1 gate). Clownbot and
// Mood surfaces, imported directly from @swift2/ui (G10). Slot names follow the
// D2 convention `surface:<mode>`. ClownChat is mounted with no `lore` (optional,
// defaults to []; the app has no baked lore source yet). apiStream is left
// absent on the app adapter, so ClownChat falls back to bufferedFrom(apiFetch).
import { ClownChat } from '@swift2/ui/reader/clown/ClownChat';
import { MoodChat } from '@swift2/ui/reader/clown/MoodChat';
import { register } from './instance';

export const CLOWN_SLICE = 'clown';

register({
  slice: CLOWN_SLICE,
  slots: {
    'surface:clownbot': ClownChat,
    'surface:mood': MoodChat,
  },
});
