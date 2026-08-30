import { LongLive } from '@/components/longlive/LongLive';
import { MerchJsonLd } from '@/components/longlive/merch/MerchJsonLd';

// Product JSON-LD offers are only eligible for seven days after verification.
// Render per request so a static page never continues advertising a stale offer.
export const revalidate = 0;

export default function Page() {
  return (
    <>
      <LongLive />
      <MerchJsonLd />
    </>
  );
}
