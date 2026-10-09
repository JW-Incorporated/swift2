import type { Metadata } from 'next';
import { DeskPage } from '@swift2/ui/reader/legal/DeskPage';
import { SiteFooter } from '@/components/longlive/SiteFooter';

export const metadata: Metadata = {
  title: 'Meet the desk — Long Live',
  description: 'The four editorial characters who write Long Live: Theo, Loren, Vera and Deb.',
  alternates: { canonical: '/desk' },
};

export default function Page() {
  return <DeskPage footer={<SiteFooter />} />;
}
