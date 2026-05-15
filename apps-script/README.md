# Cloud Store — Deployment

A tiny Google Apps Script that gives the Fusion app a shared backend for
**Shared Equipment**, **Shared Budget**, and **Camp Meetups**. Without it,
those features stay per-device (localStorage only).

## What you'll end up with
- A new tab called `CloudStore` in your existing camp Google Sheet.
- A web app URL like `https://script.google.com/macros/s/AKfy.../exec`.
- That URL pasted into `CLOUD_STORE_URL` near the top of the script block
  in `fusion-app.html` — at which point cross-device sync turns on.

## One-time setup (~5 minutes)

1. **Open the camp Google Sheet** (the one already feeding Members + Arrival).
2. **Open the Apps Script editor**: `Extensions` → `Apps Script`.
3. **Replace the default `Code.gs`** with the contents of
   [`cloud-store.gs`](./cloud-store.gs). Save (`⌘S` / `Ctrl+S`).
4. **Deploy as a Web App**:
   - Click `Deploy` → `New deployment`.
   - Click the gear ⚙ → choose `Web app`.
   - **Execute as**: `Me`.
   - **Who has access**: `Anyone` (required so the app can hit it without auth).
   - Click `Deploy`. Authorize the script when Google prompts; you may need
     to click `Advanced` → `Go to (unsafe)` since the script is unverified —
     it's your own script.
   - Copy the **Web app URL** that ends in `/exec`.
5. **Paste the URL into the app**:
   - Open `fusion-app.html` and search for `CLOUD_STORE_URL`.
   - Replace the empty string with your URL:
     ```js
     const CLOUD_STORE_URL = 'https://script.google.com/macros/s/AKfy.../exec';
     ```
   - Commit + push. GitHub Pages picks the change up automatically.

## How it works after that
- **On every Camp-tab open**, the app GETs each namespace from the script
  and updates the local view. Cloud data wins; new local entries get
  pushed up to the cloud on save.
- **On every save** (add expense, claim equipment, add meetup, etc.), the
  app POSTs the new value to the cloud. localStorage is updated first so
  the UI never blocks on the network.
- **First user** to open the app after deployment seeds the cloud with
  their existing local data — so nothing you already typed is lost.
- **Offline / patchy network**: writes silently fall back to localStorage
  only; next time the device is online, the next save pushes the merged
  state up. Reads on tab open fall back to the cached local value.

## Storage layout (inside the Sheet)

A single tab named `CloudStore` with three columns:

| key             | value (JSON)                                | updated_at         |
| --------------- | ------------------------------------------- | ------------------ |
| equipment       | `[{ "id":"…", "name":"Tent", … }]`          | `2026-06-20T…`     |
| budget_members  | `["Anna","Marc","Lucía","You"]`             | `2026-06-20T…`     |
| budget_expenses | `[{ "description":"Petrol", "amount":… }]`  | `2026-06-20T…`     |
| budget_settled  | `[{ "from":"Marc","to":"Anna","amount":…}]` | `2026-06-20T…`     |
| meetups         | `["Drum + Bass at Bachstelzen", …]`         | `2026-06-20T…`     |

You can inspect / hand-edit the JSON cells if needed — but normally the
script writes them.

## Updating the script later

To change the script:
1. Edit `cloud-store.gs` in Apps Script.
2. `Deploy` → `Manage deployments` → click the pencil ✏ on the existing
   deployment → set Version to `New version` → `Deploy`.
3. **The URL stays the same** — no change needed in `fusion-app.html`.

## Security notes

- The web app URL is essentially a write-key. Anyone with it can read or
  overwrite the JSON. For a private friend-group app this is fine; the
  URL is in your repo and your members can see it. Don't post it
  publicly.
- For real auth (per-member identity, write-protected rows) you'd want
  Firebase or similar — see the parent app's session log.
- The script writes to whichever spreadsheet is *bound* to it. If you
  ever copy the script to another sheet, it'll bind to that one — easy
  to mix up.

## Troubleshooting

- **CORS errors** in DevTools → make sure the deployment's "Who has
  access" is set to `Anyone` (not `Anyone with Google account`).
- **Always returns `{ok: false, error: ...}`** → check the script's
  executions log (Apps Script editor → `Executions`) for stack traces.
- **App appears to work but data isn't syncing** → confirm
  `CLOUD_STORE_URL` is set (not the empty default) and ends in `/exec`.
