// The share Copy-link fallback toast (the website mounts the same component): a plain Share that fails, or finds
// no native share sheet, ends here instead of a dead tap. Slot name follows the D2 convention: "overlay:<name>".
import { ShareFallbackToast } from '@swift2/ui/reader/shell/ShareFallbackToast';
import { register } from './instance';

export const SHARE_FALLBACK_SLICE = 'share-fallback';
export const SHARE_FALLBACK_OVERLAY_SLOT = 'overlay:share-fallback';

register({ slice: SHARE_FALLBACK_SLICE, slots: { [SHARE_FALLBACK_OVERLAY_SLOT]: ShareFallbackToast } });
