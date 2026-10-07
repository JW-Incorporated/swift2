# share-fonts

Latin-subset `.woff` files copied unmodified from `@fontsource/inter` and
`@fontsource/playfair-display` (both SIL Open Font License 1.1) for the
share-card renderer (`../share-card-fonts.ts`). Vendored so the
`/api/share-card` function ships its own fonts; refresh by re-copying from
`node_modules/@fontsource/*/files/` if those packages are upgraded.

License texts, copied verbatim from the packages and kept alongside the fonts
as the OFL requires:

- `LICENSE-inter.txt` — Inter (The Inter Project Authors)
- `LICENSE-playfair.txt` — Playfair Display (The Playfair Display Project Authors)
