# CV Generator - Project Memory

## Stack Resuelto
- **Next.js 16** con Turbopack (TypeScript, App Router)
- **TailwindCSS v4** — configuración vía CSS (`@theme` en globals.css, NO tailwind.config.ts para colores)
- **PostCSS**: `@tailwindcss/postcss` (v4 ya no usa `tailwindcss` directo en postcss)
- **shadcn/ui** instalado con `slate` como base color (NO `blue` - no existe en registry)
- **RxDB v15** con `getRxStorageDexie()` adapter
- **Zustand v5** con persist middleware
- **next-themes** para dark/light mode
- **crypto-js** para hashing de credenciales
- **date-fns** para formateo de fechas

## Paleta Facebook Blue
- Primary: `hsl(214 89% 52%)` = #1877F2 (light) / `hsl(214 89% 60%)` (dark)
- Dark background: `hsl(214 35% 8%)` con cards en `hsl(214 30% 11%)`
- CSS custom vars en `app/globals.css` dentro de `:root` y `.dark`
- Dark mode via `@custom-variant dark (&:where(.dark, .dark *))` en globals.css

## Credenciales Auth (hasheadas)
- Email hash (SHA-256): `1425af658e3ef015fbec3871268bdfb991d1de94b03d41e201a2d40c9f8705b9`
- Pass hash (SHA-256): `566321247a793684d11256a83791a9ccffd68fad0fc60c3fb00be556ddd758df`
- Implementación: `lib/auth.ts`

## Estructura de Archivos Clave
```
app/
  (auth)/login/page.tsx       — Login form
  (app)/layout.tsx            — Auth guard + Sidebar layout
  (app)/applications/page.tsx — Dashboard postulaciones
  (app)/experience/page.tsx   — Placeholder (Fase 2)
  (app)/cv-generator/page.tsx — Placeholder (Fase 3)
  (app)/settings/page.tsx     — Placeholder (Fase 4)
lib/
  auth.ts                     — verifyCredentials con hashes
  db/index.ts                 — getDatabase() singleton RxDB
  db/schemas.ts               — RxDB schemas (applications, cvs, settings, experiences)
store/
  auth-store.ts               — Zustand auth con persist
  theme-store.ts              — Zustand theme
hooks/
  use-db.ts                   — useDb() hook
  use-applications.ts         — CRUD applications con RxDB
components/
  layout/sidebar.tsx          — Navegación con theme toggle
  applications/application-form.tsx  — Sheet con formulario Zod
  applications/applications-table.tsx — Tabla con inline status edit
types/cv.ts                   — Types CVData, ApplicationStatus, etc.
```

## Gotchas Importantes
1. **Zod con react-hook-form**: NO usar `.default()` en campos numéricos del schema — causa mismatch de tipos con `Resolver`. Usar `defaultValues` en `useForm` en su lugar.
2. **shadcn/ui base color**: siempre usar `slate` (no `blue` — no existe en registry v3.x)
3. **TailwindCSS v4 dark mode**: usar `@custom-variant dark` en CSS, NO `darkMode: ['class']` en config
4. **RxDB insert**: incluir siempre campos requeridos del schema (ej: `cvId: ''` como default)
5. **ApplicationInput type**: `cvId` es opcional — `Omit<ApplicationDocument, ...> & { cvId?: string }`

## Fases del MVP
- **Fase 1** ✅ COMPLETA: Setup + Auth + Dashboard postulaciones
- **Fase 2**: Experience Editor (import/edit cv-experiencia-real.json, form dinámico, CRUD, export)
- **Fase 3**: CV Generator con IA (goals preview, generación, render ATS, metadata)
- **Fase 4**: Settings page (AI model selector, API key, perfil)
