import type { ReactNode } from 'react';

export const metadata = {
  title: 'Swift2',
  description: 'A Taylor Swift fan app — verified news + time travel.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
