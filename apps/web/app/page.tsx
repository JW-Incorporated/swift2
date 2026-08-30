import { LongLive } from '@/components/longlive/LongLive';
import { MerchJsonLd } from '@/components/longlive/merch/MerchJsonLd';

// The experience is fully client-driven over static mock data; no revalidation
// needed. A real API would hydrate the datasets in lib/longlive/*.
export default function Page() {
  return (
    <>
      <LongLive />
      <MerchJsonLd />
    </>
  );
}
