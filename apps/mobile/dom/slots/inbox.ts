// W6-inbox-dom: the notification inbox as a DOM overlay, imported directly from @swift2/ui (G10). Registered after
// `settings` so it stacks above the settings overlay it is opened from.
import { register } from './instance';
import { InboxOverlay } from './inbox-page';

export const INBOX_SLICE = 'inbox';

register({
  slice: INBOX_SLICE,
  slots: { 'overlay:inbox': InboxOverlay },
});
