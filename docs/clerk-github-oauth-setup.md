# Guía: Configurar GitHub OAuth para Clerk

> Guía temporal — eliminar después de configurar

## Lo que necesitas

- Cuenta de GitHub
- Acceso al [Dashboard de Clerk](https://dashboard.clerk.com)

---

## Paso 1: Crear OAuth App en GitHub

1. Ve a [github.com/settings/developers](https://github.com/settings/developers)
2. Click en **"OAuth Apps"** en el menú lateral
3. Click **"New OAuth App"**
4. Llena el formulario:
   - **Application name**: `CV Generator`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**:
     ```
     https://glorious-kit-8.clerk.accounts.dev/v1/oauth_callback
     ```
     > El dominio `glorious-kit-8.clerk.accounts.dev` viene de tu `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Puedes confirmar el dominio exacto en Clerk Dashboard → **"Domains"**.
5. Click **"Register application"**

Result
```
Client ID: Ov23libpZW8LUk2RWOJG
Client secrets: 638b40edf3d3407d0c6ee9e2a4fe9fde5b46c4ae
```
---

## Paso 2: Obtener Client ID y Client Secret

1. Después de crear la app verás la página de configuración
2. Copia el **Client ID** (visible directamente)
3. Click **"Generate a new client secret"**
4. Copia el **Client Secret** que aparece — **solo se muestra una vez**

---

## Paso 3: Configurar GitHub en el Dashboard de Clerk

1. Ve a [dashboard.clerk.com](https://dashboard.clerk.com)
2. Selecciona tu aplicación
3. En el menú lateral → **"User & Authentication"** → **"Social connections"**
4. Encuentra **GitHub** → toggle para habilitarlo
5. Selecciona **"Use custom credentials"**
6. Pega:
   - **Client ID**: el que copiaste de GitHub
   - **Client Secret**: el que copiaste de GitHub
7. Click **"Save"**

---

## Paso 4: Verificar

1. Reinicia el servidor: `npm run dev`
2. Ve a `http://localhost:3000/login`
3. Debe aparecer el botón **"Continuar con GitHub"**
4. Al hacer click debe redirigir a GitHub para autorizar

---

## Para producción

Cuando hagas deploy (ej. Vercel), necesitas:

1. Actualizar la **Homepage URL** en GitHub a tu dominio real (ej. `https://cv-generator.vercel.app`)
2. Actualizar la **Authorization callback URL** en GitHub al dominio de producción de Clerk:
   ```
   https://glorious-kit-8.clerk.accounts.dev/v1/oauth_callback
   ```
   > En producción Clerk usa un dominio diferente. Ve a Clerk Dashboard → Domains para obtenerlo.
3. O crear una segunda OAuth App en GitHub específica para producción.

---

## Troubleshooting

**"The redirect_uri is not associated with this application"**
→ La Authorization callback URL en GitHub no coincide. Verifica el dominio exacto en Clerk Dashboard → Domains.

**El botón de GitHub no aparece en el login**
→ Verifica que habilitaste GitHub en Clerk Dashboard → Social connections y guardaste.

**"Bad verification code"**
→ El Client Secret no se copió correctamente. Genera uno nuevo en GitHub → tu OAuth App → "Generate a new client secret".
