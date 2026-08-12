# My Pings

**My Pings — All your chosen alerts in one list**

Chrome extension (AI4Context): an on-demand funnel of alerts from sources you choose. **v0.2.0** ships RSS/Atom, GitHub events, and ICS calendars.

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

1. Add a source (RSS, GitHub events URL, or ICS calendar URL).  
2. Tap **Refresh**.  
3. Open / mark read items in the funnel.

## Status

| Version | Scope |
|---------|--------|
| **0.2.0** | Fase 2: GitHub + ICS calendar, tabs Dev/Calendar, silence source |
| 0.1.0 | Fase 0+1: panel AI4Context, i18n EN/ES, RSS embudo |
| 0.3.x | Email metadata + HN/Reddit (planned) |

## Privacy

Only sources you add. On-demand refresh. No OS notification scraping. See `apps/extension/public/privacy.html`.
