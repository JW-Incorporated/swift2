import type { Metadata } from 'next';
import { SupportPage } from '@swift2/ui/reader/legal/SupportPage';
import { SiteFooter } from '@/components/longlive/SiteFooter';

export const metadata: Metadata = {
  title: 'Support — Long Live',
  description: 'How to get help with the Long Live app and website.',
  alternates: { canonical: '/support' },
};

export default function Page() {
  return <SupportPage footer={<SiteFooter />} />;
}
