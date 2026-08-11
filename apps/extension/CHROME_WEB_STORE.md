# Chrome Web Store — My Pings

> **Estado (2026-08-12):** v0.1.0 — embudo RSS on-demand (Fase 0+1).  
> Plan: [`docs/plan-implementacion.md`](../../docs/plan-implementacion.md)

## Listing copy (EN)

**Name:** My Pings  

**Short description (≤132):**  
My Pings — all your chosen alerts in one list. RSS feeds you follow. On demand.

**Detailed description:**  
My Pings gathers alerts from sources you choose into one scrollable list—so you can decide what to open and skip the rest.

How it works (v0.1):
1. Add RSS or Atom feed URLs you care about.
2. Tap Refresh to fetch the latest items.
3. Browse All / News / Custom, open a ping, or mark it read.

Coming later: GitHub, calendar, mail metadata, and more—still opt-in only.

We do not read your OS notification center. By AI4Context. UI: English and Spanish.

**Category:** Productivity  
**Single purpose:** Show an on-demand list of alerts from user-selected sources (feeds first).

## Permissions

- `storage` — sources, pings, language  
- optional host permissions — fetch feed URLs the user adds  

## Package

```bash
cd apps/extension
npm install
npm run pack
```

Artifact: `apps/extension/releases/MyPings-v{version}.zip`
