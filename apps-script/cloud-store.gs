/**
 * Fusion 2026 — Cloud Store
 * Tiny JSON key/value store backed by a tab in the camp's Google Sheet.
 *
 * Deploy as a Web App (Deploy → New deployment → Type: Web app →
 * Execute as: Me → Who has access: Anyone), then paste the /exec URL
 * into CLOUD_STORE_URL in fusion-app.html.
 *
 * Storage layout: a sheet tab called "CloudStore" with three columns:
 *   key | value (JSON string) | updated_at (ISO timestamp)
 * The script creates the tab + header row on first call.
 *
 * Endpoints:
 *   GET  ?key=NAMESPACE       → { ok: true, value: <parsed JSON or null> }
 *   POST { key, value }       → { ok: true }
 *
 * The Fusion app uses namespaces:
 *   equipment, budget_members, budget_expenses, budget_settled, meetups
 *
 * Notes on CORS: Apps Script Web Apps work cross-origin for simple
 * requests. The app sends POST bodies as text/plain to avoid triggering
 * a CORS preflight (which Apps Script does not handle).
 */

const SHEET_NAME = 'CloudStore';

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['key', 'value', 'updated_at']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRow_(sheet, key) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === key) return i + 2;
  }
  return -1;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const key = (e && e.parameter && e.parameter.key) || '';
    if (!key) return jsonResponse_({ ok: false, error: 'missing key' });
    const sheet = getSheet_();
    const row = findRow_(sheet, key);
    if (row === -1) return jsonResponse_({ ok: true, value: null });
    const raw = sheet.getRange(row, 2).getValue();
    let value = null;
    if (raw !== '' && raw != null) {
      try { value = JSON.parse(String(raw)); } catch (_) { value = null; }
    }
    return jsonResponse_({ ok: true, value });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const key = body.key || '';
    if (!key) return jsonResponse_({ ok: false, error: 'missing key' });
    const sheet = getSheet_();
    const row = findRow_(sheet, key);
    const payload = JSON.stringify(body.value);
    const now = new Date().toISOString();
    if (row === -1) {
      sheet.appendRow([key, payload, now]);
    } else {
      sheet.getRange(row, 2, 1, 2).setValues([[payload, now]]);
    }
    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}
