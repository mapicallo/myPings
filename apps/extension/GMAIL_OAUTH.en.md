# Gmail OAuth setup (My Pings)

Gmail uses `chrome.identity` + **`gmail.metadata`** scope (sender, subject, date — no body).

> **`bad client id` error:** `manifest.json` still has the placeholder ID. Create a real OAuth Client ID in Google Cloud and paste it in the manifest.

---

## Steps (~10 min)

### 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or use an existing one).
3. **APIs & Services → Library** → search **Gmail API** → **Enable**.

### 2. OAuth consent screen

1. **APIs & Services → OAuth consent screen**.
2. User type: **External** (or Internal for Workspace).
3. Fill app name, support email, and domains if required.
4. Under **Scopes**, add: `https://www.googleapis.com/auth/gmail.metadata`.
5. Under **Test users**, add your Gmail account (while the app is in “Testing” mode).

### 3. OAuth credential — Chrome Extension

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Chrome Extension**.
3. **Extension ID:** copy from `chrome://extensions` (Developer mode → My Pings).
4. Create the credential and copy the **Client ID** (ends with `.apps.googleusercontent.com`).

### 4. Paste Client ID in manifest

Edit `apps/extension/public/manifest.json`:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/gmail.metadata"]
}
```

### 5. Rebuild and reload

```bash
cd apps/extension
npm run pack
```

Chrome → Extensions → **Reload** My Pings (Load unpacked → `apps/extension/dist`).

### 6. Test

Sources → Gmail → **Connect Gmail** → sign in with Google → authorize.

---

## Chrome Web Store publish

The extension ID **in the store** differs from “Load unpacked”. You must:

1. Create **another** OAuth credential (Chrome Extension) with the published extension ID, **or**
2. Add both extension IDs to the same credential if Google Cloud allows it.

Update `client_id` in the production ZIP before uploading to CWS.

---

## Notes

- Chrome stores the token locally; nothing is uploaded to AI4Context servers.
- Only **unread** mail is fetched when you tap Refresh.
- One Gmail source per install.
