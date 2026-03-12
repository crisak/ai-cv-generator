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

- [ ] Task 9: URL extraction UI — Tabs "Texto plano" / "URL" en formulario de nueva postulación
  - Scope: Agregar componente Tabs al campo "Oferta laboral" en `application-form.tsx`. Tab "Texto plano" mantiene el textarea actual. Tab "URL" muestra input de URL + botón "Analizar con IA". Al analizar: llama a POST /api/scrape, luego alimenta el markdown al flujo existente de `parseJobOffer()` para auto-rellenar campos. Feedback visual durante el proceso. Si falla, sugerir copiar-pegar como alternativa.
  - Depende de: Task 8, cross-cutting Task 2 (ai-elements Shimmer)

- [ ] Task 10: Animación Double Flash/Shimmer en campos auto-rellenados por IA
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

- [ ] Task 14: Eliminar timeline header estático en página de detalle
  - Scope: En `app/(app)/applications/[id]/page.tsx`, eliminar el header con los pasos estáticos ("Aplicado", "Llamada", "Técnica", "RRHH", "Oferta", "Aceptado") que no aporta valor funcional.
  - Depende de: nada
