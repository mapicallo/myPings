# My Pings

**My Pings — All your chosen alerts in one list**

Chrome extension (AI4Context): an on-demand funnel of alerts from sources you choose. **v0.5.0** adds a companion PWA for mobile/web plus publication packages for Chrome and Edge.

| | |
|--|--|
| **Workspace** | `C:\code-myPings\` |
| **Repo** | https://github.com/mapicallo/myPings |
| **Plan** | [docs/plan-implementacion.md](docs/plan-implementacion.md) |
| **Load unpacked** | `apps/extension/dist` |

## Quick start

```bash
cd apps/extension
npm install
npm run pack
```

Chrome → Extensions → Developer mode → Load unpacked → `apps/extension/dist`.

1. Add a source (RSS, GitHub, HN, Reddit, Gmail, ICS).  
2. Tap **Refresh**.  
3. Open / mark read items in the funnel.

**Gmail:** requires OAuth setup — see [apps/extension/GMAIL_OAUTH.md](apps/extension/GMAIL_OAUTH.md).

## Status

| Version | Scope |
|---------|--------|
| **0.5.0** | PWA web + publication packages (Chrome/Edge ZIP) |
| **0.4.x** | Export/import sources, Gmail UX, CWS polish |

## Privacy

Only sources you add. On-demand refresh. No OS notification scraping. See `apps/extension/public/privacy.html`.
