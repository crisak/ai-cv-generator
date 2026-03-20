# Feature: Applications Dashboard

**Estado**: 🔶 v2.1 en progreso

---

## Problema

El usuario necesita centralizar el tracking de todas sus ofertas laborales en un solo lugar, con metadatos editables para tomar mejores decisiones (salario, beneficios, estado). El usuario puede registrar ofertas sin necesariamente haberse postulado, lo que permite guardar oportunidades para evaluarlas antes de aplicar.

## Goals

- Vista centralizada de ofertas laborales ordenadas por fecha
- CRUD completo de ofertas con campos enriquecidos (URL, modalidad, fecha publicación)
- Formulario wizard por pasos con extracción IA desde URL
- Campos editables (salario, beneficios, estado, etc.)
- Enlace directo al CV generado para cada oferta
- Timeline de seguimiento manual por oferta

## User Stories

- Como usuario, puedo ver todas mis postulaciones en una tabla ordenada por fecha
- Como usuario, puedo crear una nueva postulación con metadatos
- Como usuario, puedo editar campos como salario, estado, beneficios después de crearla
- Como usuario, puedo ver el detalle de una postulación con su timeline
- Como usuario, puedo vincular un CV generado a una postulación
- Como usuario, puedo comparar ofertas por ranking y beneficios

## Requerimientos funcionales

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR1 | Tabla de postulaciones con ordenamiento por fecha | ✅ |
| FR2 | Formulario de creación/edición de postulación | ✅ |
| FR3 | Campos: fecha, empresa, posición, fuente, estado, salario, beneficios, ranking, notas | ✅ |
| FR4 | Vista detalle con timeline de seguimiento | ✅ |
| FR5 | Tags editables para beneficios | ✅ |
| FR6 | Enlace a CV generado | ✅ |

## Requerimientos no funcionales

- Persistencia en RxDB (collection: `applications`)
- Validación de formulario con Zod
- Responsive (mobile-friendly)

## Archivos principales

```
app/(app)/applications/page.tsx
app/(app)/applications/[id]/page.tsx
components/applications/applications-table.tsx
components/applications/application-form.tsx
components/applications/application-timeline.tsx
components/applications/timeline-view.tsx
components/applications/timeline-entry-form.tsx
components/applications/benefit-tags.tsx
hooks/use-applications.ts
```

---

## Post-MVP (v2)

### User Stories

- Como usuario, puedo pegar una URL de oferta laboral y el sistema extrae automáticamente los datos del formulario
- Como usuario, si la extracción por URL falla, puedo usar el fallback de copiar-pegar texto plano
- Como usuario, veo una animación shimmer en los campos que fueron auto-rellenados por la IA (Double Flash)
- Como usuario, puedo gestionar beneficios con una lista que permite agregar, editar y eliminar items
- Como usuario, veo tooltips de ayuda en campos clave del formulario de postulación
- Como usuario, veo el estado de la postulación como solo lectura en la tabla principal
- Como usuario, no veo el timeline header estático en la página de detalle (eliminado por no aportar valor)

### Requerimientos funcionales (v2)

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR7 | Extracción de oferta por URL via Cloudflare Browser Rendering `/markdown` API | ✅ |
| FR8 | Endpoint `POST /api/scrape` para URL-to-markdown (server-side) | ✅ |
| FR9 | UI tabs/toggle: "Texto plano" vs "URL" en formulario de creación | ✅ |
| FR10 | Animación Double Flash/Shimmer en campos auto-rellenados por IA | ✅ |
| FR11 | Rediseño de Beneficios: lista con CRUD (reemplaza tags actuales) | ✅ |
| FR12 | Tooltips de ayuda en campos: Fecha respuesta, Fecha postulación, Beneficios, Estado | ✅ |
| FR13 | Estado solo lectura en tabla de postulaciones (quitar dropdown inline) | ✅ |
| FR14 | Eliminar timeline header estático en página de detalle | ✅ |

### Requerimientos no funcionales (v2)

- Variables de entorno: `CF_ACCOUNT_ID`, `CF_API_TOKEN` para Cloudflare Browser Rendering
- Error handling: si la URL no puede procesarse, mostrar toast sugiriendo copiar-pegar como alternativa
- Animaciones con framer-motion (dependencia cross-cutting)

---

## v2.1 — Mejoras de formulario y modelo de datos

### User Stories

- Como usuario, puedo registrar una oferta laboral sin necesidad de postularme, para guardarla y evaluarla después
- Como usuario, puedo guardar la URL de la oferta laboral para tener referencia directa a la publicación original
- Como usuario, veo un formulario wizard por pasos (URL → Texto → Detalles) que me guía en el registro de la oferta
- Como usuario, puedo registrar la modalidad de trabajo (Híbrido, Presencial, Remoto) de cada oferta
- Como usuario, puedo registrar la fecha de publicación de la oferta para saber cuánto tiempo lleva activa
- Como usuario, puedo escribir manualmente el nombre de la fuente/plataforma en lugar de elegir de una lista predefinida
- Como usuario, al registrar una oferta nueva el timeline empieza vacío hasta que yo manualmente registre una acción
- Como usuario, puedo ver la oferta laboral completa en un modal desde la vista de detalle

### Requerimientos funcionales (v2.1)

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR15 | Nuevos campos en modelo de datos: `url`, `workModality`, `offerPublishedAt` (schema v3) | ⬜ Pendiente |
| FR16 | Formulario wizard 3 pasos con barra de progreso (URL → Texto → Detalles) | ⬜ Pendiente |
| FR17 | Campo `source` como texto libre (Input) en lugar de Select con opciones fijas | ⬜ Pendiente |
| FR18 | Campo `status` oculto al crear (siempre `pending`), solo visible/editable en modo edición | ⬜ Pendiente |
| FR19 | Timeline vacío al crear oferta (sin auto-entry "Postulado") | ⬜ Pendiente |
| FR20 | Renombrar botón "Nueva postulación" → "Registrar oferta" en todo el módulo | ⬜ Pendiente |
| FR21 | Mostrar nuevos campos (`url`, `workModality`, `offerPublishedAt`) en vista de detalle | ⬜ Pendiente |
| FR22 | Modal/Dialog para ver oferta laboral completa (`jobOfferText`) en página de detalle | ⬜ Pendiente |

### Requerimientos no funcionales (v2.1)

- Schema RxDB bump a v3 con migración v2→v3 (defaults vacíos para nuevos campos)
- Tipo `WorkModality` y labels en `types/cv.ts`
- Wizard solo en modo creación; en modo edición se muestra el formulario completo directo
- Navegación libre entre pasos del wizard (el usuario puede ir a cualquier paso)
