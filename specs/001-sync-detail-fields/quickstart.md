# Quickstart: 001-sync-detail-fields

## Verification Steps

### 1. Schema migration
1. Run `pnpm dev`
2. Open browser, login with Clerk
3. Check browser DevTools → Application → IndexedDB → `cvgeneratordb-{userId}`
4. Verify the applications collection has version 5
5. If you had existing applications with `appliedAt`, verify a timeline entry with status `applied` was created

### 2. New status "Postulado"
1. Navigate to /applications
2. Click "Registrar oferta" → create a new offer
3. Verify the form does NOT have a "Fecha de aplicación" field
4. Navigate to the created offer's detail page
5. Verify status shows "Pendiente" (not "Postulado")
6. Click "Registrar paso" in the timeline
7. Select status "Postulado" → save
8. Verify the application status badge changes to "Postulado"
9. Verify "Fecha de aplicado" now appears in quick stats with the date from the timeline entry

### 3. Missing fields in detail
1. Create an offer with all fields: jobOfferText, url, workModality, offerPublishedAt, source
2. Navigate to the detail page
3. Verify:
   - "Oferta laboral" section shows the job text (collapsible)
   - URL shows as clickable link
   - Work modality shows as badge (Remoto/Presencial/Híbrido)
   - Offer published date shows formatted
   - Source shows as plain text
   - Benefits use BenefitList component (not badge chips)

### 4. Edit mode
1. Click "Editar" on the detail page
2. Verify all new fields are editable:
   - Source is a text input (not select)
   - URL is an input
   - Work modality is a select
   - Job offer text is a textarea
   - Offer published date is a date picker
3. Modify a field, save, verify changes persist

### 5. Date tooltips
1. On the detail page, hover over the help icon (?) next to each date
2. Verify each tooltip explains what the date means:
   - "Fecha de publicación" → "Fecha en que la oferta fue publicada por la empresa"
   - "Fecha de registro" → "Fecha en que registraste esta oferta en la plataforma"
   - "Fecha de aplicado" → "Fecha en que te postulaste a esta oferta"

### 6. Timeline edit fix
1. Create two timeline entries with different data
2. Click edit on the first → verify form shows correct data
3. Close the dialog
4. Click edit on the second → verify form shows the SECOND entry's data (not the first)
5. Edit notes only, save → verify other fields unchanged
