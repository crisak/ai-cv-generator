# Feature: Authentication

**Estado**: ✅ Implementado
**Spec original**: `docs/.draft/auth-spec.md` (v2.0)

---

## Problema

Los usuarios necesitan autenticarse para acceder a la plataforma. Cada usuario debe ver solo sus propios datos (postulaciones, CVs, experiencia).

## Goals

- Registro abierto multi-usuario (Google OAuth, GitHub OAuth, Email/Password)
- Protección de rutas server-side (Edge Runtime)
- Aislamiento total de datos por usuario

## User Stories

- Como usuario, puedo registrarme con Google, GitHub o Email/Password
- Como usuario, al iniciar sesión veo solo mis datos
- Como usuario, mi sesión persiste entre recargas
- Como usuario, puedo ver mi avatar y nombre en la sidebar
- Como usuario, puedo editar mi nombre en `/profile`
- Como usuario, al cerrar sesión mis datos en memoria se limpian

## Requerimientos funcionales

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR1 | Registro con Google OAuth | ✅ |
| FR2 | Registro con GitHub OAuth | ✅ |
| FR3 | Registro con Email/Password | ✅ |
| FR4 | Protección de rutas en Edge (`middleware.ts`) | ✅ |
| FR5 | API route protegida (`POST /api/ai/parse`) | ✅ |
| FR6 | DB aislada por usuario (`cvgeneratordb-{userId}`) | ✅ |
| FR7 | Sidebar con avatar + nombre + dropdown | ✅ |
| FR8 | Página `/profile` para editar nombre | ✅ |
| FR9 | Logout limpia instancia de DB en memoria | ✅ |

## Requerimientos no funcionales

- Clerk v7+ como proveedor único de auth
- Catch-all routes requeridas (`[[...sign-in]]`, `[[...sign-up]]`)
- Guard `mounted` para evitar hydration mismatch con `useTheme()`

## Edge Cases

- Email ya registrado con otro método → Clerk maneja la vinculación
- Token expirado → Clerk renueva automáticamente
- OAuth callback sin middleware → Loop infinito (resuelto: `proxy.ts` → `middleware.ts`)

## Seguridad pendiente

| Prioridad | Item |
|-----------|------|
| Alta | Rate limiting en `POST /api/ai/parse` (Upstash Redis) |
| Alta | Mover `aiApiKey` a Clerk `privateMetadata` |
| Media | Input sanitization en `jobOffer` (strip HTML) |
| Media | Bot detection + Brute-force en Clerk Dashboard |
| Baja | CSP headers en `next.config` |

---

## Enhanced Profile Management (v2)

### User Stories

- Como usuario, puedo actualizar mi nombre, apellido, email e imagen de perfil desde la página de perfil
- Como usuario, puedo vincular o desvincular cuentas externas (Google, GitHub) desde mi perfil
- Como usuario, si me registro con email y luego vinculo Google con el mismo email, las cuentas se fusionan automáticamente (Account Linking)

### Requerimientos funcionales (v2)

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR10 | Actualizar nombre, apellido y email via Clerk `user.update()` | ⬜ Pendiente |
| FR11 | Actualizar imagen de perfil via Clerk `user.setProfileImage()` | ⬜ Pendiente |
| FR12 | Vincular/desvincular cuentas externas (Google, GitHub) via Clerk | ⬜ Pendiente |
| FR13 | Habilitar Account Linking por email en Clerk Dashboard | ⬜ Pendiente |

### Edge Cases (v2)

- Usuario intenta desvincular su único método de auth → Clerk bloquea la acción
- Email ya vinculado a otra cuenta → Clerk Dashboard config determina si fusionar o rechazar
- Imagen de perfil demasiado grande → validar tamaño antes de upload

---

## Criterios de aceptación — Verificados ✅

- [x] Login con Google → redirige a `/applications`
- [x] Login con GitHub → redirige a `/applications`
- [x] Login con Email/Password → redirige a `/applications`
- [x] Ruta protegida sin sesión → redirige a `/login` (server-side, sin flash)
- [x] Datos de usuario A no visibles para usuario B
- [x] `POST /api/ai/parse` sin sesión → 401
- [x] Logout redirige a `/login`
- [x] Avatar y nombre visibles en sidebar
