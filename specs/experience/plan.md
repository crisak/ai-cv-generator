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
