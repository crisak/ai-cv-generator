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

## Tareas pendientes (enhanced profile v2)

- [x] Task 16: Imagen de perfil via Clerk
  - Scope: Agregar componente de upload de avatar en `/profile` page usando `user.setProfileImage()`. Preview antes de upload. Validación de tamaño. Manejo de errores.
  - Depende de: nada

- [x] Task 17: Edición expandida de nombre y email en perfil
  - Scope: Expandir formulario en `/profile` para permitir editar firstName, lastName y gestionar email addresses via Clerk API (`user.createEmailAddress()`, verificación). Validar email antes de agregar.
  - Depende de: nada

- [x] Task 18: Vincular/desvincular cuentas externas (Google, GitHub) en perfil
  - Scope: Mostrar lista de cuentas conectadas (`user.externalAccounts`). Botones "Vincular" para providers no conectados, "Desvincular" para los conectados. Usar `user.createExternalAccount()` y `externalAccount.destroy()`. Prevenir desvincular último método de auth.
  - Depende de: nada

- [ ] Task 19: Configurar Account Linking por email en Clerk Dashboard
  - Scope: Tarea de configuración. Habilitar "Account Linking" en Clerk Dashboard. Documentar en specs. Verificar que cuentas con mismo email se fusionen correctamente.
  - Depende de: nada (puede ejecutarse en paralelo con Tasks 16-18)
