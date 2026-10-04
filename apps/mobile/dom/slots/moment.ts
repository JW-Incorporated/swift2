// WP 2.5-D moment slice (DOM half). The moment detail dialog is the registered
// `overlay:moment` slot (convention in index.ts / D2's reader-slots mapper).
// Imported DIRECTLY from the package (G10): no spike resolver, no apps/web shim.
// Affiliate (G4): the app sets no `HostEnv.affiliate`, so shop links stay plain.
// Song/thread links inside a moment are handled by overlay-fallback (D2) until
// 2.6-D/2.7-D; this slice adds no row of its own.
import { MomentDetail } from '@swift2/ui/reader/moment/MomentDetail';
import { register } from './instance';

export const MOMENT_SLICE = 'moment';
export const MOMENT_OVERLAY_SLOT = 'overlay:moment';

register({ slice: MOMENT_SLICE, slots: { [MOMENT_OVERLAY_SLOT]: MomentDetail } });
