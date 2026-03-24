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
- Como usuario, puedo editar un CV guardado volviendo al workflow de Step 2 para pulirlo progresivamente
- Como usuario, al editar un CV guardado se actualiza el mismo documento (no se crea uno nuevo)
- Como usuario, si recargo o cierro la página accidentalmente durante la creación/edición de un CV, mis cambios se recuperan automáticamente al volver

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
| FR16 | Editar CV guardado desde /cvs con navegación a cv-generator en modo edición | ✅ |
| FR17 | Persistir `jobOfferText`, `updatedAt`, `isDraft` en CvDocument | ✅ |
| FR18 | Auto-save en RxDB: recuperación automática ante recargas en nuevo CV y edición | ✅ |

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
| FR14 | Unificar diseño de página con otros dominios (content width, títulos, spacing) | ✅ |
| FR15 | Shimmer loading animation durante generación IA usando ai-elements Shimmer | ⬜ Pendiente |

---

## Post-MVP (v3)

### User Stories

- Como usuario, puedo colapsar y expandir todos los toggles de la columna 1 con un solo botón
- Como usuario, puedo colapsar la columna 1 entera para darle más espacio al CV borrador
- Como usuario, al seleccionar bullets de la columna 1 cuya experiencia no existe aún en el borrador, esta aparece automáticamente en la columna 2 con todos sus datos (empresa, puesto, fechas)
- Como usuario, puedo reordenar bullets entre secciones con Drag & Drop en la columna 2
- Como usuario, puedo reordenar las skills técnicas con Drag & Drop en la columna 2
- Como usuario, cuando la IA sugiere habilidades técnicas, la respuesta se muestra como pills editables (no como textarea)
- Como usuario, el chat de IA tiene un estilo visual mejorado con ai-elements y sugerencias de prompts al iniciar conversación

### Requerimientos funcionales (v3)

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR19 | Col 1: Botón toggle para colapsar/expandir todas las secciones simultáneamente | ✅ |
| FR20 | Col 1: Panel colapsable para ceder espacio al CV borrador | ✅ |
| FR21 | Col 1→2: Sincronización automática — al seleccionar bullets cuya experiencia no está en el borrador, crear la entrada completa (empresa, puesto, fechas) en col 2 | ✅ |
| FR22 | Col 2: Drag & Drop de bullets entre secciones (incluye cross-section) | ⬜ Pendiente |
| FR23 | Col 2: Drag & Drop de pills/tags en campo Habilidades > Técnicas | ⬜ Pendiente |
| FR24 | Col 2: Respuesta IA en sección Habilidades > Técnicas mostrada como pills editables (agregar/borrar individual), no como textarea | ⬜ Pendiente |
| FR25 | Col 2: Mejorar prompt de extracción de skills técnicas — extraer exclusivamente de la oferta laboral, sin mezclar con la experiencia del usuario | ⬜ Pendiente |
| FR26 | Chat IA: Refactorizar UI usando ai-elements (estilo de respuesta + sugerencias de prompts al iniciar conversación), preservando toda la lógica de negocio actual | ⬜ Pendiente |

### Reglas de negocio (v3)

**FR21 — Sincronización Col 1→2:**
- Cuando el usuario selecciona un bullet de la columna 1 y la experiencia padre (empresa + puesto + fechas) no existe en `draftCv`, se debe insertar automáticamente esa entrada de experiencia completa en `draftCv` con el bullet seleccionado.
- El comportamiento actual (bug): los bullets quedan marcados visualmente en col 1 pero no aparecen en col 2.
- Comportamiento correcto: col 2 refleja siempre el estado real de selección.

**FR25 — Prompt skills técnicas:**
- El prompt actual mezcla la experiencia del usuario con la oferta. Debe ignorar la experiencia del usuario y extraer únicamente las habilidades mencionadas o implícitas en la oferta laboral.
- Ejemplo de instrucción al modelo: "Extrae las habilidades técnicas requeridas exclusivamente de la oferta laboral. No incluyas habilidades que solo estén en mi experiencia pero no sean relevantes para esta oferta."

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
