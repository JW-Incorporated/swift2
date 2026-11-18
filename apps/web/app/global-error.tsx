'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/ErrorFallback';

/** Replaces the root layout when the layout itself throws, so it owns `<html>` and `<body>`. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0c0c0c' }}>
        <title>Something went wrong — Long Live</title>
        <ErrorFallback onRetry={reset} />
      </body>
    </html>
  );
}
