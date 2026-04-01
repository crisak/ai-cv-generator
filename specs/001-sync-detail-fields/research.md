# Research: 001-sync-detail-fields

## Decision 1: Where to add `applied` status

**Decision**: Add `applied` to all 4 locations: `types/cv.ts` (type + labels + colors), `lib/db/schemas.ts` (enum), `hooks/use-applications.ts` (STATUS_LABELS).

**Rationale**: The ApplicationStatus type is defined in `types/cv.ts` and mirrored in the RxDB schema enum. All consumers (labels, colors, hooks) must be updated atomically.

**Files to modify**:
- `types/cv.ts:83-113` — Add `'applied'` to union type, labels, colors
- `lib/db/schemas.ts:79-91` — Add `'applied'` to schema enum
- `hooks/use-applications.ts:33-42` — Add `applied` label, fix `pending` label ('Postulado' → 'Pendiente')

**Bug found**: `STATUS_LABELS` in `hooks/use-applications.ts` has `pending: 'Postulado'` which is incorrect — `APPLICATION_STATUS_LABELS` in `types/cv.ts` has `pending: 'Pendiente'`. The hook's label will be corrected when adding `applied: 'Postulado'`.

## Decision 2: RxDB migration v4 → v5

**Decision**: Add migration 5 that handles the new `applied` status. For existing documents with `appliedAt` populated, create a retroactive timeline entry with status `applied`.

**Rationale**: Existing data with `appliedAt` represents users who already applied. Creating a timeline entry preserves this information in the new model. The migration pattern is well-established (numbered functions in `migrationStrategies` object).

**Migration logic**:
```
v4 → v5:
- If doc.appliedAt exists and is non-empty:
  - Add timeline entry { id: uuid, status: 'applied', title: 'Postulado', date: doc.appliedAt, notes: '', files: [] }
  - Keep appliedAt field as-is for backward compat
- No field additions/removals needed
```

**Alternatives considered**: Using `appliedAt` as visual fallback without migration — rejected because it creates inconsistency between old and new data.

## Decision 3: Deriving `appliedAt` from timeline

**Decision**: Compute `appliedAt` by finding the first timeline entry with `status === 'applied'` and using its `date`. Do this as a computed value in the detail page, not as a stored field.

**Rationale**: Keeping it computed avoids sync issues. The timeline is the source of truth for dates. The `appliedAt` field in the schema remains for backward compatibility but is no longer written by the form.

**Implementation**: Helper function `getAppliedDate(timeline: TimelineEntry[]): string | null` that finds the first `applied` entry's date.

## Decision 4: BenefitList read-only mode

**Decision**: Add an optional `readOnly` prop to the existing `BenefitList` component. When `readOnly=true`, hide the add input, edit buttons, and delete buttons.

**Rationale**: The user explicitly requested "dejar el mismo que está en el formulario" for the detail view. Adding a `readOnly` prop is minimal change — the component already uses conditional rendering. A separate component would be over-engineering.

**Alternatives considered**: Keep separate span-based rendering — rejected because user specifically requested consistency with the form component.

## Decision 5: Tooltip pattern for dates

**Decision**: Use the existing `group` + `group-hover:block` + `HelpCircle` pattern already established in `application-form.tsx`.

**Rationale**: The project already uses this pattern (2 instances in the form). It's pure CSS (no JS), consistent with the codebase, and doesn't require the shadcn Tooltip component (which uses Radix). Constitution principle V (Simplicidad) says to use existing patterns.

**Alternatives considered**: shadcn/ui Tooltip component — available but not used in forms, would be mixing two tooltip patterns.

## Decision 6: `appliedAt` field removal from form

**Decision**: Remove `appliedAt` from the create form's Zod schema, default values, and rendered fields. Keep it in the edit form read-only (derived from timeline). Remove it from the detail page's editable fields.

**Rationale**: User specified that `appliedAt` should not be asked in the registration form. It should only exist as a derived value from the timeline.

**Files to modify**:
- `components/applications/application-form.tsx:167-192` (schema), `230-246` (defaults), `1005-1018` (render)
- `app/(app)/applications/[id]/page.tsx:95-97` (state), `367-386` (render)

## Decision 7: Timeline form pre-fill fix

**Decision**: Add a `useEffect` that watches `initialEntry` and `open` props to resync all internal state when they change.

**Rationale**: The bug is that `useState` only captures the initial value on first mount. The Dialog component stays mounted, so when `initialEntry` changes (user clicks edit on a different entry), the state doesn't update. Adding a `useEffect` that runs when `initialEntry` or `open` changes will resync state.

**Implementation**: Single `useEffect` in `TimelineEntryForm` with `[initialEntry, open]` dependency array that calls the same logic as `resetForm()`.
