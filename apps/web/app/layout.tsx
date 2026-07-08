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
