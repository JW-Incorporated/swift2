export function termsRecheckTitle(now = new Date()) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new Error('A valid date is required');
  const quarter = Math.floor(now.getUTCMonth() / 3) + 1;
  return `Merch: quarterly affiliate terms re-check — ${now.getUTCFullYear()}-Q${quarter}`;
}

if (process.argv[1]?.endsWith('/terms-recheck.mjs')) console.log(termsRecheckTitle());
