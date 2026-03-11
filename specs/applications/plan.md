# Applications — Plan de implementación

**Estado**: ✅ Implementado

## Arquitectura

```
page.tsx (listado)
  → ApplicationsTable (tabla con sorting/filtrado)
  → ApplicationForm (dialog para crear/editar)

[id]/page.tsx (detalle)
  → ApplicationTimeline (timeline de eventos)
  → TimelineEntryForm (agregar evento)
  → BenefitTags (tags editables)
```

## Modelo de datos (RxDB)

Collection: `applications`

```typescript
{
  id: string
  company: string
  position: string
  source: string
  status: 'pending' | 'interviewed' | 'rejected' | 'offer' | ...
  salary: number
  benefits: string[]
  ranking: number
  notes: string
  dateApplied: string
  cvId?: string          // referencia al CV generado
  timeline: TimelineEntry[]
}
```

## Dependencias

- `hooks/use-applications.ts` → CRUD sobre RxDB
- `hooks/use-db.ts` → acceso a la instancia de DB del usuario

## Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `app/(app)/applications/page.tsx` | Listado de postulaciones |
| `app/(app)/applications/[id]/page.tsx` | Detalle + timeline |
| `components/applications/applications-table.tsx` | Tabla principal |
| `components/applications/application-form.tsx` | Form crear/editar |
| `components/applications/application-timeline.tsx` | Timeline wrapper |
| `components/applications/timeline-view.tsx` | Visualización timeline |
| `components/applications/timeline-entry-form.tsx` | Form de eventos |
| `components/applications/benefit-tags.tsx` | Tags de beneficios |
| `hooks/use-applications.ts` | Hook CRUD |

---

## Arquitectura v2

### URL Extraction — Flujo completo

```
ApplicationForm (tab: "URL")
  → usuario pega URL de oferta laboral
  → clic en "Analizar con IA"
  → POST /api/scrape { url }
     → Cloudflare Browser Rendering /markdown API (server-side)
     → retorna markdown de la página
  → markdown se alimenta al flujo existente de parseJobOffer()
  → auto-fill de campos: empresa, cargo, fuente, salario, moneda, beneficios, oferta completa
  → animación Double Flash/Shimmer en campos rellenados
```

### Cloudflare Browser Rendering API

- Endpoint: `https://api.cloudflare.com/client/v4/accounts/{account_id}/browser-rendering/markdown`
- Método: POST con `{ url }` en body
- Auth: `Authorization: Bearer {CF_API_TOKEN}`
- Free tier: 10 min/día de browser time, suficiente para uso típico
- Retorna markdown limpio de la página — ideal para alimentar al parser de IA

### Beneficios — Rediseño

```
BenefitList (reemplaza BenefitTags)
  → Lista con items individuales
  → Controles: agregar, editar, eliminar
  → Max-height con scroll o accordion
  → Mismo diseño en formulario y en página de detalle
```

### Archivos nuevos

| Archivo | Rol |
|---------|-----|
| `app/api/scrape/route.ts` | **Nuevo** — POST endpoint, llama a CF Browser Rendering, retorna markdown |
| `components/applications/benefit-list.tsx` | **Nuevo** — Lista de beneficios con CRUD (reemplaza `benefit-tags.tsx`) |

### Archivos modificados (v2)

| Archivo | Cambio |
|---------|--------|
| `components/applications/application-form.tsx` | Agregar tabs (URL/Texto plano), integrar scrape, shimmer en campos, tooltips |
| `components/applications/applications-table.tsx` | Quitar dropdown inline de estado, hacer solo lectura |
| `app/(app)/applications/[id]/page.tsx` | Eliminar timeline header, usar `benefit-list.tsx` |

### Variables de entorno

```bash
CF_ACCOUNT_ID=...     # Cloudflare Account ID
CF_API_TOKEN=...      # API Token con permiso "Browser Rendering: Edit"
```
