'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/ErrorFallback';

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorFallback onRetry={reset} />;
}
