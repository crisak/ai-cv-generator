# Data Models

## RxDB Collections

Base de datos: `cvgeneratordb-{userId}` (IndexedDB via Dexie adapter)

### applications

```typescript
{
  id: string                    // UUID
  company: string               // Nombre de la empresa
  position: string              // Cargo/posición
  source: string                // Fuente (LinkedIn, empresa, referido)
  status: string                // pending | interviewed | rejected | offer | accepted
  salary: number                // Salario ofrecido
  salaryCurrency: string        // COP | USD | EUR
  benefits: string[]            // Tags de beneficios
  ranking: number               // 1-5, evaluación subjetiva
  notes: string                 // Notas libres
  dateApplied: string           // Fecha de postulación (ISO)
  cvId?: string                 // Referencia al CV generado
  timeline: TimelineEntry[]     // Historial de eventos
  createdAt: string
  updatedAt: string
}

TimelineEntry {
  id: string
  date: string
  type: string                  // applied | interview | response | offer | note
  description: string
}
```

### experiences

Sigue `docs/json-schema-cv-generator.json`:

```typescript
{
  id: string
  basics: {
    name: string
    title: string
    email: string
    phone: string
    location: string
    linkedin: string
    github: string
  }
  experience: [{
    company: string
    position: string
    startDate: string
    endDate: string
    bullets: string[]
  }]
  education: [{
    institution: string
    degree: string
    field: string
    graduationDate: string
  }]
  skills: {
    technical: string[]
    soft: string[]
  }
  leadership: [{
    role: string
    organization: string
    bullets: string[]
  }]
}
```

### cvs

```typescript
{
  id: string                    // UUID
  applicationId?: string        // Vínculo a postulación (opcional)
  jobOffer: string              // Texto original de la oferta
  cv: CvData                   // CV generado (mismo schema que experience)
  goals: string[]               // Goals seleccionados
  createdAt: string
}
```

### settings

```typescript
{
  id: 'singleton'               // Siempre 1 doc por usuario
  aiModel: string               // claude | gpt | gemini | grok | deepseek
  aiApiKey: string              // API key del usuario
  userName: string              // Legacy (nombre ahora viene de Clerk)
  userEmail: string             // Legacy (email ahora viene de Clerk)
}
```

## Datos externos (Clerk)

No almacenados en RxDB — leídos via `useUser()`:

```typescript
{
  userId: string                // Clerk user ID
  firstName: string
  lastName: string
  fullName: string
  emailAddresses: [{ emailAddress: string }]
  imageUrl: string              // Avatar URL
}
```

Editable via `user.update({ firstName, lastName })`.

## JSON Schemas de referencia

| Archivo | Uso |
|---------|-----|
| `docs/json-schema-cv-generator.json` | Schema que debe seguir todo CV generado |
| `docs/cv-experiencia-real.json` | Ejemplo de experiencia real para importar |
