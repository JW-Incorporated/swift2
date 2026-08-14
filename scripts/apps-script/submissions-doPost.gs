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

/**
 * Prefixes a leading =, +, - or @ with a single quote so Sheets treats the
 * cell as literal text instead of evaluating it as a formula (CSV/formula
 * injection defense). The website already does this before sending, but this
 * script is a separate trust boundary — it may one day be called by
 * something other than that route — so it repeats the check on every cell,
 * not just the ones the website currently treats as user-controlled.
 */
function neutralizeCell_(value) {
  var s = value === null || value === undefined ? '' : String(value);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

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

  // Exact column order — must match the sheet's header row. Every cell is
  // run through neutralizeCell_ regardless of source (see its comment).
  sheet.appendRow([
    neutralizeCell_(payload.submitted_at || ''),
    neutralizeCell_(payload.section || ''),
    neutralizeCell_(payload.url || ''),
    neutralizeCell_(payload.domain || ''),
    neutralizeCell_(payload.platform_guess || ''),
    neutralizeCell_(payload.page_title || ''),
    neutralizeCell_(payload.status || 'New'),
    neutralizeCell_(payload.reviewed_by || ''),
    neutralizeCell_(payload.added_to_site || 'No'),
    neutralizeCell_(payload.live_url || ''),
    neutralizeCell_(payload.duplicate_of || ''),
    neutralizeCell_(payload.notes || ''),
    neutralizeCell_(payload.submitter_note || ''),
    neutralizeCell_(payload.source_page || ''),
    neutralizeCell_(payload.client_hash || ''),
    neutralizeCell_(payload.flags || ''),
  ]);

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON,
  );
}
