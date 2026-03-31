# CV Generator — Plan de implementación

**Estado**: ✅ Implementado

## Arquitectura

```
cv-generator/page.tsx (wizard 3 pasos)
  ├── Step 1: StepJobOffer
  │     → textarea para oferta
  │     → POST /api/ai/parse → extrae requisitos
  │
  ├── Step 2: StepGoals (layout 3 columnas)
  │     ├── Col 1: Bullets checklist (colapsable por sección)
  │     ├── Col 2: CvEditor (preview en tiempo real)
  │     └── Col 3: MatchAnalysis (% match, alertas, "Continuar")
  │     └── Toolbar: [Vista previa | Ver oferta | Chat IA | Optimizar con IA]
  │           └── Optimizar → CvOptimizeDialog → diff review → apply to draftCv
  │
  └── Step 3: StepPreview
        → CvViewer (renderizado ATS)
        → Descargar PDF / Guardar en RxDB

cvs/page.tsx (viewer + edit entry point)
  → Lista de CVs guardados
  → CvViewer para visualización
  → Botón "Editar" → /cv-generator?editId=xxx

cv-generator/page.tsx (modo edición)
  → Detecta ?editId=xxx en URL
  → Carga CV guardado via getCvById()
  → Reconstruye selections comparando bullets guardados vs experiencia
  → Inicia en Step 2 directamente
  → Guardar → updateCV() en lugar de saveCV()
```

## Modelo de datos (RxDB)

Collection: `cvs` (schema v1)

```typescript
{
  id: string
  applicationId?: string     // vínculo a postulación
  jobTitle: string           // título del puesto
  company: string            // empresa
  jobOfferText: string       // texto completo de la oferta (para re-optimización IA)
  cvData: string             // CV generado (JSON stringified CvData)
  isDraft: boolean           // true = borrador en progreso, false = CV definitivo
  createdAt: string
  updatedAt: string          // fecha de última edición (auto-save)
}
```

## Auto-save

- **Nuevo CV**: Al primer cambio en `jobOfferText` se crea un doc `isDraft: true` en RxDB. Cada cambio en `draftCv` hace `patch()` con debounce 1s. Al guardar → `isDraft: false`. Al navegar fuera sin guardar → `deleteDraft()`.
- **Editar CV existente**: Los cambios de `draftCv` hacen `patch()` directo al CvDocument con debounce 1s. Al recargar → `getCvById(editId)` ya tiene el estado más reciente.
- La lista de "Mis CVs" filtra `isDraft: false` para no mostrar borradores.

## Integración con IA

```
lib/ai.ts          → callAiProvider(model, apiKey, prompt)
lib/ai-cv.ts       → generateCv(experience, jobOffer, model, apiKey)
                   → optimizeCv(draftCv, jobOffer, context, model, apiKey)
app/api/ai/parse/  → POST route (server-side, auth protected)
```

## Patrones de UI

- **Grid 3 columnas**: `grid-cols-[300px_1fr_300px]`
- **Sticky sidebar**: `flex flex-col h-full` + `flex-1` spacer
- **Tooltips**: `group` + `group-hover:block` con posición absolute
- **Diff review**: lado a lado con badges Aceptado/Rechazado por item

## Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `app/(app)/cv-generator/page.tsx` | Wizard 3 pasos |
| `app/(app)/cvs/page.tsx` | Listado de CVs |
| `components/cv-generator/step-job-offer.tsx` | Step 1 |
| `components/cv-generator/step-goals.tsx` | Step 2 |
| `components/cv-generator/step-preview.tsx` | Step 3 |
| `components/cv-generator/cv-editor.tsx` | Editor tiempo real |
| `components/cv-generator/match-analysis.tsx` | Análisis de match |
| `components/cv-generator/cv-optimize-dialog.tsx` | Modal optimización + diff |
| `components/cv-generator/cv-preview-dialog.tsx` | Preview impresión |
| `components/cv-generator/ai-chat.tsx` | Chat con IA |
| `components/cv/cv-viewer.tsx` | Renderizado ATS |
| `lib/ai-cv.ts` | Lógica de generación |
| `lib/ai.ts` | Llamadas a providers |
| `hooks/use-cvs.ts` | Hook CRUD |

---

## Navegación por pasos via query params

El paso activo se persiste en la URL como `?step=N` (1, 2 o 3). Esto permite:
- Controlar el paso inicial al navegar (ej: `?editId=xxx&step=2` para editar directo en Step 2)
- Preservar el estado al recargar la página
- `router.replace()` (no `push`) para no contaminar el historial del navegador

### Modo edición (`?editId=xxx&step=2`)
- `getCvById(editId)` carga el CV guardado desde RxDB
- `initSelectionsFromSavedCv(savedCv, fullCvData)` reconstruye las selecciones comparando bullets guardados vs experiencia completa
- `draftCv` se inicializa con el CV guardado (no con la experiencia base)
- `handleSaveCv` usa `updateCV(editId, ...)` en lugar de crear nuevo doc
- `StepPreview` muestra "Actualizar CV" / "CV actualizado" via prop `isEditing`

## Mejoras v2

### Unificación de diseño

Alinear `cv-generator/page.tsx` con los patrones de layout de `applications/page.tsx` y `experience/page.tsx`:
- Ancho máximo del contenido
- Tamaño y estilo de títulos de página
- Padding y espaciado entre secciones
- Estilos de cards

### Shimmer loading durante generación IA

Reemplazar estados de loading actuales (spinner/skeleton) con Shimmer de ai-elements:
- `suggestBullets()` → shimmer en columna de bullets (Step 2)
- `generateCv()` → shimmer en CV editor (Step 2)
- `optimizeCv()` → shimmer en CV editor (Step 2)
- Efecto shimmer en el borde del contenedor del CV editor durante generación

### Archivos a modificar (v2)

| Archivo | Cambio |
|---------|--------|
| `app/(app)/cv-generator/page.tsx` | Unificar layout wrapper, título, spacing |
| `components/cv-generator/cv-editor.tsx` | Shimmer border durante generación IA |
| `components/cv-generator/step-goals.tsx` | Shimmer en columnas durante llamadas IA |
| `components/cv-generator/step-job-offer.tsx` | Shimmer durante parsing |

---

## Mejoras v3

### FR19 — Toggle colapsar/expandir todos (Col 1)

Un botón en el header de la columna 1 alterna entre "Colapsar todo" y "Expandir todo", controlando el estado `open` de todos los accordions/toggles de sección simultáneamente.

```
Col 1 header
  ├── [Colapsar todo / Expandir todo]  ← botón toggle
  └── Lista de secciones colapsables
```

Archivos: `components/cv-generator/step-goals.tsx`

---

### FR20 — Columna 1 colapsable

La columna 1 puede ocultarse/mostrarse con un botón (chevron lateral). Cuando está oculta, el grid se ajusta para dar más espacio al CV borrador (col 2).

```
Grid colapsado:  grid-cols-[0px_1fr_300px]  (o variante con transition)
Grid expandido:  grid-cols-[300px_1fr_300px]
```

- Implementar con `useState(isCol1Open)` en `step-goals.tsx`
- Usar transición CSS (`transition-all duration-300`) para animar el colapso
- El botón de abrir/cerrar queda visible siempre (fuera del área colapsada)

Archivos: `components/cv-generator/step-goals.tsx`

---

### FR21 — Sincronización Col 1→2 (bug + mejora)

**Causa del bug**: Al seleccionar un bullet en col 1, `toggleBullet()` actualiza `selections` pero `draftCv` no se reconstruye para incluir la experiencia padre si esta no existía previamente.

**Solución**: En la función que construye/actualiza `draftCv` a partir de `selections`, verificar si la entrada de experiencia (empresa, puesto, fechas) ya existe. Si no existe, insertarla completa antes de agregar el bullet.

```
toggleBullet(experienceId, bulletIndex)
  → selections updated
  → rebuildDraftCv(selections, fullExperience, draftCv)
        → para cada (experienceId, bullets[]):
            if experienceId NOT in draftCv.experience:
              insert full experience entry (company, role, dates)
            add/remove bullet
```

Archivos: `app/(app)/cv-generator/page.tsx`, `lib/ai-cv.ts`

---

### FR22 — Drag & Drop de bullets (Col 2)

Los bullets del CV borrador (col 2) deben poder reordenarse con D&D, incluyendo mover un bullet de una sección a otra (cross-section).

- Usar `@dnd-kit/core` + `@dnd-kit/sortable` (ya disponible en el ecosistema Next.js/shadcn)
- Cada bullet es un `<SortableItem>` con handle de drag
- El drop entre secciones actualiza `draftCv` moviendo el bullet al array de la sección destino
- Visual: cursor `grab`, indicador de posición durante drag

Archivos: `components/cv-generator/cv-editor.tsx`

---

### FR23 — Drag & Drop de skills técnicas (Col 2)

Las pills/tags de Habilidades > Técnicas deben poder reordenarse con D&D para comunicar relevancia (primeras = más importantes).

- Mismo enfoque que FR22: `@dnd-kit/sortable`
- El orden se persiste en `draftCv.skills.technical[]`

Archivos: `components/cv-generator/cv-editor.tsx`

---

### FR24 — Respuesta IA de skills como pills editables

Cuando la IA responde a una sugerencia de Habilidades > Técnicas, en lugar de mostrar un `textarea` con texto libre, renderizar la respuesta como pills interactivas:

- Parsear la respuesta IA (lista de skills) → array de strings
- Mostrar cada skill como pill con botón "×" para borrar
- Permitir añadir skills adicionales (input + Enter)
- Al confirmar, fusionar las pills aceptadas con `draftCv.skills.technical`

Archivos: `components/cv-generator/cv-editor.tsx`, `lib/ai-cv.ts`

---

### FR25 — Mejora de prompt para skills técnicas

El prompt actual en `lib/ai-cv.ts` para sugerencia de skills incluye la experiencia del usuario, lo que hace que la IA devuelva skills propias en lugar de las requeridas por la oferta.

**Prompt corregido** (patrón):
```
Dado el siguiente texto de oferta laboral, extrae ÚNICAMENTE las habilidades técnicas
que son mencionadas o claramente requeridas por la oferta.
NO incluyas habilidades que no aparezcan en la oferta, aunque el candidato las tenga.
Devuelve una lista de skills, una por línea, sin numeración.

Oferta:
{jobOfferText}
```

Archivos: `lib/ai-cv.ts`

---

### FR26 — Refactorizar Chat IA con ai-elements

Reemplazar la UI actual del chat (`components/cv-generator/ai-chat.tsx`) con los componentes de ai-elements, preservando toda la lógica de negocio.

**Componentes a usar:**
- `<Conversation>` / `<Message>` — para el historial de mensajes
- `<PromptInput>` — para el campo de escritura
- Sugerencias de prompts al iniciar conversación (cuando `messages.length === 0`): chips con prompts frecuentes (ej: "Optimiza mis bullets para esta oferta", "¿Qué keywords me faltan?", "Mejora mi resumen profesional")

**Regla**: No perder ninguna funcionalidad existente; solo cambiar la capa de presentación.

Archivos: `components/cv-generator/ai-chat.tsx`

---

### Archivos a modificar (v3)

| Archivo | Cambio |
|---------|--------|
| `components/cv-generator/step-goals.tsx` | FR19 toggle all, FR20 col 1 colapsable |
| `components/cv-generator/cv-editor.tsx` | FR22 D&D bullets, FR23 D&D skills, FR24 pills IA |
| `components/cv-generator/ai-chat.tsx` | FR26 ui con ai-elements |
| `lib/ai-cv.ts` | FR21 rebuildDraftCv, FR24 parser respuesta IA, FR25 prompt skills |
| `app/(app)/cv-generator/page.tsx` | FR21 toggleBullet fix |
