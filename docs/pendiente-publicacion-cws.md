# Pendiente publicación — My Pings (CWS + Edge + Web)

> Checklist para subir **v0.5.0** a Chrome Web Store, Microsoft Edge Add-ons y la PWA en ai4context.com.

## Paquetes generados

| Destino | Comando | Salida |
|---------|---------|--------|
| Chrome / Edge extension | `cd apps/extension && npm run pack` | `releases/MyPings-v0.5.0.zip` |
| PWA web | `cd apps/extension && npm run build:pwa` | `dist-pwa/` |
| Sync landing | `cd landing && node scripts/sync-my-pings-pwa.mjs` | `public/web-extensions/my-pings/` |

## Chrome Web Store

1. **Subir ZIP** desde Developer Dashboard → nuevo ítem o actualización.
2. **Textos:** ver [`apps/extension/CHROME_WEB_STORE.md`](../apps/extension/CHROME_WEB_STORE.md).
3. **Capturas:** 1280×800 PNG/JPG (recomendado: inbox vacío, fuentes, lista con pings, export/import, Gmail panel).
4. **Política de privacidad:** `https://www.ai4context.com/web-extensions/my-pings/privacy.html`
5. **Categoría:** Productivity.
6. **Permisos:** justificar `storage`, `identity` (Gmail opcional), host permissions opcionales.

### Gmail OAuth (opcional antes de publicar)

- Sustituir placeholder en `public/manifest.json`:
  `"client_id": "REPLACE_WITH_OAUTH_CLIENT_ID.apps.googleusercontent.com"`
- Guía: [`apps/extension/GMAIL_OAUTH.md`](../apps/extension/GMAIL_OAUTH.md)
- Tras publicar en CWS, el **extension ID cambia** → actualizar redirect URIs en Google Cloud Console.

## Microsoft Edge Add-ons

1. Mismo ZIP que Chrome (MV3).
2. Partner Center → Submit extension.
3. Copiar descripción EN/ES desde CWS.
4. Misma URL de privacidad.

## PWA en ai4context.com

1. Ejecutar sync desde landing (ver arriba).
2. Desplegar landing (Vercel).
3. Verificar:
   - https://www.ai4context.com/web-extensions/my-pings/
   - Instalable en móvil (Add to Home Screen)
   - Service worker activo
4. Ruta embed con iframe: `/web-extensions/my-pings-app` (hub extensiones web).

### Limitaciones PWA vs extensión

| Función | Extensión | PWA |
|---------|-----------|-----|
| RSS / feeds públicos | ✅ + permisos host | ✅ (CORS del feed) |
| GitHub / HN / Reddit | ✅ | ✅ |
| ICS calendar | ✅ | ✅ |
| Gmail OAuth | ✅ (con client_id) | ❌ (solo extensión) |
| Panel en ventana propia | ✅ | ✅ (standalone) |
| Almacenamiento | chrome.storage | localStorage |

## Landing — catálogo

- Ficha: `/extensions/my-pings`
- Hub web: `/web-extensions/my-pings-app`
- Tiendas: botones **Próximamente** hasta tener URLs CWS/Edge → actualizar `landing/src/config/storeUrls.ts`

## Post-publicación

- [ ] Añadir URLs de tienda en `storeUrls.ts` y `CHROME_WEB_STORE.md`
- [ ] Actualizar OAuth con extension ID de producción
- [ ] Screenshots en `landing/public/images/extensions/myPings/` (opcional)
