# Feature: Experience Editor

**Estado**: ✅ Implementado (MVP)

---

## Problema

El usuario necesita mantener su experiencia laboral real como fuente de verdad para la generación de CVs. Actualmente lo hace editando un JSON manualmente, lo cual no es intuitivo.

## Goals

- Importar experiencia desde JSON (`cv-experiencia-real.json`)
- Formulario dinámico basado en `json-schema-cv-generator.json`
- CRUD completo de secciones (datos básicos, experiencia, educación, skills, liderazgo)
- Exportar en el mismo formato JSON
- Persistir localmente en RxDB

## User Stories

- Como usuario, puedo importar mi experiencia real desde un archivo JSON
- Como usuario, puedo editar cada sección de mi experiencia con formularios
- Como usuario, puedo agregar/eliminar bullets, roles, educación
- Como usuario, puedo exportar mi experiencia en formato JSON
- Como usuario, mis cambios se guardan automáticamente en RxDB

## Requerimientos funcionales

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR1 | Importar JSON de experiencia | ✅ |
| FR2 | Formulario de datos básicos (nombre, título, contacto) | ✅ |
| FR3 | Sección de experiencia laboral (roles, bullets, fechas) | ✅ |
| FR4 | Sección de educación | ✅ |
| FR5 | Sección de skills (técnicos, soft) | ✅ |
| FR6 | Sección de liderazgo | ✅ |
| FR7 | Exportar a JSON | ✅ |
| FR8 | Persistir en RxDB (collection: `experiences`) | ✅ |

## Archivos principales

```
app/(app)/experience/page.tsx
components/experience/basics-form.tsx
components/experience/experience-section.tsx
components/experience/education-section.tsx
components/experience/skills-form.tsx
components/experience/leadership-section.tsx
components/experience/bullet-list.tsx
hooks/use-experience.ts
types/experience.ts
docs/json-schema-cv-generator.json
docs/cv-experiencia-real.json
```

---

## Post-MVP (v2)

### Requerimientos funcionales (v2)

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR9 | Anonimizar datos personales en archivos de documentación | ⬜ Pendiente |

### Detalle FR9

Reemplazar información personal real en `docs/cv-experiencia-real.json` y `docs/json-schema-cv-generator.json` con placeholders genéricos. Estos archivos se usan como referencia/ejemplo y no deben contener datos identificables.

Datos a anonimizar:
- Nombres → "Nombre Ejemplo", "Apellido Ejemplo"
- Empresas → "Empresa A", "Empresa B", etc.
- Emails → "nombre@ejemplo.com"
- Teléfonos → "+XX XXXXXXXXXX"
- URLs de LinkedIn/GitHub → placeholders genéricos
- Mantener estructura, formato de bullets y métricas coherentes
