// WP2.8-D search slice (AT RISK: built ahead of H4/D2 and the iOS-1 gate).
// The search index comes from useReader inside SearchOverlay; no data path here.
// Slot name follows the D2 convention: "overlay:<name>".
import { SearchOverlay } from '@swift2/ui/reader/search/SearchOverlay';
import { register } from './instance';

export const SEARCH_SLICE = 'search';
export const SEARCH_OVERLAY_SLOT = 'overlay:search';

register({ slice: SEARCH_SLICE, slots: { [SEARCH_OVERLAY_SLOT]: SearchOverlay } });
