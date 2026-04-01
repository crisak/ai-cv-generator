# Feature Specification: Sincronización de campos entre formulario y detalle de aplicación

**Feature Branch**: `001-sync-detail-fields`
**Created**: 2026-03-31
**Status**: Draft
**Input**: User description: "Sincronizar campos del formulario Registrar oferta con la página de detalle applications/:id, corregir campo fuente, agregar tooltips a fechas, y fix del formulario de edición del timeline"

## Contexto del problema

El formulario "Registrar oferta" fue actualizado recientemente con nuevos campos (`jobOfferText`, `url`, `workModality`, `offerPublishedAt`, `source` como texto libre), pero la página de detalle `applications/:id` no fue actualizada para reflejar estos cambios. Esto genera desincronización: datos que el usuario ingresa al crear una oferta no se ven ni se pueden editar en el detalle.

### Análisis campo por campo (formulario vs detalle)

| Campo | Formulario (Registrar oferta) | Detalle (vista) | Detalle (edición) | Estado |
| ----- | ----------------------------- | ---------------- | ------------------ | ------ |
| `company` | Text input | Texto | Input | OK |
| `position` | Text input | Texto | Input | OK |
| `source` | **Text input** (texto libre) | Texto | **Select dropdown** (hardcodeado) | BUG |
| `status` | Select (solo en edición) | Badge | Select | OK |
| `salaryOffered` | Number input | Moneda formateada | Number input | OK |
| `salaryCurrency` | Select | Texto | Select | OK |
| `benefits` | BenefitList | Badge chips | Eliminar el Badge chips en la pagina del detalle y dejar el mismo que esta en el formulario | FALTA |
| `isFavorite` | Heart toggle | Heart toggle | Heart toggle | OK |
| `jobOfferText` | Textarea (tabs texto/URL) | **NO EXISTE** | **NO EXISTE** | FALTA |
| `url` | URL input | **NO EXISTE** | **NO EXISTE** | FALTA |
| `workModality` | Select (Híbrido/Presencial/Remoto) | **NO EXISTE** | **NO EXISTE** | FALTA |
| `offerPublishedAt` | Date picker | **NO EXISTE** | **NO EXISTE** | FALTA |
| `appliedAt` | Date picker | Campo standalone + quick stats | Date input | CONFUSO |
| `nextSteps` | Text input | Texto | Input | OK |
| `notes` | Textarea | Texto | Textarea | OK |

### Bugs identificados adicionales

1. **`handleSave` incompleto**: La función de guardado en el detalle no incluye `url`, `workModality`, `offerPublishedAt` en el payload de actualización. Pasa `jobOfferText: app.jobOfferText` hardcodeado (no editable).
2. **Timeline edit no precarga datos**: `TimelineEntryForm` usa `useState(initialEntry?.field)` que solo captura el valor en el primer montaje. Cuando el usuario selecciona otro entry para editar, el Dialog ya está montado y el estado no se actualiza. Falta un `useEffect` que sincronice el estado cuando `initialEntry` cambia.
3. **Constante `SOURCES` hardcodeada**: La página de detalle tiene `const SOURCES = ['LinkedIn', 'Computrabajo', ...]` y usa un Select, pero el formulario ya usa texto libre.

### Modelo de fechas (rediseño)

El manejo actual de fechas es confuso. El formulario pide `appliedAt` (fecha de aplicación) al crear, pero registrar una oferta no significa postularse. El nuevo modelo:

- **`offerPublishedAt`** (formulario de registro): Fecha de publicación de la oferta. Útil para saber vigencia. Ya existe, OK.
- **`createdAt`** (automático): Fecha de creación del registro en el sistema. Campo de tracking interno. Ya existe, OK.
- **`appliedAt`** (derivado del timeline): Se calcula automáticamente cuando el usuario registra un evento en el timeline con estado `applied` (Postulado). Si no existe tal evento, no se muestra. NO se pide en el formulario de registro.

Esto requiere un nuevo estado `applied` en el enum `ApplicationStatus`:

**Flujo**: `pending` (borrador/oferta registrada) → `applied` (postulado) → `phone_screen` → `technical` → `hr_interview` → `offer` → `accepted`/`rejected`/`withdrawn`

El usuario puede registrar múltiples ofertas como borrador (`pending`) y postularse asíncronamente, registrando el cambio en el timeline.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver campos faltantes de la oferta en el detalle (Priority: P1)

Como usuario que registró una oferta con texto de oferta, URL, modalidad de trabajo y fecha de publicación, al navegar a `applications/:id` puedo ver toda esa información.

**Why this priority**: Es el problema central — 4 campos registrados no se muestran. El usuario pierde visibilidad sobre datos que ya ingresó.

**Independent Test**: Crear una oferta con todos los campos llenos, navegar al detalle y verificar que `jobOfferText`, `url`, `workModality` y `offerPublishedAt` se muestran.

**Acceptance Scenarios**:

1. **Given** una aplicación con `jobOfferText` lleno, **When** navego al detalle, **Then** veo una sección "Oferta laboral" con el texto completo (colapsable si es largo).
2. **Given** una aplicación con `url` registrada, **When** navego al detalle, **Then** veo el URL como enlace clickeable que abre en nueva pestaña.
3. **Given** una aplicación con `workModality` = "remote", **When** navego al detalle, **Then** veo un badge o etiqueta "Remoto" en la tarjeta de identidad o sección de detalles.
4. **Given** una aplicación con `offerPublishedAt` llena, **When** navego al detalle, **Then** veo la fecha de publicación formateada.
5. **Given** una aplicación donde `jobOfferText` está vacío, **When** navego al detalle en modo vista, **Then** la sección "Oferta laboral" no se muestra.
6. **Given** una aplicación con beneficios, **When** navego al detalle en modo vista, **Then** veo los beneficios usando el mismo componente BenefitList que el formulario (no Badge chips separados).

---

### User Story 2 - Editar todos los campos sincronizados desde el detalle (Priority: P1)

Como usuario en modo edición de `applications/:id`, puedo modificar todos los campos que existen en el formulario "Registrar oferta", incluyendo los 4 campos faltantes y el campo fuente corregido.

**Why this priority**: Sin edición, estos campos quedan congelados en el valor original. Además, `handleSave` no persiste `url`, `workModality`, `offerPublishedAt`.

**Independent Test**: Activar modo edición, modificar cada campo nuevo/corregido, guardar y verificar que los cambios persisten al recargar.

**Acceptance Scenarios**:

1. **Given** estoy en modo edición, **When** modifico "Fuente", **Then** el campo es un input de texto libre (no un select con opciones hardcodeadas).
2. **Given** estoy en modo edición, **When** modifico la URL, **Then** puedo escribir/pegar una URL y se guarda correctamente.
3. **Given** estoy en modo edición, **When** cambio la modalidad de trabajo, **Then** puedo seleccionar entre Híbrido, Presencial, Remoto.
4. **Given** estoy en modo edición, **When** edito el texto de la oferta laboral, **Then** puedo ver/modificar en un textarea.
5. **Given** estoy en modo edición, **When** cambio la fecha de publicación y guardo, **Then** el valor se persiste en la base de datos.
6. **Given** estoy en modo edición, **When** guardo cambios, **Then** el payload de actualización incluye TODOS los campos: `url`, `workModality`, `offerPublishedAt`, `jobOfferText` (editado), además de los ya existentes.

---

### User Story 3 - Nuevo estado "Postulado" y fecha de aplicación derivada del timeline (Priority: P1)

Como usuario, puedo registrar ofertas como borrador (estado `pending`) y cuando me postulo, registro un evento en el timeline con estado "Postulado" (`applied`). La fecha de ese evento se convierte automáticamente en la fecha de aplicación visible en el detalle.

**Why this priority**: El modelo actual asume que registrar = postularse, lo cual es incorrecto. El usuario necesita poder registrar ofertas como borrador y postularse asíncronamente. Esto es fundamental para el flujo correcto de la plataforma.

**Independent Test**: Crear una oferta (queda en pending), verificar que no tiene fecha de aplicado. Agregar evento "Postulado" en el timeline, verificar que la fecha de aplicado aparece automáticamente.

**Acceptance Scenarios**:

1. **Given** una oferta recién creada (estado `pending`), **When** navego al detalle, **Then** no veo "Fecha de aplicado" en las quick stats ni en detalles.
2. **Given** una oferta en estado `pending`, **When** registro un evento en el timeline con estado "Postulado", **Then** la fecha de ese evento se muestra como "Fecha de aplicado" en las quick stats.
3. **Given** el formulario de registro de nueva oferta, **When** lo abro, **Then** no hay campo "Fecha de aplicación" — solo "Fecha de publicación" de la oferta.
4. **Given** el timeline de una oferta, **When** selecciono "Nuevo estado" en el formulario del timeline, **Then** veo "Postulado" como opción entre "Pendiente" y "Llamada inicial".
5. **Given** una oferta con evento "Postulado" en el timeline, **When** el estado del timeline se actualiza, **Then** el estado principal de la aplicación cambia a `applied`.

---

### User Story 4 - Tooltips explicativos en fechas (Priority: P2)

Como usuario que ve múltiples fechas en la página de detalle, puedo ver un ícono de ayuda junto a cada fecha que al pasar el cursor muestra qué representa esa fecha.

**Why this priority**: Las fechas son confusas sin contexto. Los tooltips clarifican sin cambiar layout.

**Independent Test**: Navegar al detalle y verificar que cada fecha visible tiene tooltip explicativo.

**Acceptance Scenarios**:

1. **Given** la fecha de publicación de la oferta se muestra, **When** paso el cursor sobre el ícono de ayuda, **Then** veo "Fecha en que la oferta fue publicada por la empresa".
2. **Given** la fecha de registro se muestra (`createdAt`), **When** paso el cursor sobre el ícono de ayuda, **Then** veo "Fecha en que registraste esta oferta en la plataforma".
3. **Given** la fecha de postulación se muestra en las quick stats (derivada del timeline), **When** paso el cursor sobre el ícono de ayuda, **Then** veo "Fecha en que te postulaste a esta oferta".

---

### User Story 5 - Fix precarga de datos al editar paso del timeline (Priority: P2)

Como usuario que quiere editar un paso existente del timeline, al hacer clic en "Editar" el formulario se abre con todos los datos del paso seleccionado ya cargados.

**Why this priority**: Es un bug funcional confirmado — el formulario usa `useState` que solo captura el valor inicial en el primer montaje del componente. Cuando `initialEntry` cambia, el estado interno no se actualiza.

**Independent Test**: Crear dos pasos del timeline con datos diferentes, editar el primero (verificar precarga), cerrar, editar el segundo (verificar que muestra datos del segundo).

**Acceptance Scenarios**:

1. **Given** un paso con título "Entrevista técnica" y notas "Con el CTO", **When** hago clic en editar, **Then** el formulario muestra "Entrevista técnica" en título y "Con el CTO" en notas.
2. **Given** un paso con deadline y archivos adjuntos, **When** hago clic en editar, **Then** el formulario muestra la fecha límite y los archivos.
3. **Given** edité el paso A y cierro el dialog, **When** hago clic en editar el paso B, **Then** el formulario muestra los datos del paso B (no los del paso A).
4. **Given** estoy editando un paso, **When** modifico solo las notas y guardo, **Then** los demás campos mantienen sus valores originales.

---

### Edge Cases

- `jobOfferText` extremadamente largo (>5000 caracteres): se muestra colapsado con opción de expandir.
- Aplicación creada antes de migración sin campos nuevos: campos vacíos no se muestran en modo vista; en modo edición aparecen vacíos y editables.
- Editar un paso del timeline con solo campos mínimos (título + fecha): campos opcionales aparecen vacíos en el formulario.
- URL inválida: se muestra como texto plano en lugar de enlace clickeable.
- `workModality` vacío: no se muestra badge de modalidad en modo vista.
- Aplicaciones existentes con `appliedAt` poblado pero sin evento "Postulado" en timeline: migración debe crear un evento de timeline retroactivo o mostrar la fecha legacy como fallback.
- Nuevo estado `applied` en el enum: la migración del schema debe ser compatible con datos existentes.

## Requirements *(mandatory)*

### Functional Requirements

**Sincronización de campos (detalle)**:

- **FR-001**: La página de detalle DEBE mostrar `jobOfferText` en una sección dedicada "Oferta laboral", colapsable si el texto supera una longitud razonable.
- **FR-002**: La página de detalle DEBE mostrar `url` como enlace clickeable que abre en nueva pestaña.
- **FR-003**: La página de detalle DEBE mostrar `workModality` con su etiqueta en español (Híbrido/Presencial/Remoto).
- **FR-004**: La página de detalle DEBE mostrar `offerPublishedAt` como fecha formateada.
- **FR-005**: El campo `source` en modo edición del detalle DEBE ser un input de texto libre. Se DEBE eliminar la constante `SOURCES` hardcodeada y el Select dropdown.
- **FR-006**: En modo edición, TODOS los campos del formulario "Registrar oferta" DEBEN ser editables en la página de detalle.
- **FR-007**: La función de guardado DEBE incluir `url`, `workModality`, `offerPublishedAt` y `jobOfferText` (editado) en el payload de actualización.
- **FR-008**: Los beneficios en modo vista del detalle DEBEN mostrarse usando el mismo componente que el formulario (BenefitList en modo lectura), no Badge chips separados.

**Modelo de fechas y estado "Postulado"**:

- **FR-009**: Se DEBE agregar el estado `applied` ("Postulado") al enum de estados, posicionado entre `pending` y `phone_screen`.
- **FR-010**: El formulario de registro de nueva oferta NO DEBE pedir "Fecha de aplicación". Solo DEBE pedir "Fecha de publicación" (`offerPublishedAt`).
- **FR-011**: La fecha de aplicado (`appliedAt`) DEBE derivarse automáticamente del timeline: cuando se registra un evento con estado `applied`, la fecha de ese evento se convierte en `appliedAt`.
- **FR-012**: Si no existe un evento con estado `applied` en el timeline, la fecha de aplicado NO DEBE mostrarse en el detalle.
- **FR-013**: La fecha `createdAt` DEBE mostrarse en el detalle como "Fecha de registro" (campo informativo, no editable).
- **FR-014**: El campo "Fecha de aplicación" DEBE eliminarse como campo editable standalone de la sección "Detalles" y del formulario de registro.

**Tooltips y UX**:

- **FR-015**: Cada fecha visible en la página de detalle DEBE tener un ícono de ayuda con tooltip que explique su significado.
- **FR-016**: Los campos vacíos u opcionales no completados NO DEBEN mostrarse en modo vista (solo aparecen en modo edición como campos vacíos editables).
- **FR-017**: La UI del detalle DEBE mantener coherencia visual con el resto de la plataforma.

**Bug fix timeline**:

- **FR-018**: El formulario de edición del timeline DEBE sincronizar su estado interno cuando la prop `initialEntry` cambia, para que al editar distintos entries el formulario siempre refleje los datos del entry seleccionado.

### Key Entities

- **Application**: Entidad principal. Campos: company, position, source, status, url, workModality, offerPublishedAt, jobOfferText, salaryOffered, salaryCurrency, benefits, isFavorite, timeline, appliedAt (ahora derivado), nextSteps, notes, cvId, createdAt, updatedAt.
- **TimelineEntry**: Entrada del historial (id, status, title, date, deadline, notes, files).
- **ApplicationStatus**: Enum con nuevo estado `applied` entre `pending` y `phone_screen`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los campos presentes en el formulario "Registrar oferta" son visibles en la página de detalle cuando tienen valor.
- **SC-002**: El 100% de los campos son editables desde la página de detalle en modo edición, y la función de guardado persiste todos los campos correctamente.
- **SC-003**: Todas las fechas visibles en la página de detalle tienen tooltip de ayuda explicativo.
- **SC-004**: Al editar cualquier paso del timeline, el formulario muestra el 100% de los datos existentes del paso seleccionado.
- **SC-005**: El campo "Fuente" funciona como texto libre en todas las vistas.
- **SC-006**: La fecha de aplicado solo aparece cuando existe un evento "Postulado" en el timeline; no aparece en ofertas sin postulación.
- **SC-007**: El nuevo estado "Postulado" aparece como opción en el timeline y actualiza correctamente el estado de la aplicación.

## Assumptions

- Se requiere una migración del schema RxDB (v4 → v5) para agregar `applied` al enum de estados.
- Para aplicaciones existentes con `appliedAt` poblado pero sin evento "Postulado" en el timeline, se creará un evento de timeline retroactivo durante la migración, o se usará `appliedAt` como fallback visual.
- El campo `appliedAt` se mantiene en el modelo de datos por compatibilidad, pero su valor se deriva del timeline en lugar de ser un campo editable directo.
- El formulario de registro actual tiene un campo `appliedAt` con default a "hoy" que DEBE eliminarse.
- El bug del timeline es un problema de ciclo de vida de React (`useState` vs `useEffect`), no un problema de datos.
- Los tooltips se implementan usando componentes existentes del sistema de diseño.
- Los cambios afectan: `app/(app)/applications/[id]/page.tsx`, `components/applications/timeline-entry-form.tsx`, `components/applications/application-form.tsx`, `types/cv.ts`, `lib/db/schemas.ts`, `lib/db/index.ts` (migración), `hooks/use-applications.ts`.
