# CV Generator — Plan de implementación

**Estado**: ✅ Implementado

## Arquitectura

```
cv-generator/page.tsx (wizard 3 pasos)
  ├── Step 1: StepJobOffer
  │     → textarea para oferta
  │     → POST /api/ai/parse → extrae requisitos
  │
  ├── Step 2: StepGoals (layout 3 columnas)
  │     ├── Col 1: Bullets checklist (colapsable por sección)
  │     ├── Col 2: CvEditor (preview en tiempo real)
  │     └── Col 3: MatchAnalysis (% match, alertas, "Continuar")
  │     └── Toolbar: [Vista previa | Ver oferta | Chat IA | Optimizar con IA]
  │           └── Optimizar → CvOptimizeDialog → diff review → apply to draftCv
  │
  └── Step 3: StepPreview
        → CvViewer (renderizado ATS)
        → Descargar PDF / Guardar en RxDB

cvs/page.tsx (viewer)
  → Lista de CVs guardados
  → CvViewer para visualización
```

## Modelo de datos (RxDB)

Collection: `cvs`

```typescript
{
  id: string
  applicationId?: string     // vínculo a postulación
  jobOffer: string           // texto de la oferta
  cv: CvData                 // CV generado (json-schema-cv-generator)
  createdAt: string
}
```

## Integración con IA

```
lib/ai.ts          → callAiProvider(model, apiKey, prompt)
lib/ai-cv.ts       → generateCv(experience, jobOffer, model, apiKey)
                   → optimizeCv(draftCv, jobOffer, context, model, apiKey)
app/api/ai/parse/  → POST route (server-side, auth protected)
```

## Patrones de UI

- **Grid 3 columnas**: `grid-cols-[300px_1fr_300px]`
- **Sticky sidebar**: `flex flex-col h-full` + `flex-1` spacer
- **Tooltips**: `group` + `group-hover:block` con posición absolute
- **Diff review**: lado a lado con badges Aceptado/Rechazado por item

## Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `app/(app)/cv-generator/page.tsx` | Wizard 3 pasos |
| `app/(app)/cvs/page.tsx` | Listado de CVs |
| `components/cv-generator/step-job-offer.tsx` | Step 1 |
| `components/cv-generator/step-goals.tsx` | Step 2 |
| `components/cv-generator/step-preview.tsx` | Step 3 |
| `components/cv-generator/cv-editor.tsx` | Editor tiempo real |
| `components/cv-generator/match-analysis.tsx` | Análisis de match |
| `components/cv-generator/cv-optimize-dialog.tsx` | Modal optimización + diff |
| `components/cv-generator/cv-preview-dialog.tsx` | Preview impresión |
| `components/cv-generator/ai-chat.tsx` | Chat con IA |
| `components/cv/cv-viewer.tsx` | Renderizado ATS |
| `lib/ai-cv.ts` | Lógica de generación |
| `lib/ai.ts` | Llamadas a providers |
| `hooks/use-cvs.ts` | Hook CRUD |
