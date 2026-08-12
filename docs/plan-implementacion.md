# My Pings — Plan de implementación

**Fecha:** 2026-08-12  
**Estado:** **v0.2.0** — Fase 2 hecha (GitHub + calendario ICS + tabs Dev/Calendar + silenciar fuente). Siguiente: Fase 3 (correo metadatos / HN)  
**Nombre CWS:** **My Pings**  
**Tagline:** *All your chosen alerts in one list*  
**ES (UI):** *Tus avisos elegidos, en una sola lista*  
**Repo:** https://github.com/mapicallo/myPings  
**Workspace:** `C:\code-myPings\`  
**Load unpacked:** `apps/extension/dist`  
**ZIP:** `apps/extension/releases/MyPings-v0.2.0.zip`  
**Familia:** utilidad AI4Context (productividad / menos ruido)  
**Referencias UX:** AccessPortal / LocalChat / Is this site safe (panel flotante, i18n, packing CWS)

---

## 1. Objetivo

Dar al usuario un **embudo on-demand** de avisos (“pings”) procedentes **solo de fuentes que él conecta**, en una lista única ordenada por llegada (y vistas por tipo), para decidir en segundos qué abrir e ignorar el resto.

| Problema | Cómo lo aborda |
|----------|----------------|
| Notificaciones dispersas en muchas apps/webs | Una lista / embudo |
| Ruido del sistema y redes | Opt-in por fuente; no “todo el PC/móvil” |
| Feeds infinitos que enganchan | Lista accionable, no timeline social |
| Duda “¿miro esto ahora?” | Fila con info mínima + abrir / silenciar |

**No promete:** leer el centro de notificaciones de Windows/Android/iOS, WhatsApp/Instagram nativos, ni scrapeo de sitios logueados.

**Sí promete:** fuentes estables (RSS, APIs/OAuth, correo metadatos, etc.), embudo + filtros por categoría, privacidad clara.

---

## 2. Principios

1. **Opt-in** — sin fuente conectada, no hay ping.  
2. **On-demand** — el usuario abre el panel / pulsa actualizar; sin vigilancia global del dispositivo.  
3. **Una fila = una decisión** — título, origen, hora, acción (abrir / leído / silenciar).  
4. **Embudo + por tipo** — lista única y vistas por categoría.  
5. **Honestidad** — si una API falla → ping de estado / vacío honesto, no inventar eventos.  
6. **Familia AI4Context** — cabecera/footer, EN/ES (más idiomas luego), privacy + CWS copy alineados.  
7. **Sin scrapeo** en el núcleo — solo RSS/API/OAuth/email documentados.

---

## 3. Nombre y copy

| Campo | Texto |
|-------|--------|
| Nombre CWS | My Pings |
| Tagline EN | All your chosen alerts in one list |
| Short description (borrador ≤132) | My Pings — all your chosen alerts in one list. RSS, GitHub, calendar & more. On demand. |
| Categoría | Productivity |

---

## 4. Alcance de fuentes (prioridad)

### Tier 1 — MVP (orden de implementación)

| # | Fuente | Valor | Enfoque técnico |
|---|--------|-------|-----------------|
| 1 | **RSS / Atom** | Noticias, blogs, muchos YouTube vía feed | Polling al refresh; URLs que añade el usuario |
| 2 | **GitHub** | Issues, PRs, releases, menciones | OAuth / PAT; eventos elegidos |
| 3 | **Calendario** | Reuniones / plazos | Google Calendar OAuth y/o URL `.ics` |
| 4 | **Correo (metadatos)** | Asunto + remite | Gmail API / Microsoft Graph — sin cuerpo completo en v1 |
| 5 | **HN / Reddit** | Radar tech / nicho | API o RSS de subreddit / HN |
| 6 | **CWS / Edge (publisher)** | Reviews / señal de tus extensiones | Donde haya API o flujo manual/asistido |

### Explicitamente fuera (v1–v2)

- Notification Listener del SO  
- WhatsApp, Instagram, TikTok, DMs  
- Scrapeo Amazon/Temu/Netflix logueado  
- “Todas las notificaciones del móvil”

### Tier 2 (post-MVP)

YouTube Data API, Slack/Discord (canales opt-in), Twitch, Steam, clima, Notion/Linear…

---

## 5. Modelo de producto (UI)

### Pantalla principal — Embudo

```
[Header: My Pings | By AI4Context | idioma]

[ Tabs: All | News | Dev | Calendar | Mail | … ]
[ Actualizar ]

[ Lista scroll:
  · hace 2m  GitHub  Issue #12 en myPings        [Abrir]
  · hace 15m RSS     Titular…                    [Abrir]
  · 10:00    Cal     Standup                     [Abrir]
]
```

### Configuración — Fuentes

- Añadir / quitar fuente  
- Asignar categoría  
- Silenciar temporalmente  
- Intervalo de refresh (solo con panel abierto o al pulsar; sin service worker agresivo en MVP)

### Acciones por fila

Abrir URL · Marcar leído · Silenciar fuente 1 h / hoy · Copiar enlace  

Cabecera/footer familia AI4Context (como AccessPortal / LocalChat).

---

## 6. Arquitectura técnica (propuesta)

```
[Panel extensión MV3]
    │  refresh / open
    ▼
[Core: PingStore + SourceAdapters]
    │
    ├─ RSS adapter (local fetch)
    ├─ GitHub adapter (token)
    ├─ Calendar adapter (OAuth / ICS)
    ├─ Mail metadata adapter (OAuth)
    └─ HN/Reddit adapter
    │
    ▼
[Lista unificada ordenada por receivedAt]
    │
    ▼
chrome.storage / IndexedDB (local)
```

| Pieza | Notas |
|-------|--------|
| Stack | `apps/extension` — MV3 + Vite + TypeScript (patrón isThisSiteSafe / Create my AI Context) |
| Permisos MVP | `storage`; `host_permissions` solo a orígenes de feeds/APIs usados; OAuth vía flujo documentado |
| Backend | **Evitar en Fase 0–1** si es posible. Si OAuth multi-dispositivo o secretos, proxy Vercel (como ITSS Safe Browsing) — fase aparte |
| PWA móvil | Fase posterior: misma lista (sync) o “pegar/abrir embudo web”; **no** Notification Listener iOS |

---

## 7. Fases de implementación

### Fase 0 — Bootstrap (v0.0.x) → **hecho en v0.1.0**

| Entrega | Detalle |
|---------|---------|
| Git | Repo `myPings`, `main`, remote origin |
| Scaffold | `apps/extension`: manifest, panel, SW, i18n EN/ES, iconos |
| Scripts | `dev`, `build`, `pack` |
| Docs | README, este plan, `CHROME_WEB_STORE.md`, `privacy.html` |
| UI | Embudo + Add source |

**Criterio done:** load unpacked + panel abre + “No pings yet”. ✅

### Fase 1 — RSS embudo (v0.1.0) — **hecho**

- Añadir feeds RSS/Atom (permiso de host opcional por origen)  
- Refresh → filas en lista All / News / Custom  
- Abrir / marcar leído / quitar fuente  
- Privacy documentada  

**Criterio done:** feeds reales → lista usable en scroll. ✅

### Fase 2 — GitHub + Calendario (v0.2.0) ✅

- GitHub: issues/PR/releases configurables  
- Calendar: ICS (URL pública)  
- Filtros por tipo en tabs (Dev, Calendar)  
- Silenciar fuente (1h / 8h / 24h)  

### Fase 3 — Correo metadatos + HN/Reddit (v0.3.0)

- Gmail o Outlook: solo from/subject/date/link  
- HN y/o Reddit (subreddits elegidos)  
- Reglas simples de prioridad (opcional)

### Fase 4 — Publisher CWS + polish tienda (v0.4.0)

- Señal reviews / recordatorios publisher (según APIs disponibles)  
- Pack CWS, pantallazos, pendiente-publicacion doc  
- Landing AI4Context: entrada catálogo + “Próximamente” / URL tienda  

### Fase 5 — Edge + PWA ligera (opcional)

- Mismo ZIP MV3 en Edge Add-ons donde las APIs lo permitan  
- PWA solo-lectura del embudo si hay sync; si no, diferir sync  

---

## 8. Casos de uso Tier 1 (recordatorio)

Ver conversación de producto; resumen:

| Fuente | Ejemplo |
|--------|---------|
| RSS | Briefing matutino de 5 medios |
| GitHub | Issues/PRs de repos AI4Context |
| Calendario | “Reunión en 15 min” |
| Correo | Triage por asunto/remite sin abrir Gmail |
| HN/Reddit | Radar r/chrome_extensions |
| CWS | Nueva review en Is this site safe |

---

## 9. Privacidad y CWS (borrador)

- Solo fuentes opt-in.  
- On-demand / refresh explícito en MVP (sin leer notificaciones del SO).  
- Tokens OAuth en `chrome.storage` local (o session); nunca en el ZIP.  
- Privacy.html: listar cada tipo de dato por fuente.  
- Single purpose: *Show an on-demand list of alerts from user-selected sources (feeds, GitHub, calendar, etc.).*

---

## 10. Estimación orientativa

| Fase | Esfuerzo |
|------|----------|
| 0 Bootstrap | 0,5–1 día |
| 1 RSS embudo | 2–4 días |
| 2 GitHub + Calendar | 3–5 días |
| 3 Mail + HN/Reddit | 3–5 días |
| 4 CWS polish | 1–2 días |

**MVP publicable interno:** Fase 0+1.  
**MVP “ Tier 1 convincente”:** hasta Fase 2 o 3.

---

## 11. Decisiones abiertas

1. ¿OAuth GitHub/Google vía extensión pura o proxy AI4Context (Vercel)?  
2. ¿Nombre de categorías fijas vs totalmente custom?  
3. ¿Refresh solo manual en v0.1 o alarma MV3 limitada con panel cerrado? (recomendación v0.1: **manual / al abrir**)  
4. ¿Incluir Edge en v1 o Chrome-first como LocalChat?  

---

## 12. Siguiente paso inmediato

1. Scaffold `apps/extension` (Fase 0).  
2. Implementar adaptador RSS + lista embudo (Fase 1).  
3. Validar UX con 3–5 feeds reales antes de OAuth.

---

## 13. Relación con el ecosistema

| Producto | Relación |
|----------|----------|
| Is this site safe | Confianza web on-demand |
| Create my AI Context | Contexto para IAs |
| **My Pings** | Embudo de avisos elegidos |
| Landing ai4context.com | Catálogo + store URLs cuando exista ZIP/CWS |
