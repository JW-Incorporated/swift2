import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display, Special_Elite, Dancing_Script } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});
const typewriter = Special_Elite({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-typewriter',
  display: 'swap',
});
const script = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-script',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Long Live — a time machine through Taylor Swift’s eras',
  description:
    'An interactive, unofficial fan journey through every era of Taylor Swift’s career — the music, fashion, tours, lore, and Easter eggs.',
  openGraph: {
    title: 'Long Live',
    description: 'Step into any era of Taylor Swift’s career and discover the lore.',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicons/heart-hands-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicons/heart-hands-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicons/heart-hands-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicons/heart-hands-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicons/heart-hands-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicons/heart-hands.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/favicons/heart-hands-180x180.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/favicons/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0c0c0c',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${typewriter.variable} ${script.variable} bg-bg`}
    >
      <body>{children}</body>
    </html>
  );
}
