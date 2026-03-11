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
