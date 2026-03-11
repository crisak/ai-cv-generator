# Feature: Applications Dashboard

**Estado**: ✅ Implementado (MVP)

---

## Problema

El usuario necesita centralizar el tracking de todas sus postulaciones laborales en un solo lugar, con metadatos editables para tomar mejores decisiones (salario, beneficios, ranking, estado).

## Goals

- Vista centralizada de postulaciones ordenadas por fecha
- CRUD completo de postulaciones
- Campos editables (salario, beneficios, estado, etc.)
- Enlace directo al CV generado para cada postulación
- Timeline de seguimiento por postulación

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
| FR7 | Extracción de oferta por URL via Cloudflare Browser Rendering `/markdown` API | ⬜ Pendiente |
| FR8 | Endpoint `POST /api/scrape` para URL-to-markdown (server-side) | ⬜ Pendiente |
| FR9 | UI tabs/toggle: "Texto plano" vs "URL" en formulario de creación | ⬜ Pendiente |
| FR10 | Animación Double Flash/Shimmer en campos auto-rellenados por IA | ⬜ Pendiente |
| FR11 | Rediseño de Beneficios: lista con CRUD (reemplaza tags actuales) | ⬜ Pendiente |
| FR12 | Tooltips de ayuda en campos: Fecha respuesta, Fecha postulación, Beneficios, Estado | ⬜ Pendiente |
| FR13 | Estado solo lectura en tabla de postulaciones (quitar dropdown inline) | ⬜ Pendiente |
| FR14 | Eliminar timeline header estático en página de detalle | ⬜ Pendiente |

### Requerimientos no funcionales (v2)

- Variables de entorno: `CF_ACCOUNT_ID`, `CF_API_TOKEN` para Cloudflare Browser Rendering
- Error handling: si la URL no puede procesarse, mostrar toast sugiriendo copiar-pegar como alternativa
- Animaciones con framer-motion (dependencia cross-cutting)
