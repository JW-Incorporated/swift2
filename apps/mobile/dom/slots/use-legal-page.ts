import { useSyncExternalStore } from 'react';
import { useHost } from '@swift2/ui';
import { subscribeDomPath } from '../bridge/dom-path';
import { legalPageForPath, type LegalPage } from './legal-route';

/** The legal page the DOM is showing (keyed on the host's current URL), or null while the reader shows. */
export function useLegalPage(): LegalPage | null {
  const { currentUrl } = useHost();
  return useSyncExternalStore(
    subscribeDomPath,
    () => legalPageForPath(currentUrl?.()),
    () => null,
  );
}
