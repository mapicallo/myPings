# My Pings

**My Pings — All your chosen alerts in one list**

Chrome extension (AI4Context): an on-demand funnel of alerts from sources you choose. **v0.1.0** ships RSS/Atom feeds.

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

1. Add an RSS/Atom URL (grant host permission when prompted).  
2. Tap **Refresh**.  
3. Open / mark read items in the funnel.

## Status

| Version | Scope |
|---------|--------|
| **0.1.0** | Fase 0+1: panel AI4Context, i18n EN/ES, RSS embudo |
| 0.2.x | GitHub + calendar (planned) |

## Privacy

Only sources you add. On-demand refresh. No OS notification scraping. See `apps/extension/public/privacy.html`.
