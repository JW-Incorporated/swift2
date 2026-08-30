#!/usr/bin/env node
// Read-only, one-off diagnostic for t_a57b0362. NOT part of the product pipeline.
// Fetches the Awin Publisher API programme directory WITHOUT any sector/country
// filtering and reports counts, HTTP status, and the raw sector taxonomy strings
// actually returned, so we can tell an account-side restriction apart from a
// taxonomy-string mismatch. Never prints token/publisherId values.
import { requestProgrammes } from './awin-directory-shortlist.mjs';

const RELATIONSHIPS = ['joined', 'pending', 'suspended', 'rejected', 'notjoined'];

function programmeInfo(programme) {
  return programme?.programmeInfo ?? programme ?? {};
}

function programmeSectors(programme) {
  const info = programmeInfo(programme);
  const values = [
    info.primarySector,
    info.sectors,
    info.sector,
    info.categories,
    info.category,
    programme.primarySector,
    programme.sectors,
    programme.sector,
    programme.categories,
    programme.category,
  ]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .flatMap((value) =>
      typeof value === 'object' && value
        ? [value.name, value.label, value.category, value.sector]
        : [value],
    )
    .filter((value) => typeof value === 'string' && value.trim());
  return [...new Set(values)];
}

function programmeCountry(programme) {
  const info = programmeInfo(programme);
  return info.primaryRegion?.countryCode ?? programme?.primaryRegion?.countryCode ?? null;
}

async function requestRaw({ publisherId, token, relationship }) {
  const url = new URL(
    `https://api.awin.com/publishers/${encodeURIComponent(publisherId)}/programmes`,
  );
  if (relationship) url.searchParams.set('relationship', relationship);
  url.searchParams.set('accessToken', token);
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  const text = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(text);
  } catch {
    // leave payload null on parse failure
  }
  const programmes = Array.isArray(payload)
    ? payload
    : (payload?.programmes ?? payload?.data ?? []);
  return {
    status: response.status,
    ok: response.ok,
    isArray: Array.isArray(payload),
    topLevelKeys:
      payload && !Array.isArray(payload) && typeof payload === 'object'
        ? Object.keys(payload)
        : null,
    errorField: payload && !Array.isArray(payload) ? (payload.error ?? payload.message ?? null) : null,
    count: programmes.length,
    bodyPreviewLength: text.length,
  };
}

async function main() {
  const token = process.env.AWIN_API_TOKEN;
  const publisherId = process.env.AWIN_PUBLISHER_ID;
  if (!token) throw new Error('AWIN_API_TOKEN is required');
  if (!publisherId) throw new Error('AWIN_PUBLISHER_ID is required');

  // 1) Raw single-page probe per relationship, unfiltered by country/sector.
  const rawByRelationship = {};
  for (const relationship of RELATIONSHIPS) {
    rawByRelationship[relationship] = await requestRaw({ publisherId, token, relationship });
  }

  // 2) Full paginated fetch (existing tested pagination logic), unfiltered by
  // country/sector, across every relationship — this is the same pagination
  // path PR #3538 fixed.
  const allProgrammes = [];
  const perRelationshipTotals = {};
  for (const relationship of RELATIONSHIPS) {
    const programmes = await requestProgrammes({ publisherId, token, relationship });
    perRelationshipTotals[relationship] = programmes.length;
    allProgrammes.push(...programmes.map((p) => ({ ...p, relationship })));
  }

  const countryCounts = {};
  for (const programme of allProgrammes) {
    const country = programmeCountry(programme) ?? 'UNKNOWN';
    countryCounts[country] = (countryCounts[country] ?? 0) + 1;
  }

  const sectorCounts = {};
  for (const programme of allProgrammes) {
    for (const sector of programmeSectors(programme)) {
      sectorCounts[sector] = (sectorCounts[sector] ?? 0) + 1;
    }
  }

  const usProgrammes = allProgrammes.filter((p) => programmeCountry(p) === 'US');
  const usSectorCounts = {};
  for (const programme of usProgrammes) {
    for (const sector of programmeSectors(programme)) {
      usSectorCounts[sector] = (usSectorCounts[sector] ?? 0) + 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        publisherIdLength: String(publisherId).length,
        rawSinglePageProbe: rawByRelationship,
        paginatedTotalsByRelationship: perRelationshipTotals,
        paginatedGrandTotal: allProgrammes.length,
        countryDistribution: countryCounts,
        allSectorStringsSeen: sectorCounts,
        usOnlySectorStringsSeen: usSectorCounts,
        usProgrammeCount: usProgrammes.length,
        sampleProgrammeShape: allProgrammes[0] ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(`diagnose-awin-directory: ${error.message}`);
  process.exitCode = 1;
});
