# Tasks: Sincronización de campos entre formulario y detalle de aplicación

**Input**: Design documents from `/specs/001-sync-detail-fields/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Tests**: No test tasks — testing is config-only in this project (Vitest without implementation).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Schema changes, type updates, and migration that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 [P] Add `applied` status to `ApplicationStatus` type, `APPLICATION_STATUS_LABELS` (applied: 'Postulado'), and `APPLICATION_STATUS_COLORS` (applied: 'bg-blue-500 text-white') in `types/cv.ts`
- [x] T002 [P] Add `applied` to schema enum in `lib/db/schemas.ts` (between `pending` and `phone_screen`), bump schema version from 4 to 5
- [x] T003 [P] Fix `STATUS_LABELS` in `hooks/use-applications.ts`: change `pending: 'Postulado'` → `pending: 'Pendiente'`, add `applied: 'Postulado'`
- [x] T004 Add migration strategy 5 (v4→v5) in `lib/db/index.ts`: for docs with non-empty `appliedAt` and no `applied` timeline entry, create retroactive timeline entry `{ id: uuid, status: 'applied', title: 'Postulado', date: doc.appliedAt, notes: 'Migrado automáticamente', files: [] }`
- [x] T005 Export helper function `getAppliedDate(timeline: TimelineEntry[]): string | null` in `hooks/use-applications.ts` — finds first timeline entry with `status === 'applied'` and returns its `date`

**Checkpoint**: Schema v5 ready, all types updated, migration works. User story implementation can begin.

---

## Phase 2: User Story 1 — Ver campos faltantes en detalle (Priority: P1) 🎯 MVP

**Goal**: Show all missing fields (`jobOfferText`, `url`, `workModality`, `offerPublishedAt`) and fix `benefits` display in the detail page view mode.

**Independent Test**: Create an offer with all fields filled, navigate to detail, verify all fields are visible.

### Implementation for User Story 1

- [x] T006 [US1] Add "Oferta laboral" section in view mode in `app/(app)/applications/[id]/page.tsx`: show `jobOfferText` in collapsible container (collapsed by default if >500 chars), only render if non-empty. Add collapsible state with ChevronDown/ChevronUp toggle.
- [x] T007 [US1] Add `url` display in view mode in `app/(app)/applications/[id]/page.tsx`: show as clickable external link with ExternalLink icon, target="_blank", rel="noopener noreferrer". Only show if non-empty.
- [x] T008 [US1] Add `workModality` display in view mode in `app/(app)/applications/[id]/page.tsx`: import `WORK_MODALITY_LABELS` from `types/cv.ts`, show as badge with Spanish label. Only show if non-empty.
- [x] T009 [US1] Add `offerPublishedAt` display in view mode in `app/(app)/applications/[id]/page.tsx`: show as formatted date using `toLocaleDateString('es-CO')`. Only show if non-empty.
- [x] T010 [US1] Add `readOnly` prop to `BenefitList` component in `components/applications/benefit-list.tsx`: when `readOnly=true`, hide add input, hide edit/delete buttons on items. Keep existing behavior when `readOnly` is false/undefined.
- [x] T011 [US1] Replace span-based benefit rendering in view mode with `<BenefitList readOnly value={app.benefits} onChange={() => {}} />` in `app/(app)/applications/[id]/page.tsx`

**Checkpoint**: All fields visible in detail view mode. Benefits use unified BenefitList component.

---

## Phase 3: User Story 2 — Editar campos sincronizados desde detalle (Priority: P1)

**Goal**: Make all fields editable from the detail page, fix `source` to text input, fix `handleSave` to persist all fields.

**Independent Test**: Enable edit mode, modify each new field, save, verify changes persist.

### Implementation for User Story 2

- [x] T012 [US2] Add state variables for new editable fields in `app/(app)/applications/[id]/page.tsx`: `jobOfferText`, `url`, `workModality`, `offerPublishedAt`. Initialize from `app` in existing `useEffect`. Add to `cancelEdit` reset logic.
- [x] T013 [US2] Replace `source` Select dropdown with text Input in edit mode in `app/(app)/applications/[id]/page.tsx`. Remove `SOURCES` constant. Change view mode `source` display to match (already plain text).
- [x] T014 [US2] Add editable fields in edit mode in `app/(app)/applications/[id]/page.tsx`: `jobOfferText` → Textarea, `url` → Input type="url", `workModality` → Select with `WORK_MODALITY_LABELS`, `offerPublishedAt` → Input type="date"
- [x] T015 [US2] Fix `handleSave` in `app/(app)/applications/[id]/page.tsx`: add `url`, `workModality`, `offerPublishedAt`, `jobOfferText` (from state) to `updateApplication` payload. Remove hardcoded `jobOfferText: app.jobOfferText`.

**Checkpoint**: All fields editable and saveable from detail page.

---

## Phase 4: User Story 3 — Estado "Postulado" y fecha de aplicación derivada (Priority: P1)

**Goal**: New `applied` status works end-to-end. `appliedAt` derived from timeline instead of form field.

**Independent Test**: Create offer (pending), verify no applied date. Add "Postulado" timeline entry, verify applied date appears automatically.

### Implementation for User Story 3

- [x] T016 [US3] Remove `appliedAt` field from create form in `components/applications/application-form.tsx`: remove from Zod schema default (or set to empty string), remove date picker render block (lines ~1005-1018). Keep in form reset for edit mode compatibility but do not render.
- [x] T017 [US3] Update quick stats bar in `app/(app)/applications/[id]/page.tsx`: replace `appliedAt`/`daysSince(app.appliedAt)` logic with `getAppliedDate(app.timeline)`. Only show "Aplicado X días atrás" if `getAppliedDate` returns non-null. Import `getAppliedDate` from `hooks/use-applications`.
- [x] T018 [US3] Remove `appliedAt` as editable standalone field from detail page "Detalles" section in `app/(app)/applications/[id]/page.tsx`. Remove `appliedAt` state variable and its initialization/cancel logic. Remove from `handleSave` payload.
- [x] T019 [US3] Add `createdAt` display in detail page "Detalles" section in `app/(app)/applications/[id]/page.tsx`: show as "Fecha de registro" with formatted date, non-editable in both view and edit modes.

**Checkpoint**: `appliedAt` no longer in form or detail edit. Applied date derived from timeline. `createdAt` visible.

---

## Phase 5: User Story 4 — Tooltips en fechas (Priority: P2)

**Goal**: Every visible date in the detail page has a help icon with tooltip explaining its meaning.

**Independent Test**: Navigate to detail, hover over help icon next to each date, verify tooltip text.

### Implementation for User Story 4

- [x] T020 [US4] Add `HelpCircle` import and date tooltip pattern to `app/(app)/applications/[id]/page.tsx`. Create reusable inline pattern using `group` + `group-hover:block` + absolute positioned span (same pattern as `components/applications/application-form.tsx` lines 776-784).
- [x] T021 [US4] Add tooltip to `offerPublishedAt` label: "Fecha en que la oferta fue publicada por la empresa" in `app/(app)/applications/[id]/page.tsx`
- [x] T022 [US4] Add tooltip to `createdAt` label: "Fecha en que registraste esta oferta en la plataforma" in `app/(app)/applications/[id]/page.tsx`
- [x] T023 [US4] Add tooltip to applied date in quick stats: "Fecha en que te postulaste a esta oferta" in `app/(app)/applications/[id]/page.tsx`

**Checkpoint**: All dates have explanatory tooltips.

---

## Phase 6: User Story 5 — Fix precarga del timeline edit (Priority: P2)

**Goal**: Timeline entry form pre-fills correctly when editing any entry, even when switching between entries.

**Independent Test**: Create two timeline entries, edit first (verify data), close, edit second (verify correct data).

### Implementation for User Story 5

- [x] T024 [US5] Add `useEffect` with `[initialEntry, open]` dependency array in `components/applications/timeline-entry-form.tsx`. When deps change and `open` is true: sync all state (title, status, date, deadline, notes, files) from `initialEntry` or defaults. This replaces the `useState` initial values as the source of truth for edit mode.

**Checkpoint**: Timeline edit form correctly pre-fills for any entry.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and consistency improvements.

- [x] T025 [P] Remove unused `appliedAt` state variable from `app/(app)/applications/[id]/page.tsx` if not already removed in T018
- [x] T026 [P] Verify `timeline-view.tsx` renders `applied` status with correct dot color (should pick up from existing status color mapping, add if missing) in `components/applications/timeline-view.tsx`
- [x] T027 Run `pnpm build` to verify no TypeScript errors from status enum changes
- [ ] T028 Run quickstart.md verification flow end-to-end (manual test per `specs/001-sync-detail-fields/quickstart.md`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately. BLOCKS all user stories.
- **User Story 1 (Phase 2)**: Depends on Phase 1 (needs `WORK_MODALITY_LABELS`, `readOnly` prop)
- **User Story 2 (Phase 3)**: Depends on Phase 2 (builds on view mode fields to add edit mode)
- **User Story 3 (Phase 4)**: Depends on Phase 1 (`applied` status, `getAppliedDate`). Can run in parallel with US1/US2 for type/hook changes, but detail page edits may conflict — recommend sequential after US2.
- **User Story 4 (Phase 5)**: Depends on Phase 4 (needs dates finalized before adding tooltips)
- **User Story 5 (Phase 6)**: Independent — only touches `timeline-entry-form.tsx`. Can run in parallel with US1-US4.
- **Polish (Phase 7)**: Depends on all user stories complete.

### Recommended Execution Order

```
Phase 1 (Foundational) → Phase 2 (US1) → Phase 3 (US2) → Phase 4 (US3) → Phase 5 (US4) → Phase 7 (Polish)
                                                                                    ↗
Phase 6 (US5) — can run anytime after Phase 1 ─────────────────────────────────────
```

### Parallel Opportunities

```bash
# Phase 1: All type changes in parallel (different files)
T001 (types/cv.ts) | T002 (lib/db/schemas.ts) | T003 (hooks/use-applications.ts)

# Phase 6 can run in parallel with Phases 2-5 (different file)
T024 (timeline-entry-form.tsx) | T006-T023 (page.tsx + benefit-list.tsx)

# Phase 7: Cleanup tasks in parallel
T025 | T026
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3)

1. Complete Phase 1: Foundational (schema, types, migration)
2. Complete Phase 2: US1 — view missing fields
3. Complete Phase 3: US2 — edit all fields
4. Complete Phase 4: US3 — applied status + date derivation
5. **STOP and VALIDATE**: All fields visible and editable, applied date works
6. This delivers the core value — full form/detail sync

### Incremental Delivery

7. Add Phase 5: US4 — tooltips on dates
8. Add Phase 6: US5 — timeline edit fix
9. Complete Phase 7: Polish and final verification

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All changes modify existing files — no new files created
- The main bottleneck is `app/(app)/applications/[id]/page.tsx` which is touched by US1, US2, US3, US4 — these MUST be sequential
- US5 (timeline fix) is fully independent and can be done anytime
- Commit after each phase or logical group
