# DS-160 — React Replica (Standalone)

A ready-to-run React (Vite) project that captures DS-160 style inputs with:
- **Left sidebar stepper** (always visible) + **Top tabs** for quick jumps
- **Modern inputs** and clear validation
- **Real signature capture** (mouse/touch) using `react-signature-canvas`
- **Preview** screen before final submit
- **Google Drive delivery** (two options): Apps Script webhook or direct Drive REST with OAuth token

> Not affiliated with the U.S. Department of State. For internal data capture only.

## Quickstart

```bash
# 1) unzip
cd ds160-react

# 2) install dependencies
npm i

# 3) run dev server
npm run dev

# 4) open the URL printed by Vite (default http://localhost:5173)
```

## Drive Delivery Options

### Option A — Apps Script Web App (easiest)
1. Go to https://script.google.com and create a new project.
2. Paste this minimal code and **Deploy > New deployment > Web app** (execute as you, accessible to Anyone with the link):

```javascript
function doPost(e){
  const data = JSON.parse(e.postData.contents);
  const folder = DriveApp.getRootFolder(); // or DriveApp.getFolderById('YOUR_FOLDER_ID')
  const file = folder.createFile('ds160_' + new Date().toISOString().replace(/[:.]/g,'-') + '.json', JSON.stringify(data, null, 2), 'application/json');
  return ContentService.createTextOutput(JSON.stringify({ ok:true, id:file.getId() })).setMimeType(ContentService.MimeType.JSON);
}
```

3. Copy the Web App URL, paste it in **Signature & Review > Delivery > Apps Script Web App** field, then Submit.

### Option B — Direct Google Drive (OAuth 2.0 access token)
1. Obtain an OAuth access token with scope `https://www.googleapis.com/auth/drive.file` (e.g., via Google OAuth Playground).
2. Choose **Delivery = Google Drive (OAuth token)** and paste the token.
3. Submit. The app uploads a JSON file to your Drive.

> The project never ships secrets. You control tokens/URLs in the UI.

## Build
```bash
npm run build
npm run preview
```

## Notes
- Signature is captured as a PNG data URL and embedded into the JSON payload.
- The form state is client-side; connect to your backend if you need server-side processing.
- To add more fields or pages, edit `src/App.jsx` and `src/data/sections.js`.