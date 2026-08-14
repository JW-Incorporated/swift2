/**
 * Community/Merch link submissions — appends one row per submission to the
 * "Submissions" sheet. Deploy this INSIDE the Google Sheet itself
 * (Extensions → Apps Script), not as a standalone project.
 *
 * Setup (see docs/ops/community-merch-submissions.md for the full walkthrough
 * written for a non-programmer):
 *   1. Paste this whole file into the Apps Script editor.
 *   2. Project Settings → Script Properties → add one property:
 *        SUBMISSIONS_SHARED_SECRET = <a long random string you make up>
 *      This must match the SUBMISSIONS_SHEET_SECRET env var on the website —
 *      it stops randoms on the internet from writing rows into your sheet.
 *   3. Deploy → New deployment → type "Web app" → Execute as "Me" →
 *      Who has access "Anyone" → Deploy. Copy the web app URL — that's the
 *      SUBMISSIONS_SHEET_WEBHOOK_URL env var on the website. Never share
 *      that URL publicly; anyone with it (who also knows the secret) can
 *      write rows.
 *
 * The sheet's columns, in this exact order, must already exist as the header
 * row (they do — this script does not create them):
 *   submitted_at, section, url, domain, platform_guess, page_title, status,
 *   reviewed_by, added_to_site, live_url, duplicate_of, notes,
 *   submitter_note, source_page, client_hash, flags
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Submissions');
  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: 'No sheet tab named "Submissions" found.' }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: 'Invalid JSON.' }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var expectedSecret = PropertiesService.getScriptProperties().getProperty('SUBMISSIONS_SHARED_SECRET');
  if (!expectedSecret || payload.secret !== expectedSecret) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: 'Unauthorized.' }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Exact column order — must match the sheet's header row.
  sheet.appendRow([
    payload.submitted_at || '',
    payload.section || '',
    payload.url || '',
    payload.domain || '',
    payload.platform_guess || '',
    payload.page_title || '',
    payload.status || 'New',
    payload.reviewed_by || '',
    payload.added_to_site || 'No',
    payload.live_url || '',
    payload.duplicate_of || '',
    payload.notes || '',
    payload.submitter_note || '',
    payload.source_page || '',
    payload.client_hash || '',
    payload.flags || '',
  ]);

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON,
  );
}
