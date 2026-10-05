// WP 2.11-D2 (AT RISK: stacked on H4/D2). Clownbot and Mood surfaces, imported
// directly from @swift2/ui (G10). Slot names follow the D2 convention
// `surface:<mode>`. ClownChatSection needs the extensions object as a prop,
// which AppReader only holds inside its ReaderExtensionsProvider, so the
// clownbot slot is the same composition (ClownChat fed by useLore()) reading
// the provider AppReader already mounts: the board gets the website's lore.
// apiStream is absent on the app adapter, so ClownChat uses bufferedFrom(apiFetch).
import { useLore } from '@swift2/ui';
import { register } from './instance';
import { lazySlot } from './lazy';
import { loadClownChat, loadMoodChat } from './lazy-loaders';

export const CLOWN_SLICE = 'clown';

const LazyClownChat = lazySlot(loadClownChat);

export function ClownSurface() {
  return <LazyClownChat lore={useLore()} />;
}

register({
  slice: CLOWN_SLICE,
  slots: {
    'surface:clownbot': ClownSurface,
    'surface:mood': lazySlot(loadMoodChat),
  },
});
