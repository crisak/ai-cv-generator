# Implementation Plan: Sincronización de campos entre formulario y detalle

**Branch**: `001-sync-detail-fields` | **Date**: 2026-04-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sync-detail-fields/spec.md`

## Summary

Sincronizar la página de detalle `applications/:id` con el formulario "Registrar oferta" que fue actualizado recientemente. Incluye: mostrar 4 campos faltantes (`jobOfferText`, `url`, `workModality`, `offerPublishedAt`), corregir campo `source` (select → texto libre), unificar `BenefitList`, agregar nuevo estado `applied` ("Postulado") con fecha de aplicación derivada del timeline, tooltips en fechas, y fix de precarga en el formulario de edición del timeline.

## Technical Context

**Language/Version**: TypeScript 5.x + React 19 + Next.js 16
**Primary Dependencies**: RxDB v15 (Dexie), Zod, React Hook Form, shadcn/ui, Lucide icons
**Storage**: RxDB v15 (IndexedDB via Dexie) — local-first, sin backend
**Testing**: Vitest (config only, sin implementación)
**Target Platform**: Web browser (desktop/mobile)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: N/A — UI changes only, no new data processing
**Constraints**: Local-first, offline-capable, max 1 page PDF for CVs
**Scale/Scope**: Single user, ~50 applications max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First | PASS | All changes are client-side. RxDB remains source of truth. Schema migration adds new enum value, no backend. |
| II. Modularidad por Dominio | PASS | Changes are within the `applications` bounded context. Files modified are in `components/applications/`, `app/(app)/applications/`, `hooks/use-applications`, `types/cv.ts`, `lib/db/`. |
| III. AI como Herramienta | N/A | No AI generation changes. |
| IV. ATS-First y Español | PASS | New status label "Postulado" is in Spanish. All tooltips in Spanish. |
| V. Simplicidad (YAGNI) | PASS | Using existing tooltip pattern (group-hover), adding `readOnly` prop to existing BenefitList instead of new component, minimal migration. |

**Post-design re-check**: All gates still pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-sync-detail-fields/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 research decisions
├── data-model.md        # Entity changes and migration
├── quickstart.md        # Verification steps
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (files to modify)

```text
types/
└── cv.ts                          # ApplicationStatus type + labels + colors

lib/
├── db/
│   ├── schemas.ts                 # RxDB schema enum + ApplicationDocument
│   └── index.ts                   # Migration v4→v5

hooks/
└── use-applications.ts            # STATUS_LABELS + appliedAt derivation helper

components/
└── applications/
    ├── application-form.tsx        # Remove appliedAt from create form
    ├── benefit-list.tsx            # Add readOnly prop
    ├── timeline-entry-form.tsx     # Fix useEffect for initialEntry sync
    └── timeline-view.tsx           # New status color for 'applied'

app/
└── (app)/
    └── applications/
        └── [id]/
            └── page.tsx            # Main target: add missing fields, tooltips, fix save
```

**Structure Decision**: Existing Next.js App Router structure. No new files needed — all changes are modifications to existing files within the `applications` domain.

## Implementation Details

### Phase 1: Schema & Type Changes (blocking)

**1.1 Add `applied` to ApplicationStatus**

File: `types/cv.ts`
- Add `| 'applied'` to the union type (between `pending` and `phone_screen`)
- Add `applied: 'Postulado'` to `APPLICATION_STATUS_LABELS`
- Add `applied: 'bg-blue-500 text-white'` to `APPLICATION_STATUS_COLORS`

File: `hooks/use-applications.ts`
- Add `applied: 'Postulado'` to `STATUS_LABELS`
- Fix `pending: 'Postulado'` → `pending: 'Pendiente'` (existing bug)

File: `lib/db/schemas.ts`
- Add `'applied'` to the status enum array (line ~82, between `pending` and `phone_screen`)
- Bump schema version from 4 to 5

**1.2 Migration v4 → v5**

File: `lib/db/index.ts`
- Add migration strategy 5:
  - If `appliedAt` is non-empty and no timeline entry has `status === 'applied'`:
    - Push new timeline entry `{ id: uuid, status: 'applied', title: 'Postulado', date: appliedAt, notes: 'Migrado automáticamente', files: [] }`
  - Return doc unchanged otherwise

**1.3 Helper: getAppliedDate**

File: `hooks/use-applications.ts`
- Export function `getAppliedDate(timeline: TimelineEntry[]): string | null`
- Finds first timeline entry with `status === 'applied'`, returns its `date`

### Phase 2: Form Changes

**2.1 Remove `appliedAt` from registration form**

File: `components/applications/application-form.tsx`
- Remove `appliedAt` from Zod schema (or keep as optional hidden field for edit mode compatibility)
- Remove `appliedAt` default value (no longer defaults to today)
- Remove the `appliedAt` date picker render block (lines ~1005-1018, edit-mode only section)
- Keep `appliedAt` in the form reset for edit mode (reads existing value) but do not render it

**2.2 Add readOnly prop to BenefitList**

File: `components/applications/benefit-list.tsx`
- Add optional `readOnly?: boolean` prop
- When `readOnly=true`: hide add input, hide edit/delete buttons
- Existing behavior unchanged when `readOnly` is false/undefined

**2.3 Fix TimelineEntryForm pre-fill**

File: `components/applications/timeline-entry-form.tsx`
- Add `useEffect` with `[initialEntry, open]` dependencies
- When `initialEntry` changes or dialog opens: resync all state (title, status, date, deadline, notes, files) from `initialEntry`
- Remove redundant initial values from `useState` calls (they'll be set by the effect)

### Phase 3: Detail Page — View Mode

**3.1 Add missing fields to view mode**

File: `app/(app)/applications/[id]/page.tsx`

New section "Oferta laboral" (before or after "Detalles"):
- Show `jobOfferText` in a collapsible container (collapsed by default if >500 chars)
- Only render section if `jobOfferText` is non-empty

In company identity card or "Detalles" section:
- Show `url` as clickable external link with ExternalLink icon
- Show `workModality` as badge using `WORK_MODALITY_LABELS`

In "Detalles" section:
- Show `offerPublishedAt` as formatted date
- Show `createdAt` as "Fecha de registro"
- Remove `appliedAt` as standalone field
- Change `source` from Select to plain text display

In quick stats bar:
- Replace `appliedAt` logic with `getAppliedDate(timeline)` — only show if `applied` entry exists
- Show `createdAt` as fallback stat

Benefits in "Compensación":
- Replace span-based rendering with `<BenefitList readOnly value={app.benefits} onChange={() => {}} />`

**3.2 Date tooltips**

Add `HelpCircle` icon with group-hover tooltip next to each date:
- `offerPublishedAt`: "Fecha en que la oferta fue publicada por la empresa"
- `createdAt`: "Fecha en que registraste esta oferta en la plataforma"
- Applied date (from timeline): "Fecha en que te postulaste a esta oferta"

Use existing pattern from `application-form.tsx` (group + group-hover:block + absolute positioned span).

### Phase 4: Detail Page — Edit Mode

**4.1 Add missing fields to edit mode**

File: `app/(app)/applications/[id]/page.tsx`

Add state variables:
- `jobOfferText`, `url`, `workModality`, `offerPublishedAt`

Initialize from `app` in `useEffect` (existing pattern).

Add editable fields:
- `jobOfferText` → Textarea
- `url` → Input (type="url")
- `workModality` → Select with `WORK_MODALITY_LABELS`
- `offerPublishedAt` → Input (type="date")
- `source` → Input (type="text") — replace existing Select

Remove:
- `appliedAt` state variable and editable field
- `SOURCES` constant
- Select dropdown for source

**4.2 Fix handleSave**

Update the `updateApplication` call to include ALL fields:
- Add `url`, `workModality`, `offerPublishedAt`, `jobOfferText` (from state, not hardcoded)
- Remove `appliedAt` from save payload (no longer editable)

**4.3 Fix cancelEdit**

Update `cancelEdit` to reset new state variables from `app`.

## Complexity Tracking

No constitution violations. All changes use existing patterns and components.
