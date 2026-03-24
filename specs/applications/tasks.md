# Applications — Tasks

## Tareas completadas

- [x] Task 1: Crear schema RxDB para `applications`
- [x] Task 2: Implementar `use-applications.ts` (CRUD)
- [x] Task 3: Crear tabla de postulaciones con sorting por fecha
- [x] Task 4: Formulario de creación/edición (dialog)
- [x] Task 5: Vista detalle con timeline
- [x] Task 6: Componente de benefit tags editables
- [x] Task 7: Vincular CV generado a postulación

## Tareas pendientes (v2)

- [x] Task 8: POST /api/scrape endpoint — Cloudflare Browser Rendering URL-to-markdown
  - Scope: Crear `app/api/scrape/route.ts`. Validación con Zod del body (`{ url: string }`). Llamada server-side a Cloudflare `/markdown` API. Auth con Clerk. Manejo de errores (URL inválida, timeout, contenido no legible). Retorna `{ markdown: string }` o `{ error: string }`.
  - Depende de: nada (task de infraestructura)

- [x] Task 9: URL extraction UI — Tabs "Texto plano" / "URL" en formulario de nueva postulación
  - Scope: Agregar componente Tabs al campo "Oferta laboral" en `application-form.tsx`. Tab "Texto plano" mantiene el textarea actual. Tab "URL" muestra input de URL + botón "Analizar con IA". Al analizar: llama a POST /api/scrape, luego alimenta el markdown al flujo existente de `parseJobOffer()` para auto-rellenar campos. Feedback visual durante el proceso. Si falla, sugerir copiar-pegar como alternativa.
  - Depende de: Task 8, cross-cutting Task 2 (ai-elements Shimmer)

- [x] Task 10: Animación Double Flash/Shimmer en campos auto-rellenados por IA
  - Scope: Después de que `parseJobOffer()` auto-rellena campos, aplicar animación "Double Flash" (shimmer breve) en cada campo actualizado. Usar componente Shimmer de ai-elements + framer-motion para la animación.
  - Depende de: Task 9, cross-cutting Task 1 y 2

- [x] Task 11: Rediseño de Beneficios — Lista con CRUD (reemplaza tags)
  - Scope: Crear `components/applications/benefit-list.tsx` con controles de agregar, editar, eliminar. Max-height con scroll o accordion similar al campo "Oferta laboral". Aplicar mismo diseño en formulario de creación y en página de detalle `[id]/page.tsx`.
  - Depende de: nada

- [x] Task 12: Tooltips de ayuda en campos del formulario
  - Scope: Agregar icono de ayuda (?) con tooltip en 4 campos de `application-form.tsx`: Fecha respuesta, Fecha postulación, Beneficios, Estado. Texto de ayuda estático que orienta al usuario sobre qué ingresar en cada campo.
  - Depende de: nada

- [x] Task 13: Estado solo lectura en tabla de postulaciones
  - Scope: En `applications-table.tsx`, quitar el dropdown inline que permite cambiar el estado. El campo estado se muestra como badge de solo lectura en la vista de lista. El estado solo se edita desde el formulario de edición o la página de detalle.
  - Depende de: nada

- [x] Task 14: Eliminar timeline header estático en página de detalle
  - Scope: En `app/(app)/applications/[id]/page.tsx`, eliminar el header con los pasos estáticos ("Aplicado", "Llamada", "Técnica", "RRHH", "Oferta", "Aceptado") que no aporta valor funcional.
  - Depende de: nada

## Tareas pendientes (v2.1)

- [x] Task 15: Schema v3 — agregar `url`, `workModality`, `offerPublishedAt` + migración
  - Scope: En `lib/db/schemas.ts`, agregar 3 nuevos campos a `ApplicationDocument` interface y al `applicationSchema` (bump version 2→3). Campos: `url` (string), `workModality` (string, enum: hybrid/onsite/remote), `offerPublishedAt` (string). No agregar a `required`. En `lib/db/index.ts`, agregar migration strategy `3` que inicializa los 3 campos con string vacío. En `types/cv.ts`, agregar tipo `WorkModality` y mapa `WORK_MODALITY_LABELS` (Híbrido, Presencial, Remoto).
  - Depende de: nada

- [x] Task 16: Remover auto-timeline al crear + hardcode status `pending`
  - Scope: En `hooks/use-applications.ts`, cambiar `createApplication()` para que `timeline` sea `[]` en lugar de `initialTimeline`. Eliminar la variable `initialTimeline`. En `components/applications/application-form.tsx`, ocultar el campo `status` cuando `isEditing === false`. Setear default value de `status` to `'pending'` siempre en modo creación.
  - Depende de: Task 15

- [x] Task 17: Renombrar "Nueva postulación" → "Registrar oferta"
  - Scope: En `app/(app)/applications/page.tsx`, cambiar texto del botón principal. En `components/applications/application-form.tsx`, cambiar título del Sheet y texto del botón submit en modo creación. En `components/applications/applications-table.tsx`, cambiar texto del empty state.
  - Depende de: nada

- [x] Task 18: Source a texto libre + nuevos campos en formulario
  - Scope: En `components/applications/application-form.tsx`: (1) Reemplazar el `Select` de `source` por un `Input` de texto libre con placeholder "ej. LinkedIn, Computrabajo, Referido...". Agregar `source` a `FlashField` para que la IA pueda animarlo. (2) Agregar campo `url` al schema Zod y al formulario (Input en sección detalles). Cuando el usuario usa la URL para scraping, también guardarla en este campo. (3) Agregar campo `workModality` al schema Zod y al formulario (Select con opciones de `WORK_MODALITY_LABELS`). (4) Agregar campo `offerPublishedAt` al schema Zod y al formulario (Input date en sección fechas). Actualizar `defaultValues` para incluir los nuevos campos.
  - Depende de: Task 15

- [ ] Task 19: Formulario wizard 3 pasos con barra de progreso
  - Scope: Refactorizar `components/applications/application-form.tsx` para transformar el formulario en un wizard de 3 pasos (solo en modo creación; en edición se muestra todo directo). Paso 1: URL input + "Analizar con IA" + botón "Saltar" (la URL es opcional). Paso 2: Textarea para pegar oferta + "Analizar con IA". Paso 3: Formulario completo de detalles con todos los campos + botón "Registrar oferta". Agregar barra de progreso en la parte superior con 3 pasos clickeables para navegación libre. Botones "Anterior"/"Siguiente" en el footer. Auto-advance al paso 3 cuando la IA extrae exitosamente. Eliminar el componente Tabs actual (reemplazado por los pasos). Preservar comportamiento de Flash/Shimmer en paso 3.
  - Depende de: Task 16, Task 17, Task 18

- [ ] Task 20: Vista detalle — nuevos campos + modal oferta laboral
  - Scope: En `app/(app)/applications/[id]/page.tsx`: (1) Mostrar `url` como link clickeable con icono `ExternalLink` (abre en nueva pestaña). (2) Mostrar `workModality` como badge con label del mapa `WORK_MODALITY_LABELS`. (3) Mostrar `offerPublishedAt` como fecha formateada + indicador de días desde publicación. (4) Cambiar `source` de Select a Input en modo edición. (5) Agregar botón "Ver oferta original" que abre un `Dialog` (shadcn) con el contenido de `jobOfferText` renderizado con `whitespace-pre-wrap`. Solo mostrar el botón si `jobOfferText` no está vacío. (6) Agregar los nuevos campos al estado editable y a `handleSave()`.
  - Depende de: Task 15, Task 18
