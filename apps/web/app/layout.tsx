import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Swift2 — the Vault',
  description: 'An unofficial time machine through Taylor Swift’s eras.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
