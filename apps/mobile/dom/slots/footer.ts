// The site footer under every surface: the website's ReaderShell mounts the same package SiteFooter, so the app
// chrome registers it too (a short surface such as mood shows it inside the viewport).
import { SiteFooter } from '@swift2/ui/reader/legal/SiteFooter';
import { register } from './instance';

register({ slice: 'footer', slots: { footer: SiteFooter } });
