'use client';

import { MerchSection as PackageMerchSection } from '@swift2/ui/reader/merch/MerchSection';
import { MERCH_EXTENSIONS } from '@/lib/longlive/merch-extensions';

export { MerchSectionBody } from '@swift2/ui/reader/merch/MerchSection';

/** The lazy chunk's entry: the baked merch data stays app-side and is injected here. */
export function MerchSection() {
  return <PackageMerchSection extensions={MERCH_EXTENSIONS} />;
}
