# CV Generator Platform — Agent Guidelines

## Metodología

Este proyecto usa **Spec-Driven Development (SDD)**. Antes de implementar, lee:
1. `constitution/constitution.md` — reglas permanentes del proyecto
2. `specs/<dominio>/specification.md` — qué se implementa
3. `specs/<dominio>/plan.md` — cómo se implementa
4. `specs/<dominio>/tasks.md` — tareas concretas (1 task = 1 PR)

## Dominios

| Dominio | Spec | Estado |
|---------|------|--------|
| auth | `specs/auth/` | ✅ Completo |
| applications | `specs/applications/` | ✅ Completo |
| experience | `specs/experience/` | ✅ Completo |
| cv-generator | `specs/cv-generator/` | ✅ Completo |
| ai-provider | `specs/ai-provider/` | 🔶 MVP hecho, evolución pendiente |
| settings | `specs/settings/` | ✅ Completo |
| cross-cutting | `specs/cross-cutting/` | ✅ Completo |

## Tech Stack (no negociable)

- **Frontend**: Next.js 16 + React + TypeScript
- **Styling**: TailwindCSS v4 (dark/light, paleta azul Facebook)
- **UI**: shadcn/ui
- **State**: Zustand (solo tema)
- **DB**: RxDB v15 (IndexedDB, local-first, sin backend)
- **Auth**: Clerk v7+ (Google OAuth, GitHub OAuth, Email/Password)
- **Validation**: Zod | **Code Quality**: Prettier, ESLint
- **Animations**: framer-motion (solo cambios nuevos, no retroactivo)
- **AI UI Components**: ai-elements (ModelSelector, Shimmer — convención shadcn)
- **Testing**: Vitest (config only, sin implementación)
- **Skills**: interface-design, vercel-react-best-practices, shadcn-ui, ai-elements, clerk

## Reglas de desarrollo

- No over-engineering. Solución mínima para el requerimiento actual
- No crear abstracciones prematuras ni helpers para operaciones únicas
- No agregar comments, docstrings o type annotations a código no modificado
- Preferir editar archivos existentes sobre crear nuevos
- Validación solo en boundaries (input de usuario, respuestas de API)
- Todo contenido de CV y UI en **español**
- Auth via Clerk — **NO** reintroducir credenciales hardcodeadas
- CV JSON debe seguir `docs/json-schema-cv-generator.json`

## Estructura del proyecto

```
constitution/          → Reglas permanentes (constitution.md)
specs/                 → Specs por dominio (specification + plan + tasks)
architecture/          → System overview, data models
app/                   → Next.js App Router
  (app)/               → Rutas autenticadas (applications, cv-generator, experience, cvs, settings, profile)
  (auth)/              → Rutas públicas (login, sign-up) — catch-all requerido por Clerk
  api/ai/parse/        → POST route protegida (server-side AI call)
components/            → Por dominio (applications/, cv-generator/, experience/, cv/, layout/, ui/)
lib/                   → ai.ts, ai-cv.ts, db/, utils.ts
hooks/                 → use-applications, use-cvs, use-db, use-experience, use-settings, use-toast
store/                 → theme-store.ts (Zustand)
types/                 → cv.ts, experience.ts
docs/                  → JSON schemas, experiencia real
docs/.draft/           → Docs internos/sensibles (gitignored)
```

## Patrones clave

- **RxDB por usuario**: `cvgeneratordb-{userId}` — aislamiento total
- **Hydration safe**: Guard `mounted` antes de leer `useTheme()` en SSR
- **Step 2 layout**: `grid-cols-[300px_1fr_300px] h-[calc(100vh-280px)]`
- **Sticky elements**: `flex flex-col h-full` + `flex-1` spacer
- **Tooltips**: `group` + `group-hover:block` con absolute positioning
- **Clerk catch-all**: `[[...sign-in]]` y `[[...sign-up]]` son obligatorios
- **Logout**: `clearDbInstance(userId)` al hacer sign out

## AI — Reglas de generación de CV

- Fórmula: **Verbo pasado + Qué + Cómo + Resultado cuantificable**
- Verbos: Diseñé, Implementé, Optimicé, Reduje, Migré, Lideré
- Métricas siempre (%, tiempos, costos, usuarios)
- Max 4-5 bullets rol reciente, 3 en los demás
- Priorizar match con la oferta
- Max 1 página PDF
- Goals editables antes de generar
