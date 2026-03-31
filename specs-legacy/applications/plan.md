# Applications — Plan de implementación

**Estado**: 🔶 v2.1 en progreso

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

---

## Arquitectura v2.1

### Modelo de datos v3 (schema bump v2→v3)

Collection: `applications` — nuevos campos agregados:

```typescript
{
  // ... campos existentes v2 ...
  url: string                                        // URL de la oferta laboral
  workModality: 'hybrid' | 'onsite' | 'remote' | ''  // Modalidad de trabajo
  offerPublishedAt: string                            // Fecha de publicación de la oferta (ISO string)
}
```

### Migración v2→v3

```typescript
3: (oldDoc) => ({
  ...oldDoc,
  url: '',
  workModality: '',
  offerPublishedAt: '',
})
```

Todos los campos nuevos se inicializan con string vacío. Son opcionales en la práctica (no en `required` del schema).

### Tipos nuevos (`types/cv.ts`)

```typescript
type WorkModality = 'hybrid' | 'onsite' | 'remote'

const WORK_MODALITY_LABELS: Record<WorkModality, string> = {
  hybrid: 'Híbrido',
  onsite: 'Presencial',
  remote: 'Remoto',
}
```

### Cambios de comportamiento

1. **Timeline vacío al crear**: `createApplication()` ya no genera una entrada automática "Postulado". El timeline empieza como `[]`. El usuario registra manualmente cada paso del proceso.

2. **Status hardcoded**: Al crear una oferta nueva, `status` siempre es `'pending'`. El campo no aparece en el formulario de creación. Solo es visible/editable en modo edición.

3. **Source como texto libre**: El campo `source` cambia de `Select` (con opciones fijas: LinkedIn, Computrabajo, etc.) a un `Input` de texto libre. El usuario escribe manualmente el nombre de la plataforma. La IA también puede auto-rellenar este campo al extraer la oferta.

4. **Renombrar botón**: "Nueva postulación" → "Registrar oferta" en: botón principal, título del Sheet, botón submit, empty state de la tabla.

### Formulario wizard 3 pasos

El wizard reemplaza la UI de tabs actual dentro del Sheet. Solo aplica en modo creación; en modo edición se muestra el formulario completo directo.

```
┌─────────────────────────────────────────┐
│  ● Paso 1 ─────── ○ Paso 2 ─────── ○ Paso 3  │  ← Barra de progreso (clickeable)
│  URL              Oferta            Detalles   │
├─────────────────────────────────────────┤
│                                                 │
│  [Contenido del paso activo]                   │
│                                                 │
├─────────────────────────────────────────┤
│  [Cancelar]              [Anterior] [Siguiente] │
│                          o [Registrar oferta]   │
└─────────────────────────────────────────┘
```

**Paso 1 — URL de la oferta** (opcional, skip allowed)
- Input de URL + botón "Analizar con IA"
- Botón "Saltar" para ir directo al paso 2
- Si IA extrae exitosamente → auto-advance al paso 3 (campos pre-rellenados)
- Si falla → muestra aviso y sugiere ir al paso 2
- Al analizar, también guarda la URL en el campo `url` del formulario

**Paso 2 — Texto de la oferta** (fallback manual)
- Textarea para pegar oferta en texto plano o markdown
- Botón "Analizar con IA" para extraer campos
- Si IA extrae exitosamente → auto-advance al paso 3
- El usuario puede escribir/pegar el texto y avanzar sin analizar

**Paso 3 — Detalles de la oferta**
- Campos: Company*, Position*, Source (Input), URL, WorkModality (Select), Salary, Currency, Favorite, Benefits, appliedAt, offerPublishedAt, responseDate, nextSteps, Notes
- Botón submit: "Registrar oferta"
- Muestra sección de CV asociado y timeline (solo en edición)

**Navegación**: Libre entre pasos (steps clickeables). Botones "Anterior"/"Siguiente" en el footer.

### Vista detalle — Cambios

**Nuevos campos a mostrar:**
- `url` → Link clickeable con icono `ExternalLink`, abre en nueva pestaña
- `workModality` → Badge con label ("Híbrido", "Presencial", "Remoto")
- `offerPublishedAt` → Fecha formateada + días desde publicación

**Source**: Cambia de Select a Input en modo edición.

**Modal de oferta laboral**: Botón "Ver oferta original" que abre un `Dialog` con el contenido de `jobOfferText` renderizado con `whitespace-pre-wrap`. Solo visible si `jobOfferText` no está vacío.

### Archivos modificados (v2.1)

| Archivo | Cambio |
|---------|--------|
| `lib/db/schemas.ts` | Interface + schema v3 (3 nuevos campos) |
| `lib/db/index.ts` | Migración v2→v3 |
| `types/cv.ts` | `WorkModality` type + `WORK_MODALITY_LABELS` |
| `hooks/use-applications.ts` | Timeline vacío al crear, quitar `initialTimeline` |
| `components/applications/application-form.tsx` | Wizard 3 pasos, source Input, nuevos campos, status oculto en create, renombrar botón |
| `components/applications/applications-table.tsx` | Renombrar empty state |
| `app/(app)/applications/page.tsx` | Renombrar botón "Registrar oferta" |
| `app/(app)/applications/[id]/page.tsx` | Nuevos campos, source Input, modal jobOfferText |
