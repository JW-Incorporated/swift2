'use client';

import type { ComponentProps, MouseEvent } from 'react';
import { isMailtoUrl } from '../../bridge/validate';
import { useHost } from '../../host/context';

/**
 * A `mailto:` anchor. Hosts that provide `openExternal` (the app) take the
 * click; hosts without it (web) get the plain anchor navigation.
 */
export function MailtoLink({ href, onClick, ...props }: ComponentProps<'a'> & { href: string }) {
  const { openExternal } = useHost();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || !openExternal || !isMailtoUrl(href)) return;
    e.preventDefault();
    openExternal(href);
  };
  return <a {...props} href={href} onClick={handle} />;
}
