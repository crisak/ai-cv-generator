# Auth Module Spec — Clerk v7+

**Versión**: 1.0
**Fecha**: 2026-03-10
**Estado**: Planeado

---

## Resumen

Reemplazar el sistema de credenciales hardcodeadas por Clerk v7+ con soporte para Google OAuth, GitHub OAuth y Email/Password. Registro abierto multi-usuario con aislamiento de datos por usuario en RxDB.

---

## Métodos de autenticación

| Método | Provider | Configuración |
|--------|----------|---------------|
| Google (Gmail) | OAuth 2.0 | Google Cloud Console → OAuth App |
| GitHub | OAuth 2.0 | GitHub → Developer Settings → OAuth App |
| Email + Password | Clerk nativo | Habilitado por defecto en Clerk Dashboard |

---

## Flujo de autenticación

```
Usuario no autenticado
  → accede a cualquier ruta de /applications, /experience, etc.
  → middleware.ts intercepta (server-side, antes del render)
  → redirige a /login

Usuario en /login
  → elige método: Google / GitHub / Email+Password
  → Clerk maneja el flujo OAuth / credenciales
  → al completar → redirige a /applications

Usuario autenticado
  → middleware.ts permite el paso
  → useAuth() de Clerk provee { userId, isLoaded }
  → useDb() inicializa la DB del usuario: cvgeneratordb-{userId}
  → todos los datos son del usuario actual
```

---

## Protección de rutas

### Rutas públicas
- `/login` — página de inicio de sesión
- `/sign-up` — página de registro
- `/api/ai/parse` — ❌ NO pública (ver sección API)

### Rutas protegidas (todas las demás)
- `/applications`, `/applications/[id]`
- `/experience`
- `/cv-generator`
- `/cvs`
- `/settings`

La protección ocurre en `middleware.ts` con `clerkMiddleware()` + `auth.protect()`. Es server-side (edge), no client-side.

---

## Aislamiento de datos por usuario

**Estrategia**: Base de datos RxDB independiente por usuario.

```
Usuario A (userId: user_abc) → IndexedDB: cvgeneratordb-user_abc
Usuario B (userId: user_xyz) → IndexedDB: cvgeneratordb-user_xyz
```

- Cero cambios en schemas de RxDB
- Cero cambios en hooks (`use-applications`, `use-cvs`, `use-settings`, `use-experience`)
- Aislamiento total: cada usuario solo ve y modifica sus propios datos
- La DB se inicializa en `hooks/use-db.ts` cuando Clerk resuelve el `userId`

---

## Variables de entorno requeridas

```bash
# Clerk (requeridas)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Rutas de Clerk (requeridas para redirecciones correctas)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/applications
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/applications
```

---

## Cambios por archivo

### Crear
- `middleware.ts` — clerkMiddleware con rutas públicas
- `app/(auth)/sign-up/page.tsx` — página de registro con `<SignUp>`

### Modificar
- `app/layout.tsx` — agregar `<ClerkProvider>`
- `app/(app)/layout.tsx` — convertir a Server Component, eliminar Zustand auth
- `app/(auth)/login/page.tsx` — reemplazar formulario con `<SignIn>`
- `lib/db/index.ts` — `getDatabase(userId)` dinámico
- `hooks/use-db.ts` — integrar `useAuth()` de Clerk
- `components/layout/sidebar.tsx` — `useClerk().signOut()`
- `app/api/ai/parse/route.ts` — agregar `auth()` guard

### Eliminar
- `lib/auth.ts`
- `store/auth-store.ts`

### Dependencias
```bash
# Agregar
npm install @clerk/nextjs

# Remover (ya no necesario con Clerk)
npm uninstall crypto-js @types/crypto-js
```

---

## Protección del API route

`POST /api/ai/parse` debe validar sesión activa:

```ts
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // procesamiento normal...
}
```

Sin esto, el endpoint es público y cualquiera puede consumir las API keys de IA del usuario.

---

## v2 — Consideraciones futuras

- **`aiApiKey` en Clerk privateMetadata**: Mover el API key de IA de IndexedDB a `privateMetadata` del usuario en Clerk. Nunca expuesto al cliente.
- **`<UserButton>` de Clerk**: Reemplazar el nombre/avatar en el sidebar con el componente `<UserButton>` que incluye gestión de cuenta.
- **Migración de datos**: Ofrecer "Importar datos anteriores" para copiar el IndexedDB viejo (`cvgeneratordb`) al nuevo (`cvgeneratordb-{userId}`).
- **Webhook `user.created`**: Para aprovisionar recursos si se agrega un backend en el futuro.

---

## Criterios de aceptación

- [ ] Login con Google → redirige a `/applications`
- [ ] Login con GitHub → redirige a `/applications`
- [ ] Login con Email/Password → redirige a `/applications`
- [ ] Acceso directo a `/applications` sin sesión → redirige a `/login` (server-side, sin flash de contenido)
- [ ] Datos de usuario A no visibles para usuario B
- [ ] IndexedDB muestra `cvgeneratordb-{userId}` en DevTools
- [ ] `POST /api/ai/parse` sin sesión → 401
- [ ] Logout redirige a `/login`
- [ ] Dark/light mode funciona igual que antes
