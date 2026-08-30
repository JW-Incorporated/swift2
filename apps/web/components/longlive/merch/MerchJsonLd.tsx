import { MERCH_CATALOGUE, merchProductJsonLd } from '@/lib/longlive/merch';

export function MerchJsonLd() {
  const items = [
    ...MERCH_CATALOGUE.officialStore,
    ...MERCH_CATALOGUE.fanMade,
    ...MERCH_CATALOGUE.shopTheLook,
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(items.map((item) => merchProductJsonLd(item))).replace(
          /</g,
          '\\u003c',
        ),
      }}
    />
  );
}
