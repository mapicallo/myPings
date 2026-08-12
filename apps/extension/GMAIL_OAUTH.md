# Gmail OAuth — configuración (My Pings)

Gmail usa `chrome.identity` + scope **`gmail.metadata`** (remitente, asunto, fecha — sin cuerpo).

> **Error `bad client id`:** el `manifest.json` sigue con el ID de ejemplo. Hay que crear un OAuth Client ID real en Google Cloud y pegarlo en el manifest.

---

## Pasos (≈10 min)

### 1. Google Cloud Console

1. Abre [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto (o usa uno existente).
3. **APIs y servicios → Biblioteca** → busca **Gmail API** → **Habilitar**.

### 2. Pantalla de consentimiento OAuth

1. **APIs y servicios → Pantalla de consentimiento de OAuth**.
2. Tipo: **Externo** (o Interno si es cuenta Workspace).
3. Rellena nombre de app, email de soporte y dominios si los pide.
4. En **Ámbitos**, añade: `https://www.googleapis.com/auth/gmail.metadata`.
5. En **Usuarios de prueba**, añade tu cuenta de Gmail (mientras la app esté en modo “Testing”).

### 3. Credencial OAuth — Chrome Extension

1. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**.
2. Tipo de aplicación: **Extensión de Chrome** (Chrome Extension).
3. **ID de la extensión:** cópialo de `chrome://extensions` (modo Desarrollador → My Pings).
   - Ejemplo: `abcdefghijklmnopqrstuvwxyz123456`
4. Crea la credencial y copia el **Client ID** (termina en `.apps.googleusercontent.com`).

### 4. Pegar Client ID en el manifest

Edita `apps/extension/public/manifest.json`:

```json
"oauth2": {
  "client_id": "TU_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/gmail.metadata"]
}
```

### 5. Rebuild y recargar

```bash
cd apps/extension
npm run pack
```

Chrome → Extensiones → **Recargar** My Pings (Load unpacked → `apps/extension/dist`).

### 6. Probar

Fuentes → Gmail → **Conectar Gmail** → inicia sesión con Google → autoriza.

---

## Publicar en Chrome Web Store

El ID de extensión **en la tienda** es distinto al de “Load unpacked”. Debes:

1. Crear **otra** credencial OAuth (Chrome Extension) con el ID de la extensión publicada, **o**
2. Añadir ambos IDs de extensión en la misma credencial si Google lo permite en tu consola.

Actualiza `client_id` en el ZIP de producción antes de subir a CWS.

---

## Notas

- El token lo guarda Chrome; no se sube a servidores AI4Context.
- Solo se consultan correos **no leídos** al pulsar Actualizar.
- Una sola fuente Gmail por instalación.
