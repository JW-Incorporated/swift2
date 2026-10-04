// WP 2.11-D2 (AT RISK: stacked on H4/D2). Clownbot and Mood surfaces, imported
// directly from @swift2/ui (G10). Slot names follow the D2 convention
// `surface:<mode>`. ClownChatSection needs the extensions object as a prop,
// which AppReader only holds inside its ReaderExtensionsProvider, so the
// clownbot slot is the same composition (ClownChat fed by useLore()) reading
// the provider AppReader already mounts: the board gets the website's lore.
// apiStream is absent on the app adapter, so ClownChat uses bufferedFrom(apiFetch).
import { useLore } from '@swift2/ui';
import { ClownChat } from '@swift2/ui/reader/clown/ClownChat';
import { MoodChat } from '@swift2/ui/reader/clown/MoodChat';
import { register } from './instance';

export const CLOWN_SLICE = 'clown';

export function ClownSurface() {
  return <ClownChat lore={useLore()} />;
}

register({
  slice: CLOWN_SLICE,
  slots: {
    'surface:clownbot': ClownSurface,
    'surface:mood': MoodChat,
  },
});
