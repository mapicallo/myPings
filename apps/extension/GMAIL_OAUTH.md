# Gmail OAuth setup (My Pings)

Gmail integration uses `chrome.identity` + Gmail **metadata** scope (from, subject, date — no body).

## Steps

1. **Google Cloud Console** → APIs & Services → Enable **Gmail API**.
2. **Credentials** → Create OAuth client ID → Application type: **Chrome Extension**.
3. Copy your extension ID from `chrome://extensions` (Developer mode).
4. Paste the extension ID in the OAuth client configuration.
5. Copy the **Client ID** and replace in `public/manifest.json`:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/gmail.metadata"]
}
```

6. Rebuild: `npm run pack` and reload the extension.

## Notes

- Token is stored by Chrome; not uploaded to AI4Context servers.
- Only **unread** messages are fetched on refresh.
- One Gmail source per extension install.
- For CWS publish, register the **store** extension ID in the same OAuth client.
