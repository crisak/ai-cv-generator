# Data Model: 001-sync-detail-fields

## Entity Changes

### ApplicationStatus (modified)

**Current enum** (v4):
```
pending | phone_screen | technical | hr_interview | offer | rejected | accepted | withdrawn
```

**New enum** (v5):
```
pending | applied | phone_screen | technical | hr_interview | offer | rejected | accepted | withdrawn
```

**New entry**:
- `applied` — "Postulado". Represents the user having submitted their application. Positioned between `pending` (borrador) and `phone_screen`.

**Label**: "Postulado"
**Color**: `bg-blue-500 text-white` (active/positive action, distinct from `phone_screen` which is `bg-blue-400`)

### Application (modified behavior)

**`appliedAt` field**: No schema change. Field remains as `string` in RxDB. However:
- **Before**: Set to today's date when creating via form. Editable standalone in detail page.
- **After**: Derived from timeline. Computed as: first timeline entry where `status === 'applied'` → use its `date`. Not editable directly. Not set by the registration form.

**New fields shown in detail page** (already in schema, just not rendered):
- `jobOfferText` — shown in new "Oferta laboral" section
- `url` — shown as clickable link
- `workModality` — shown as badge with Spanish label
- `offerPublishedAt` — shown as formatted date

### Schema Migration v4 → v5

**Trigger**: New `applied` status in enum.

**Migration logic**:
```
For each application document:
  1. If appliedAt is non-empty AND no timeline entry has status === 'applied':
     → Push new timeline entry:
       {
         id: crypto.randomUUID(),
         status: 'applied',
         title: 'Postulado',
         date: doc.appliedAt,
         deadline: undefined,
         notes: 'Migrado automáticamente',
         files: []
       }
  2. Return doc (no field additions/removals)
```

## Computed Values (not stored)

### `getAppliedDate(timeline: TimelineEntry[]): string | null`

Finds the first timeline entry with `status === 'applied'` and returns its `date`. Returns `null` if no such entry exists.

Used in:
- Detail page quick stats bar (shows "Aplicado X días atrás")
- Detail page date display (with tooltip)
