# Auth — Plan de implementación

**Estado**: ✅ Implementado

## Arquitectura

Clerk v7+ maneja todo el flujo de auth. No hay lógica custom de autenticación.

```
middleware.ts (Edge)
  → clerkMiddleware + createRouteMatcher
  → protege todas las rutas excepto /login y /sign-up

app/(auth)/login/[[...sign-in]]/page.tsx → <SignIn />
app/(auth)/sign-up/[[...sign-up]]/page.tsx → <SignUp />

app/(app)/layout.tsx → useAuth() + useDb(userId)
app/(app)/profile/page.tsx → useUser() + user.update()

app/api/ai/parse/route.ts → auth() server-side guard
```

## Aislamiento de datos

```
useDb(userId) → getDbInstance(`cvgeneratordb-${userId}`)
```

Cada usuario tiene su propia base IndexedDB. Cero cambios en schemas o hooks existentes.

## Variables de entorno

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/applications
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/applications
```

---

## Enhanced Profile (v2)

### Arquitectura

```
/profile page (expandido)
  → Avatar upload
     → Clerk user.setProfileImage(file)
     → Preview antes de upload
  → Nombre/Apellido edit (existente)
     → Clerk user.update({ firstName, lastName })
  → Email (solo lectura — gestión de múltiples emails requiere plan Clerk no disponible)
     → Mostrar email principal: user.primaryEmailAddress
  → Cuentas externas
     → Listar: user.externalAccounts
     → Vincular: user.createExternalAccount({ strategy: 'oauth_google' | 'oauth_github' })
     → Desvincular: externalAccount.destroy()
```

### Clerk Dashboard — Account Linking

Habilitar "Account Linking" por email en Clerk Dashboard para que cuando un usuario se registra con email y luego intenta vincular Google/GitHub con el mismo email, las cuentas se fusionen automáticamente en lugar de crear duplicados.

### Archivos a modificar (v2)

| Archivo | Cambio |
|---------|--------|
| `app/(app)/profile/page.tsx` | Agregar avatar upload, email management, sección de cuentas externas |

---

## Dependencias

- `@clerk/nextjs` (v7+)

## Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `middleware.ts` | Protección de rutas Edge |
| `app/(auth)/login/[[...sign-in]]/page.tsx` | Página de login |
| `app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Página de registro |
| `app/(app)/layout.tsx` | Layout autenticado |
| `app/(app)/profile/page.tsx` | Edición de perfil |
| `app/api/ai/parse/route.ts` | API protegida |
| `components/layout/sidebar.tsx` | Avatar + dropdown |
| `lib/db/index.ts` | `getDbInstance()` + `clearDbInstance()` |
