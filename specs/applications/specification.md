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
