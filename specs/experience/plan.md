# Experience — Plan de implementación

**Estado**: ✅ Implementado

## Arquitectura

```
page.tsx
  → BasicsForm (datos personales)
  → ExperienceSection (roles laborales + BulletList)
  → EducationSection (formación)
  → SkillsForm (técnicos + soft)
  → LeadershipSection (liderazgo + BulletList)
  → Import/Export JSON buttons
```

## Modelo de datos (RxDB)

Collection: `experiences`

Sigue el schema definido en `docs/json-schema-cv-generator.json`:

```typescript
{
  id: string
  basics: { name, title, email, phone, location, linkedin, github }
  experience: [{ company, position, startDate, endDate, bullets }]
  education: [{ institution, degree, field, graduationDate }]
  skills: { technical: string[], soft: string[] }
  leadership: [{ role, organization, bullets }]
}
```

## Dependencias

- `hooks/use-experience.ts` → CRUD sobre RxDB
- `types/experience.ts` → Tipos TypeScript
- `docs/json-schema-cv-generator.json` → Schema de referencia

## Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `app/(app)/experience/page.tsx` | Página principal |
| `components/experience/basics-form.tsx` | Datos personales |
| `components/experience/experience-section.tsx` | Roles laborales |
| `components/experience/education-section.tsx` | Educación |
| `components/experience/skills-form.tsx` | Skills |
| `components/experience/leadership-section.tsx` | Liderazgo |
| `components/experience/bullet-list.tsx` | Editor de bullets reutilizable |
| `hooks/use-experience.ts` | Hook CRUD |

---

## Plan v2 — Anonimización de datos

### Reglas de anonimización

- Nombres reales → "Nombre Ejemplo", "Apellido Ejemplo"
- Empresas → "Empresa A", "Empresa B", "Empresa C", etc.
- Emails → "nombre@ejemplo.com"
- Teléfonos → "+XX XXXXXXXXXX"
- URLs de LinkedIn/GitHub → "https://linkedin.com/in/nombre-ejemplo", "https://github.com/nombre-ejemplo"
- Ciudades → "Ciudad Ejemplo"
- Instituciones educativas → "Universidad Ejemplo", "Instituto Ejemplo"
- Mantener la estructura del JSON intacta
- Mantener los patrones de bullets (verbos en pasado + qué + cómo + resultado cuantificable)
- Mantener métricas coherentes pero ficticias

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `docs/cv-experiencia-real.json` | Reemplazar todos los datos personales con placeholders genéricos |
| `docs/json-schema-cv-generator.json` | Reemplazar valores de ejemplo que contengan datos personales |
