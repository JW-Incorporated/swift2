import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import {
  Inter,
  Playfair_Display,
  Special_Elite,
  Dancing_Script,
  Bodoni_Moda,
} from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { inAppPlatformFromUserAgent } from '@/lib/longlive/in-app';
import '@/lib/longlive/vault-wiring';
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
const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  style: ['normal', 'italic'],
  variable: '--font-bodoni',
  display: 'swap',
});

// metadataBase + alternates.canonical close part of the #653 SEO gap
// (Nils, 2026-07-15): with no canonical tag, Google had no signal for which
// URL is authoritative between www.longlivets.com and the redirecting bare
// domain (docs/deploy.md — www is the real production host).
export const metadata: Metadata = {
  metadataBase: new URL('https://www.longlivets.com'),
  title: 'Long Live — a time machine through Taylor Swift’s eras',
  description:
    'An interactive, unofficial fan journey through every era of Taylor Swift’s career — the music, fashion, tours, lore, and Easter eggs.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Long Live',
    description: 'Step into any era of Taylor Swift’s career and discover the lore.',
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Long Live',
    description: 'Step into any era of Taylor Swift’s career and discover the lore.',
  },
  // Google Search Console property verification (HTML-tag method, added
  // 2026-07-24 setting up the property for the first time — no property
  // existed before this). Chosen over the DNS-record method since it ships
  // through the normal deploy path rather than needing registrar access.
  // Do not remove: Search Console re-checks this tag periodically and
  // un-verifies the property if it disappears.
  verification: {
    google: 'h3r6ptt1df72mDjumVEE1aCth8SI3NFDFBddJSctudk',
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

// Closes the JSON-LD half of #653 (Nils, 2026-07-15): no structured data
// existed for Google to build a rich result from. Conservative WebSite +
// Organization only — no SearchAction, since the site's own search overlay
// dead-ends per Nils's separate finding (#652); claiming a working
// sitelinks searchbox that doesn't work would make this worse, not better.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Long Live',
      url: 'https://www.longlivets.com/',
      description:
        'An interactive, unofficial fan journey through every era of Taylor Swift’s career — the music, fashion, tours, lore, and Easter eggs.',
    },
    {
      '@type': 'Organization',
      name: 'Long Live',
      url: 'https://www.longlivets.com/',
      logo: 'https://www.longlivets.com/favicons/heart-hands-512x512.png',
    },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const hdrs = await headers();
  const nonce = hdrs.get('x-nonce') ?? undefined;
  const inAppPlatform = inAppPlatformFromUserAgent(hdrs.get('user-agent'));

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${typewriter.variable} ${script.variable} ${bodoni.variable} bg-bg`}
      {...(inAppPlatform ? { 'data-app': inAppPlatform } : {})}
    >
      <body>
        <script
          nonce={nonce}
          type="application/ld+json"
          // Static, hardcoded object with no user input — safe without extra
          // escaping, but stripping `<` defensively costs nothing.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
