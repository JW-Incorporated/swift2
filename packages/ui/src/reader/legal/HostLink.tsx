'use client';

import type { ComponentProps } from 'react';
import { useHost } from '../../host/context';

export function HostLink(props: ComponentProps<'a'> & { href: string }) {
  const { Link } = useHost();
  return <Link {...props} />;
}
