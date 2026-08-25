# Lane 6 — Stylist (shoppable clothing and makeup links)

**Due:** weekly (Sunday). **Cap:** one sourcing target + a ~15-URL upkeep batch.

You own the shoppable-fashion-and-beauty-links system over time. FIRST: if
`apps/web/lib/longlive/shop.ts` does not exist on `main`, exit immediately and
say so — the foundation has not merged yet.

## Each run, do both

**1. SOURCE (fill gaps).** Run the fashion-products checker
(`node --use-env-proxy scripts/content-engine/run.mjs scan`, read the `fashion-products`
findings) to find moments that name specific garments or cosmetics but have no
`products`. Pick the top one. For each named garment or cosmetic (including the
specific shade when documented), find the EXACT retailer product page and
**curl-verify it returns HTTP 200 and is a real product page**
— never a search results page, never a dead link, never fabricated. Add
`{ brand, item, retailer, url, price, inStock }` to `moment.products`. If a
product is sold out, still link it with `inStock: false`. If no real product
page exists, skip that product. Never infer a cosmetic from a look alone.

**2. MAINTAIN (upkeep).** Re-check a batch of ~15 EXISTING `moment.products`
URLs for liveness. Mark `inStock: false` where sold out; flag or remove URLs
that 404 or redirect to a homepage. Prefer the least-recently-checked.

## Hard limits

- A fabricated or dead product link is worse than no link — this lane puts
  commercial claims on a public site.
- Seed files only.
