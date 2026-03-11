# Auth — Tasks

## Tareas completadas

- [x] Task 1: Configurar Clerk v7+ con `@clerk/nextjs`
- [x] Task 2: Crear `middleware.ts` con `clerkMiddleware`
- [x] Task 3: Crear rutas catch-all para login y sign-up
- [x] Task 4: Integrar `useAuth()` en layout autenticado
- [x] Task 5: Aislar RxDB por `userId`
- [x] Task 6: Proteger `POST /api/ai/parse` con `auth()`
- [x] Task 7: Sidebar con avatar + dropdown (Clerk `useUser()`)
- [x] Task 8: Página `/profile` para editar nombre
- [x] Task 9: Fix OAuth redirect loop (`proxy.ts` → `middleware.ts`)
- [x] Task 10: Fix hydration mismatch (guard `mounted`)

## Tareas pendientes (seguridad)

- [ ] Task 11: Rate limiting en `/api/ai/parse` con Upstash Redis
- [ ] Task 12: Mover `aiApiKey` a Clerk `privateMetadata`
- [ ] Task 13: Input sanitization en `jobOffer` (strip HTML antes del prompt)
- [ ] Task 14: Configurar CSP headers en `next.config`
- [ ] Task 15: Habilitar Bot detection + Brute-force en Clerk Dashboard
