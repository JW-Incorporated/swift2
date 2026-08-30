import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — helper is a plain .mjs script
import { buildE5CandidateReceipt, collectListingIds } from './e5-evidence-artifact.mjs';

describe('E5 evidence artifact', () => {
  const searchPayload = {
    results: [
      { listing_id: 42, title: 'Original lavender bracelet' },
      { listing_id: 42, title: 'Duplicate listing' },
      { listing_id: 99, title: 'No detail record' },
    ],
  };

  it('retains only deterministic unique Etsy listing identifiers from search artifacts', () => {
    expect(collectListingIds([searchPayload])).toEqual(['42', '99']);
  });

  it('retains raw E1 listing, image, and shop evidence for every receipt candidate', () => {
    expect(
      buildE5CandidateReceipt({
        searchPayloads: [searchPayload],
        listingDetailsById: new Map([
          [
            '42',
            {
              listing_id: 42,
              title: 'Original lavender bracelet',
              url: 'https://www.etsy.com/listing/42/original-lavender-bracelet',
              shop: { shop_id: 7, shop_name: 'LavenderMaker' },
              images: [
                { listing_image_id: 8, url_fullxfull: 'https://images.example.test/bracelet.jpg' },
              ],
            },
          ],
        ]),
      }),
    ).toEqual({
      candidates: [
        {
          listingId: '42',
          title: 'Original lavender bracelet',
          listingUrl: 'https://www.etsy.com/listing/42/original-lavender-bracelet',
          evidence: {
            e1ListingSource: 'raw/listings/42.json',
            e2ImageSource: 'raw/listings/42.json',
            shopSource: 'raw/listings/42.json',
            imageCount: 1,
            shopId: 7,
          },
        },
      ],
    });
  });

  it('does not create a curation receipt candidate without a raw listing, image, and shop fact', () => {
    expect(
      buildE5CandidateReceipt({
        searchPayloads: [searchPayload],
        listingDetailsById: new Map([
          ['42', { listing_id: 42, title: 'No image', shop: { shop_id: 7 } }],
          ['99', { listing_id: 99, title: 'No shop', images: [{ listing_image_id: 9 }] }],
        ]),
      }),
    ).toEqual({ candidates: [] });
  });
});
