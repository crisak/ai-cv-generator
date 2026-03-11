# Feature: CV Generator + Viewer

**Estado**: ✅ Implementado (MVP)

---

## Problema

El usuario necesita generar CVs optimizados para ATS a partir de ofertas laborales, con capacidad de edición, revisión de sugerencias de IA, y descarga en PDF. El proceso manual toma +1 hora por CV.

## Goals

- Workflow de 3 pasos: Oferta → Selección de bullets → Resultado final
- AI genera CV basado en experiencia real + oferta laboral
- Preview y edición de goals/bullets antes de generar
- Optimización con IA con diff review (aceptar/rechazar por cambio)
- Viewer de CVs guardados con descarga a PDF
- Match analysis en tiempo real (keywords encontradas vs faltantes)

## User Stories

- Como usuario, pego una oferta laboral y la IA extrae los requisitos clave
- Como usuario, selecciono qué bullets incluir de mi experiencia real
- Como usuario, veo en tiempo real cómo queda mi CV mientras selecciono bullets
- Como usuario, veo el % de match con la oferta y qué keywords faltan
- Como usuario, puedo pedir a la IA que optimice mis bullets para la oferta
- Como usuario, reviso las sugerencias de la IA en un diff side-by-side y acepto/rechazo cada una
- Como usuario, descargo el CV final como PDF optimizado para ATS
- Como usuario, guardo el CV en la app y lo vinculo a una postulación
- Como usuario, puedo ver mis CVs guardados desde `/cvs`

## Requerimientos funcionales

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR1 | Step 1: Input de oferta laboral + parsing con IA | ✅ |
| FR2 | Step 2: Layout 3 columnas (bullets / CV editor / match analysis) | ✅ |
| FR3 | Step 2: Checklist de bullets por sección colapsable | ✅ |
| FR4 | Step 2: Editor de CV en tiempo real (columna 2) | ✅ |
| FR5 | Step 2: Match analysis con % y keywords (columna 3) | ✅ |
| FR6 | Step 2: Alertas accordion (páginas, ATS, keywords faltantes) | ✅ |
| FR7 | Step 2: Toolbar (vista previa, ver oferta, chat IA, optimizar) | ✅ |
| FR8 | Step 2: Optimizar con IA → context modal → diff review → apply | ✅ |
| FR9 | Step 3: Renderizado ATS del CV final | ✅ |
| FR10 | Step 3: Descarga/impresión a PDF | ✅ |
| FR11 | Step 3: Guardar CV en RxDB con vínculo a postulación | ✅ |
| FR12 | Viewer: Lista de CVs guardados | ✅ |
| FR13 | Viewer: Visualización del CV en formato web | ✅ |

## Reglas de generación de CV (IA)

- Fórmula por bullet: **Verbo de acción (pasado) + Qué + Cómo + Resultado cuantificable**
- Verbos fuertes: Diseñé, Implementé, Optimicé, Reduje, Migré, Lideré
- Métricas siempre que sea posible (%, tiempos, costos, usuarios)
- Max 4-5 bullets en rol más reciente, 3 en los demás
- Priorizar contenido relevante para la oferta
- Max 1 página PDF
- Todo en español
- Match directo de requisitos con bullets/skills

## Layout Step 2

```
grid-cols-[300px_1fr_300px] h-[calc(100vh-280px)]
```

- Columna 1: Bullets checklist (colapsable por sección)
- Columna 2: CV editor en tiempo real
- Columna 3: Match analysis + alertas + botón "Continuar"

## Flujo de optimización con IA

```
Click "Optimizar con IA"
  → Context modal (textarea + chips de sugerencias)
  → Confirmar → IA reescribe bullets + reordena skills
  → Diff review dialog (Before | IA sugiere)
  → Toggle aceptar/rechazar por cambio
  → Aplicar → actualiza draftCv en Step 2 (NO avanza a Step 3)
```

---

## Post-MVP (v2)

### User Stories

- Como usuario, la página de cv-generator tiene el mismo estilo visual (ancho de contenido, títulos, espaciado) que Postulaciones y Mi Experiencia
- Como usuario, veo una animación shimmer elegante mientras la IA genera o optimiza mi CV

### Requerimientos funcionales (v2)

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR14 | Unificar diseño de página con otros dominios (content width, títulos, spacing) | ⬜ Pendiente |
| FR15 | Shimmer loading animation durante generación IA usando ai-elements Shimmer | ⬜ Pendiente |

---

## Archivos principales

```
app/(app)/cv-generator/page.tsx
app/(app)/cvs/page.tsx
components/cv-generator/step-job-offer.tsx
components/cv-generator/step-goals.tsx
components/cv-generator/step-preview.tsx
components/cv-generator/cv-editor.tsx
components/cv-generator/match-analysis.tsx
components/cv-generator/cv-optimize-dialog.tsx
components/cv-generator/cv-preview-dialog.tsx
components/cv-generator/ai-chat.tsx
components/cv/cv-viewer.tsx
hooks/use-cvs.ts
lib/ai-cv.ts
lib/ai.ts
types/cv.ts
```
