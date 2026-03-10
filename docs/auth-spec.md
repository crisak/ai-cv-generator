# Auth Module Spec — Clerk v7+

**Versión**: 2.0
**Fecha**: 2026-03-10
**Estado**: Implementado ✅

---

## Resumen

Autenticación con Clerk v7+ con soporte para Google OAuth, GitHub OAuth y Email/Password. Registro abierto multi-usuario con aislamiento de datos por usuario en RxDB (base de datos independiente por `userId`).

---

## Métodos de autenticación

| Método | Provider | Estado |
|--------|----------|--------|
| Google (Gmail) | OAuth 2.0 | ✅ Activo |
| GitHub | OAuth 2.0 | ✅ Activo |
| Email + Password | Clerk nativo | ✅ Activo |

---

## Flujo de autenticación

```
Usuario no autenticado
  → accede a cualquier ruta protegida (/applications, /experience, etc.)
  → middleware.ts intercepta (edge, server-side, antes del render)
  → redirige a /login

Usuario en /login
  → elige método: Google / GitHub / Email+Password
  → Clerk maneja el flujo OAuth / credenciales
  → al completar → redirige a /applications (NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL)

Usuario autenticado
  → middleware.ts permite el paso
  → useAuth() de Clerk provee { userId, isLoaded }
  → useDb() inicializa la DB del usuario: cvgeneratordb-{userId}
  → todos los datos son del usuario actual
```

---

## Protección de rutas

### Rutas públicas
- `/login` y `/login/[[...sign-in]]/*` — página de inicio de sesión
- `/sign-up` y `/sign-up/[[...sign-up]]/*` — página de registro

### Rutas protegidas (todas las demás)
- `/applications`, `/applications/[id]`
- `/experience`
- `/cv-generator`
- `/cvs`
- `/settings`
- `/profile`
- `POST /api/ai/parse` — requiere `auth()` server-side

La protección ocurre en `middleware.ts` en el Edge Runtime — server-side, sin flash de contenido al cliente.

**Nota crítica sobre catch-all routes**: Clerk requiere rutas catch-all (`[[...sign-in]]`, `[[...sign-up]]`) para manejar sub-rutas internas del componente. Sin ellas, Clerk genera peticiones a `/login/SignIn_clerk_catchall_check_*` que devuelven 404.

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
- `clearDbInstance(userId)` se llama al hacer logout para limpiar la instancia en memoria

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

## Seguridad — estado actual

### ✅ Implementado

| Punto | Detalle |
|-------|---------|
| Protección de rutas server-side | `clerkMiddleware` + `auth.protect()` en Edge |
| API route protegida | `POST /api/ai/parse` valida `userId` antes de procesar |
| API keys del usuario nunca en `.env` | El servidor solo usa `clientApiKey` recibido del cliente autenticado |
| Aislamiento de datos por usuario | DB separada por `userId` en IndexedDB |
| Credenciales hardcodeadas eliminadas | `lib/auth.ts` y `store/auth-store.ts` borrados |
| Hydration segura | `mounted` guard en sidebar evita mismatch SSR/cliente con tema |

### ⚠️ Pendientes / Recomendaciones

| Prioridad | Punto | Descripción |
|-----------|-------|-------------|
| Alta | **API key en tránsito** | La `aiApiKey` viaja del cliente al servidor en cada request a `/api/ai/parse`. Esto es aceptable en HTTPS pero el API key está expuesta en el body de la request. Alternativa: moverla a `Clerk privateMetadata` y leerla server-side con `clerkClient.users.getUser(userId)`. |
| Alta | **Rate limiting en `/api/ai/parse`** | Un usuario autenticado puede hacer requests ilimitadas. Sin rate limit, puede agotar su propio API key rápidamente o generar costos. Recomendado: Upstash Redis + `@upstash/ratelimit` o Vercel Edge middleware. |
| Media | **Input sanitization en jobOffer** | El campo `jobOffer` se trunca a 4000 chars pero no se sanitiza HTML/scripts antes de enviarse al prompt de IA. Agregar strip de HTML tags antes del envío. |
| Media | **Clerk Brute-force protection** | Habilitar en Clerk Dashboard: _Attack Protection_ → _Bot detection_ y _Brute-force protection_ para Email/Password. |
| Baja | **CSP headers** | Sin Content Security Policy configurado en `next.config`. Agregar headers para mitigar XSS. |
| Baja | **Clerk privateMetadata para aiApiKey** | Mover el API key de IA de IndexedDB a `user.privateMetadata` de Clerk. Nunca viaja al cliente, solo se lee server-side. |

---

## Reglas de usuario recomendadas en Clerk Dashboard

Configurar en **Clerk Dashboard → User & Authentication**:

### Restricciones de registro
- **Allowlist** (si la app es privada): limitar registro solo a emails de dominios específicos, ej. `@empresa.com`.
- **Blocklist**: bloquear dominios de emails temporales (Mailinator, guerrillamail, etc.).

### Políticas de contraseña (Email/Password)
- Longitud mínima: **8 caracteres**
- Complejidad: habilitar requerimiento de mayúsculas + números + símbolos
- `Have I Been Pwned` check: Clerk puede bloquear contraseñas comprometidas en breaches conocidos.

### Verificación de email
- Requerir verificación de email antes de acceder a la app (`emailVerification: required`).
- Actualmente Clerk lo habilita por defecto para Email/Password; verificar que esté activo para OAuth también.

### Sesiones
- **Session lifetime**: configurar expiración de sesión a 7 días inactivos (default de Clerk es 7 días, verificar).
- **Multi-session**: decidir si permitir que el mismo usuario tenga sesiones en múltiples dispositivos simultáneamente.
- **Revocar sesiones al cambiar contraseña**: habilitar en Clerk Dashboard.

### Attack Protection
- **Bot detection**: habilitar para el formulario de login/registro.
- **Brute-force protection**: bloquear IPs tras N intentos fallidos.
- **Account lockout**: bloquear cuenta tras intentos fallidos repetidos.

---

## Bugs resueltos durante implementación

| Bug | Causa | Fix |
|-----|-------|-----|
| Loop infinito post-OAuth | `proxy.ts` ignorado por Next.js (nombre incorrecto) + `/` redirigía a `/login` | Renombrar a `middleware.ts`; `/` redirige a `/applications` |
| 404 en sub-rutas de Clerk | Faltaban catch-all routes `[[...sign-in]]` | Mover pages a `login/[[...sign-in]]/page.tsx` |
| Hydration mismatch (icono tema) | SSR renderiza `Monitor`, cliente tiene `Moon` desde localStorage | Guard `mounted` antes de leer `theme` |
| Hydration mismatch (texto tema) | Mismo origen, en el `<span>` del label del tema | Mismo guard `mounted` |

---

## v3 — Consideraciones futuras

- **`aiApiKey` en Clerk privateMetadata**: Mover el API key de IA de IndexedDB a `privateMetadata`. Nunca expuesto al cliente, leído server-side en `/api/ai/parse`.
- **Rate limiting**: Upstash Redis + `@upstash/ratelimit` en `/api/ai/parse`.
- **Webhook `user.deleted`**: Limpiar datos del usuario si se elimina la cuenta en Clerk.
- **Migración de datos**: Ofrecer "Importar datos anteriores" para copiar IndexedDB viejo (`cvgeneratordb`) al nuevo (`cvgeneratordb-{userId}`).
- **Organizations**: Si se agrega modo equipo, Clerk Organizations permite aislar datos por organización.

---

## Criterios de aceptación — Verificados ✅

- [x] Login con Google → redirige a `/applications`
- [x] Login con GitHub → redirige a `/applications`
- [x] Login con Email/Password → redirige a `/applications`
- [x] Acceso directo a `/applications` sin sesión → redirige a `/login` (server-side, sin flash)
- [x] Datos de usuario A no visibles para usuario B (DB separada por userId)
- [x] IndexedDB muestra `cvgeneratordb-{userId}` en DevTools
- [x] `POST /api/ai/parse` sin sesión → 401
- [x] Logout redirige a `/login`
- [x] Dark/light mode funciona igual que antes
- [x] Avatar y nombre del usuario visibles en sidebar (desde Clerk `useUser()`)
