// The always-available issue reporter, fixed bottom-right (D2): the website shows it on every surface, so the app
// chrome registers the same package component. It reads `useHost()` (apiFetch over the bridge, currentUrl), both
// supplied by the app adapter.
import { FeedbackButton } from '@swift2/ui/reader/legal/FeedbackButton';
import { register } from './instance';

register({ slice: 'floating', slots: { floating: FeedbackButton } });
