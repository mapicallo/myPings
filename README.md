# My Pings

**My Pings — All your chosen alerts in one list**

Chrome extension (AI4Context): an on-demand funnel of alerts from sources you choose. **v0.3.0** adds HN, Reddit, Gmail metadata, and priority keywords.

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
| **0.3.0** | Fase 3: HN, Reddit, Gmail metadata, priority keywords, Email tab |
| 0.2.0 | Fase 2: GitHub + ICS calendar, Dev/Calendar tabs, silence source |
| 0.1.0 | Fase 0+1: panel AI4Context, i18n EN/ES, RSS embudo |
| 0.4.x | CWS polish (planned) |

## Privacy

Only sources you add. On-demand refresh. No OS notification scraping. See `apps/extension/public/privacy.html`.
