'use client';

import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { HostProvider } from '@swift2/ui';
import { createWebAdapter } from './host-adapter';

export function WebHostProvider({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const adapter = useMemo(() => createWebAdapter(router), [router]);
  return <HostProvider adapter={adapter}>{children}</HostProvider>;
}
