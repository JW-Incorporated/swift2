import { TrackGuide } from '@swift2/ui/reader/tracks/TrackGuide';
import { TrackDetail } from '@swift2/ui/reader/tracks/TrackDetail';
import { register } from './instance';

// WP2.7-D: the track guide and song detail are overlays. AppReader (D2) appends
// every `overlay:<name>` slot to ReaderSlots.overlays in registration order, so
// the song (registered after the guide) stacks over it, as on web.
export const TRACKS_SLICE = 'tracks';
export const TRACKS_SLOTS = {
  'overlay:track-guide': TrackGuide,
  'overlay:song': TrackDetail,
} as const;

register({ slice: TRACKS_SLICE, slots: TRACKS_SLOTS });
