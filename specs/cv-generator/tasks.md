# CV Generator — Tasks

## Tareas completadas

- [x] Task 1: Step 1 — Input de oferta laboral
- [x] Task 2: Step 1 — Parsing de oferta con IA (`POST /api/ai/parse`)
- [x] Task 3: Step 2 — Layout 3 columnas
- [x] Task 4: Step 2 — Bullets checklist colapsable (col 1)
- [x] Task 5: Step 2 — CV editor en tiempo real (col 2)
- [x] Task 6: Step 2 — Match analysis con % y keywords (col 3)
- [x] Task 7: Step 2 — Alertas accordion (páginas, ATS, keywords)
- [x] Task 8: Step 2 — Toolbar (vista previa, ver oferta, chat IA, optimizar)
- [x] Task 9: Step 2 — Optimizar con IA (context modal + diff review)
- [x] Task 10: Step 2 — Edición inline de bullets
- [x] Task 11: Step 3 — Renderizado ATS del CV
- [x] Task 12: Step 3 — Descarga/impresión PDF
- [x] Task 13: Step 3 — Guardar CV en RxDB
- [x] Task 14: Viewer — Lista de CVs guardados
- [x] Task 15: Viewer — Visualización con CvViewer
- [x] Task 16: Fix `computeCvDiffs` crash (guard `?? []`)
- [x] Task 17: Fix Dialog accessibility (DialogDescription)
- [x] Task 18: Unificar diseño de cv-generator con otras páginas

## Tareas pendientes — Editar CV guardado (v2)

- [ ] Task 20: Schema migration — Agregar `jobOfferText`, `updatedAt`, `isDraft` a CvDocument
  - Scope: Agregar campos a `CvDocument` interface + schema en `lib/db/schemas.ts`, bump version 0→1. Agregar `migrationStrategies` en `lib/db/index.ts` (defaults: `jobOfferText: ''`, `updatedAt: createdAt`, `isDraft: false`). Actualizar `SaveCvInput` en `hooks/use-cvs.ts`. Pasar `jobOfferText` en `handleSaveCv()` de `cv-generator/page.tsx`.
  - Archivos: `lib/db/schemas.ts`, `lib/db/index.ts`, `hooks/use-cvs.ts`, `app/(app)/cv-generator/page.tsx`

- [ ] Task 21: Agregar `updateCV`, `getCvById`, `createDraft`, `deleteDraft`, `getDraft` al hook `useCvs`
  - Scope: `updateCV(id, input)` — `doc.patch()` + `updatedAt`. `getCvById(id)` — busca por ID. `createDraft(input)` — inserta con `isDraft: true`. `deleteDraft(id)` — elimina draft. `getDraft()` — busca draft activo. Filtrar `isDraft: false` en query de lista existente.
  - Archivos: `hooks/use-cvs.ts`
  - Depende de: Task 20

- [ ] Task 22: Botón "Editar" en página Mis CVs
  - Scope: Agregar botón "Editar" con icono Pencil y `<Link href={/cv-generator?editId=${cv.id}}>` entre los botones "Ver" y "PDF". Mismo estilo ghost/sm/h-8.
  - Archivos: `app/(app)/cvs/page.tsx`

- [ ] Task 23: Auto-save en RxDB (protección contra recargas accidentales)
  - Scope: **Nuevo CV** — al montar: `getDraft()` y restaurar si existe; al primer cambio en `jobOfferText`: `createDraft()`; `useEffect` sobre `draftCv` con debounce 1s → `updateCV(draftId, ...)`; al guardar: `patch(draftId, { isDraft: false })`; al navegar fuera sin guardar: `deleteDraft(draftId)`. **Editar CV** — `useEffect` sobre `draftCv` con debounce 1s → `updateCV(editId, { cvData, updatedAt })`; al recargar: `getCvById(editId)` restaura estado. Indicador sutil "Guardado automáticamente".
  - Archivos: `app/(app)/cv-generator/page.tsx`, `hooks/use-cvs.ts`
  - Depende de: Task 21

- [ ] Task 24: Modo edición en cv-generator (core)
  - Scope: Leer `editId` de searchParams con `useSearchParams()`. Cargar CV con `getCvById()`. Reconstruir selections con `initSelectionsFromSavedCv()` (nueva función en `lib/ai-cv.ts`). Iniciar en Step 2. `handleSaveCv` → `updateCV(editId, { isDraft: false })` cuando `editingCvId`, sino patch draft a `isDraft: false`. Header "Editar CV" condicional. `step-preview.tsx` con prop `isEditing` para textos "Actualizar CV" / "CV actualizado".
  - Archivos: `app/(app)/cv-generator/page.tsx`, `lib/ai-cv.ts`, `components/cv-generator/step-preview.tsx`
  - Depende de: Tasks 20, 21, 23

## Tareas pendientes — Shimmer (v2)

- [ ] Task 19: Shimmer loading animation durante generación IA
  - Scope: Agregar componente Shimmer de ai-elements durante `suggestBullets()`, `generateCv()`, `optimizeCv()`. Efecto shimmer en borde de cv-editor durante generación. Reemplazar estados de loading existentes (spinner/skeleton) con Shimmer.
  - Depende de: cross-cutting Task 2 (ai-elements)
