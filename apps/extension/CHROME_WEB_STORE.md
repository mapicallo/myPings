# Chrome Web Store & Edge Add-ons — My Pings

> **Estado (2026-08-12):** v0.5.0 — listo para empaquetar. PWA compañera en ai4context.com.

## Listing copy (EN)

**Name:** My Pings

**Short description (≤132):**  
My Pings — all your chosen alerts in one list. RSS, GitHub, HN, Reddit & more. On demand.

**Detailed description:**  
My Pings gathers alerts from sources you choose into one scrollable list—so you can decide what to open and skip the rest.

How it works:
1. Add sources you care about: RSS/Atom, GitHub releases, calendar (ICS), Hacker News, Reddit, or Gmail metadata (OAuth).
2. Tap Refresh to fetch the latest items on demand.
3. Browse by category (All, News, Dev, Calendar, Email, Custom), open a ping, or mark it read.
4. Export or import your source list as JSON to share between devices (tokens and Gmail auth stay local).

We do not read your OS notification center. By AI4Context. UI: English and Spanish.

**Companion PWA:** https://www.ai4context.com/web-extensions/my-pings/ — same funnel in the browser on mobile and desktop.

**Category:** Productivity  
**Single purpose:** Show an on-demand list of alerts from user-selected sources.

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | Sources, pings, language |
| `identity` + OAuth | Gmail metadata (optional; user connects explicitly) |
| optional host permissions | Fetch feed URLs the user adds |

## Privacy policy URL

- Extension: `privacy.html` (bundled in package)
- Web / store listing: https://www.ai4context.com/web-extensions/my-pings/privacy.html

## Package (Chrome + Edge)

Same ZIP for both stores (Manifest V3):

```bash
cd apps/extension
npm install
npm run pack
```

Artifact: `apps/extension/releases/MyPings-v0.5.0.zip`

## PWA (web / mobile)

```bash
cd apps/extension
npm run build:pwa
# Deploy dist-pwa/ → ai4context.com/web-extensions/my-pings/
```

From landing repo:

```bash
cd landing
node scripts/sync-my-pings-pwa.mjs
```

## Before first publish

- [ ] Replace `oauth2.client_id` in `public/manifest.json` (Gmail — optional for v1)
- [ ] Screenshots 1280×800 (min. 1, recommended 4–5)
- [ ] Promo images if required by store
- [ ] Verify privacy URL is live after landing deploy
- [ ] Note: unpacked extension ID ≠ store ID → update OAuth redirect URIs after CWS approval

See also: [`docs/pendiente-publicacion-cws.md`](../../docs/pendiente-publicacion-cws.md)
