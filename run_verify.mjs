import { planImageRepairs } from './scripts/merch-engine/verify-images.mjs';

const records = [
  { productId: 'balmain-jumpsuit', url: 'https://us.balmain.com/en/p/sleeveless-lambskin-jumpsuit-FF0QO025LE040DA.html' },
  { productId: 'ghd-styler', url: 'https://www.amazon.com/Ghd-Original-Styler-Straightener-Professional/dp/B09P4SVXK4' },
  { productId: 'mac-ruby-woo-1989', url: 'https://www.maccosmetics.com/product/13854/52593/products/makeup/lips/lipstick/retro-matte-lipstick' },
  { productId: 'iuv-boots', url: 'https://www.amazon.com/IUV-Cowboy-Western-Cowgirl-Pointy/dp/B0BFQRZPRH' },
  { productId: 'etro-maxi-dress', url: 'https://www.etro.com/us-en/peau-d-ange-silk-long-dress-with-floral-motif-WRHA056599SP1L7X0808.html' },
  { productId: 'janessa-cap', url: 'https://www.revolve.com/janessa-leone-mattie-fisherman-cap-in-rust/dp/JNES-WA15/' },
  { productId: 'nars-lipstick', url: 'https://www.amazon.com/Lipstick-Ravishing-Matte-3-5g-0-12oz/dp/B082P4X6FV' },
  { productId: 'odlr-tulle-dress', url: 'https://www.modaoperandi.com/women/p/oscar-de-la-renta/floral-embroidered-tulle-mini-dress/493975' },
  { productId: 'etro-jacket', url: 'https://www.etro.com/us-en/single-breasted-velvet-jacket-WRCA008199TUEI1B0904.html' },
  { productId: 'davidkoma-flounce-dress', url: 'https://www.fwrd.com/product-david-koma-flounce-one-sleeve-sequin-mini-dress-in-blue/DAVF-WD195/' },
  { productId: 'freepeople-velvet-dress', url: 'https://www.revolve.com/free-people-lux-velvet-shirt-dress-in-fairytale/dp/FREE-WD1888/' },
  { productId: 'tiffany-bracelet', url: 'https://www.tiffany.com/jewelry/bracelets/tiffany-infinity-sterling-silver-bracelets-60143730.html' },
  { productId: 'ebossy-cardigan', url: 'https://www.amazon.com/Womens-Cardigan-Embroidery-Sweater-Outwear/dp/B0BGXK89F2/' },
  { productId: 'mac-locked-kiss', url: 'https://www.maccosmetics.com/product/13854/119065/products/makeup/lips/lipstick/mac-locked-kiss-24hr-lipstick?shade=RUBY+TRUE' },
  { productId: 'mac-ruby-woo-red', url: 'https://www.maccosmetics.com/product/13854/52593/products/makeup/lips/lipstick/retro-matte-lipstick' },
  { productId: 'bnikion-cat-ears', url: 'https://www.amazon.com/Rhinestone-Headbands-Decoration-Headdress-Accessories/dp/B075STRZCY' },
  { productId: 'lulus-tea-party-dress', url: 'https://www.lulus.com/products/tea-party-chic-pink-floral-print-tie-strap-tiered-midi-dress/1712196.html' },
  { productId: 'wrangler-bandana-shirt', url: 'https://jacksonswestern.com/wrangler-women-s-multicolor-rainbow-bandana-western-snap-shirt/' },
  { productId: 'goldstitch-shorts', url: 'https://www.amazon.com/Womens-Juniors-Vintage-Waisted-Shorts/dp/B00KSYPWWO' },
  { productId: 'lv-earrings', url: 'https://us.louisvuitton.com/eng-us/products/louise-pm-earrings-s00-nvprod2950037v/M00396' },
  { productId: 'gildan-tshirt', url: 'https://www.amazon.com/Gildan-Cotton-T-Shirt-Orange-Medium/dp/B00I84H5AS' },
  { productId: 'davidkoma-crystal-dress', url: 'https://davidkoma.com/collections/dresses/products/crystal-embroidered-neckline-and-strap-mini-dress-black-silver' },
  { productId: 'reformation-sweater', url: 'https://www.thereformation.com/products/teo-cashmere-short-sleeve-sweater/1313290.html' },
  { productId: 'miumiu-bomber', url: 'https://www.bergdorfgoodman.com/p/miu-miu-check-oversized-zip-up-wool-bomber-jacket-prod189900058' },
  { productId: 'balmain-tp-dress', url: 'https://www.nordstrom.com/s/strappy-houndstooth-tweed-a-line-dress/8377396' },
  { productId: 'cl-miss-jane', url: 'https://www.nordstrom.com/s/christian-louboutin-miss-jane-sandal-women/7544624' },
  { productId: 'simkhai-vest', url: 'https://www.revolve.com/simkhai-poppy-vest-in-sand-plaid/dp/JSKI-WO47/' },
  { productId: 'simkhai-skirt', url: 'https://www.revolve.com/simkhai-payton-wrap-mini-skirt-in-sand-plaid/dp/JSKI-WQ100/' },
  { productId: 'gucci-loafer', url: 'https://www.neimanmarcus.com/p/gucci-ottavia-leather-platform-loafer-pumps-prod274440624' },
  { productId: 'monse-dress', url: 'https://www.amazon.com/MONSE-Harness-Tapestry-Dress-Alien/dp/B0FB9MHTDS' },
  { productId: 'mpope-ring', url: 'https://mpopeandco.com/products/14k-yellow-gold-vintage-old-mine-cut-diamond-ring' },
  { productId: 'polo-stripe-dress', url: 'https://www.revolve.com/polo-ralph-lauren-striped-silkblend-dress-in-1932-stripe-white-black/dp/PLOR-WD21/' },
];

const results = [];
for (const r of records) {
  try {
    const plan = await planImageRepairs([{ productId: r.productId, listingVerdict: 'ok', url: r.url }]);
    results.push({ ...r, ...plan.updates[0] });
  } catch (e) {
    results.push({ ...r, verdict: 'error', error: e.message });
  }
  console.error(`done ${r.productId}`);
}
console.log(JSON.stringify(results, null, 2));
