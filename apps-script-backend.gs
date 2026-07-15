/**
 * PRISM Recruitment — Google Sheet backend
 *
 * SETUP:
 * 1. Go to https://sheets.google.com and create a new blank spreadsheet.
 *    Name it something like "PRISM Recruitment Data".
 * 2. In the Sheet, go to Extensions > Apps Script.
 * 3. Delete any placeholder code in the editor, and paste this whole file in.
 * 4. Click Deploy > New deployment.
 *    - Click the gear icon next to "Select type" and choose "Web app".
 *    - Description: anything (e.g. "PRISM signups API").
 *    - Execute as: Me.
 *    - Who has access: Anyone.
 *    - Click Deploy.
 * 5. Authorize it when prompted (click through the "unsafe" warning — this is
 *    your own script, it's safe).
 * 6. Copy the "Web app URL" it gives you (ends in /exec). You'll paste that
 *    into script.js as API_URL.
 *
 * Every time you edit this script, you need to create a NEW deployment
 * (Deploy > Manage deployments > pencil icon > New version) for changes to
 * take effect on the existing URL.
 */

const SHEET_NAME = 'Submissions';
const HEADERS = ['name', 'email', 'major', 'gradYear', 'event', 'timestamp'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

// Handles GET requests — used by the dashboard to load all signups.
function doGet(e) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handles POST requests — used by the signup form to save a new entry.
function doPost(e) {
  const sheet = getSheet_();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.name || '',
    data.email || '',
    data.major || '',
    data.gradYear || '',
    data.event || '',
    data.timestamp || new Date().toISOString()
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
