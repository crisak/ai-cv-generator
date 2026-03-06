# 🚀 Setup Guide - CV Generator

Guía paso a paso para configurar y ejecutar el proyecto de desarrollo a producción.

## 📋 Tabla de contenidos

1. [Setup Inicial](#setup-inicial)
2. [Configurar API Keys](#configurar-api-keys)
3. [Cambiar Credenciales de Login](#cambiar-credenciales-de-login)
4. [Desarrollo Local](#desarrollo-local)
5. [Deploy a Producción](#deploy-a-producción)
6. [Troubleshooting](#troubleshooting)

---

## Setup Inicial

### Requisitos

- **Node.js** 18+ (verifica con `node --version`)
- **npm** o **yarn**
- **Git** (para clonar)
- Un editor (VS Code recomendado)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/cv-generator.git
cd cv-generator
```

### 2. Instalar dependencias

```bash
npm install

# O con yarn:
yarn install

# O con bun:
bun install
```

Esto instalará:
- Next.js 16, React 19
- TailwindCSS 4, shadcn/ui
- RxDB 15 (base de datos local)
- Zustand (state management)
- Zod (validación)
- Y otras dependencias

### 3. Crear archivo de configuración local

```bash
# Copia .env.example a .env.local
cp .env.example .env.local

# No necesitas llenar nada aún (es para producción)
```

### 4. Verificar que todo funcione

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

**Debe aparecer:** Pantalla de login

```
Email: cristian.c.romero.p@gmail.com
Contraseña: Ajudfn23#
```

✅ Si entras correctamente → **Setup básico completado**

---

## Configurar API Keys

### ¿Para qué sirven?

Las API keys permiten que la IA:
1. Analice automáticamente ofertas laborales (empresa, puesto, requisitos, beneficios)
2. Genere bullets de CV optimizados para cada oferta
3. Reescriba y optimice tu CV con matching score

**Sin API key:** Funciona con regex fallback (básico pero lento)

### Obtener API Keys

#### Claude (Anthropic) - Recomendado 🌟

1. Abre https://console.anthropic.com/account/keys
2. Inicia sesión o crea cuenta
3. Click en "Create Key"
4. Nombra algo como "CV Generator Dev"
5. Copia la key (comienza con `sk-ant-`)

**Restricciones para desarrollo:**
- Plan gratuito: $5 de crédito mensual (suficiente para MVP)
- Verifica límite en: https://console.anthropic.com/account/usage

**En la app:**
1. Settings → Inteligencia Artificial
2. Modelo: "Claude (Anthropic)"
3. Anthropic API Key: `sk-ant-...`
4. Click "Guardar cambios"

---

#### OpenAI (GPT-4o)

1. Abre https://platform.openai.com/api-keys
2. Inicia sesión o crea cuenta
3. Click en "Create new secret key"
4. Copia (comienza con `sk-`)

**Restricciones:**
- Requiere tarjeta de crédito
- Pago por uso (~$0.0001-0.001 por request)
- Verifica usage en: https://platform.openai.com/usage

**En la app:**
1. Settings → Inteligencia Artificial
2. Modelo: "GPT-4o (OpenAI)"
3. OpenAI API Key: `sk-...`
4. Click "Guardar cambios"

---

#### Google Gemini

1. Abre https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Selecciona proyecto (o crea uno)
4. Copia la key

**En la app:**
1. Settings → Inteligencia Artificial
2. Modelo: "Gemini (Google)"
3. Google AI Studio Key: `...`
4. Click "Guardar cambios"

---

#### DeepSeek

1. Abre https://platform.deepseek.com/api_keys
2. Inicia sesión
3. Click "Create API Key"
4. Copia (comienza con `sk-`)

**Recomendación:** Opción más económica
- Muy rápido
- Muy barato (~$0.00002 por 1K tokens)

**En la app:**
1. Settings → Inteligencia Artificial
2. Modelo: "DeepSeek"
3. DeepSeek API Key: `sk-...`
4. Click "Guardar cambios"

---

### Usar en Desarrollo

La API key se guarda en **IndexedDB (local)**, visible solo en tu navegador.

**Verificar que funciona:**
1. Ve a Applications → Nueva aplicación
2. Pega una oferta laboral
3. Click "Analizar con IA"
4. Debe mostrar empresa, puesto, requisitos detectados

✅ Si aparecen datos → **API correctamente configurada**

---

## Cambiar Credenciales de Login

### ⚠️ ANTES DE HACERLO

Lee [SECURITY.md](./SECURITY.md) completamente.

### Paso 1: Generar nuevos hashes

```bash
node -e "
const CryptoJS = require('crypto-js');

const email = 'tu-email@example.com';
const password = 'tu-contraseña-super-segura';

const emailHash = CryptoJS.SHA256(email.trim().toLowerCase()).toString();
const passwordHash = CryptoJS.SHA256(password).toString();

console.log('EMAIL_HASH =', \"'\" + emailHash + \"'\");
console.log('PASSWORD_HASH =', \"'\" + passwordHash + \"'\");
"
```

Copia la salida:
```
EMAIL_HASH = '1234567890abcdef...'
PASSWORD_HASH = 'fedcba0987654321...'
```

### Paso 2: Actualizar `lib/auth.ts`

```bash
# Abre el archivo
nano lib/auth.ts

# O con tu editor:
code lib/auth.ts
```

Busca y reemplaza:

```typescript
// Antes:
const EMAIL_HASH = '1425af658e3ef015fbec3871268bdfb991d1de94b03d41e201a2d40c9f8705b9'
const PASSWORD_HASH = '566321247a793684d11256a83791a9ccffd68fad0fc60c3fb00be556ddd758df'

// Después:
const EMAIL_HASH = '1234567890abcdef...'  // Tu nuevo hash
const PASSWORD_HASH = 'fedcba0987654321...'  // Tu nuevo hash
```

### Paso 3: Verificar cambios

```bash
npm run dev
```

Intenta:
- Login con **email antiguo** → Debe fallar ❌
- Login con **email nuevo** → Debe funcionar ✅

### Paso 4: Commit (si no usarás este repo más)

```bash
git add lib/auth.ts
git commit -m "security: Update login credentials"

# Verifica que no haya credenciales en plaintext:
git show HEAD
```

---

## Desarrollo Local

### Estructura de archivos importante

```
cv-generator/
├── app/                  # Rutas y páginas
├── components/          # React components
├── lib/                 # Lógica compartida
├── hooks/               # Custom hooks
├── store/               # Zustand stores
├── types/               # TypeScript types
├── docs/                # Archivos de ejemplo
└── ...
```

### Editar la experiencia real

El archivo principal que carga es `docs/cv-experiencia-real.json`.

**Para cargar tu experiencia real:**

1. Edita o reemplaza `docs/cv-experiencia-real.json`
2. Ve a la app → Experience → Click "Importar JSON"
3. Selecciona tu archivo
4. La app cargará automáticamente

**Estructura esperada:**
```json
{
  "schemaVersion": 1,
  "basics": {
    "fullName": "Tu nombre",
    "contact": { "email": "...", "phone": "..." }
  },
  "education": [ { ... } ],
  "experience": [ { ... } ],
  "leadership": [ { ... } ],
  "skills": { "technical": [...], "languages": [...] }
}
```

Ver `docs/json-schema-cv-generator.json` para el schema completo.

### Scripts útiles

```bash
# Desarrollo
npm run dev              # Hot reload server

# Build y producción
npm run build            # Compilar para producción
npm start                # Iniciar servidor producción

# Código
npm run format           # Formatear con Prettier
npm run format:check     # Verificar formato (sin cambiar)
npm run lint             # Verificar ESLint
npm run lint --fix       # Arreglar problemas automáticamente

# Testing (solo config)
npm test                 # Ejecutar vitest (requiere tests implementados)
```

### Debugging

**DevTools útiles:**

1. **Application/Storage → RxDB:**
   - Ver bases de datos locales
   - Ver documentos de cada colección
   - Exportar/importar datos

2. **Console:**
   ```javascript
   // Acceder a stores desde console
   const { useAuthStore } = await import('./store/auth-store.js')
   useAuthStore.getState()  // Ver estado actual

   const { useSettings } = await import('./hooks/use-settings.js')
   // Etc
   ```

3. **Network:**
   - Ver llamadas a APIs de IA
   - Verificar headers (x-api-key, etc)
   - Debugging de CORS

---

## Deploy a Producción

### ⚠️ LISTA DE SEGURIDAD

Antes de deployar, completa esta lista (ver [SECURITY.md](./SECURITY.md)):

- [ ] Cambié credenciales hardcodeadas
- [ ] No commitee credenciales en plaintext
- [ ] Implementé backend proxy para APIs
- [ ] Configuré HTTPS
- [ ] Agregué session timeout
- [ ] `.env.local` está en `.gitignore`
- [ ] Verificué `npm audit` (sin vulnerabilidades)

### Opción 1: Vercel (Recomendado para Next.js)

**Ventajas:** Integración perfecta, deploy automático, HTTPS gratis

1. Crea cuenta en https://vercel.com
2. Instala CLI: `npm install -g vercel`
3. Deploy:
   ```bash
   vercel
   ```
4. Sigue el wizard:
   - Selecciona proyecto
   - Detecta Next.js automáticamente
   - Elige ambiente (production)
5. Configurar variables:
   ```bash
   vercel env add ANTHROPIC_API_KEY
   # Ingresa tu key
   ```

### Opción 2: Netlify

1. Crea cuenta en https://netlify.com
2. Conecta repo GitHub
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Agregar variables de entorno:
   - Settings → Environment → Add
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...`

### Opción 3: Self-hosted (VPS)

```bash
# 1. Conectar a servidor
ssh root@tu-server.com

# 2. Instalar Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install nodejs

# 3. Clonar y setup
git clone https://github.com/tu-usuario/cv-generator.git
cd cv-generator
npm install

# 4. Crear .env
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

# 5. Build
npm run build

# 6. Usar PM2 para mantenerlo corriendo
npm install -g pm2
pm2 start "npm start" --name cv-generator
pm2 startup
pm2 save

# 7. Configurar nginx como reverse proxy
# (Asegurar HTTPS con Let's Encrypt)
```

### Configurar backend proxy (IMPORTANTE)

**Archivo:** `pages/api/ai/parse.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { jobOffer } = req.body

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: jobOffer }]
      })
    })

    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    res.status(500).json({ error: 'API request failed' })
  }
}
```

**Actualizar `lib/ai.ts`:**

```typescript
async function extractWithClaude(text: string) {
  // Cambiar:
  // - De: await fetch('https://api.anthropic.com/v1/messages', ...)
  // - A: await fetch('/api/ai/parse', ...)

  const res = await fetch('/api/ai/parse', {
    method: 'POST',
    body: JSON.stringify({ jobOffer: text })
  })
  // ...
}
```

### Verificar deploy

1. Abre tu URL: `https://tu-dominio.com`
2. Login con credenciales nuevas
3. Prueba crear aplicación
4. Prueba generar CV
5. Verifica Settings → API Key guarda correctamente

---

## Troubleshooting

### "npm install falla con errores de dependencias"

```bash
# Limpiar cache
npm cache clean --force
rm -rf node_modules package-lock.json

# Reinstalar
npm install

# Si aún falla, verificar Node:
node --version  # Debe ser 18+
npm --version   # Debe ser 9+
```

### "IndexedDB está vacío"

```bash
# Verificar en DevTools:
# F12 → Application → Indexed Databases

# Si está vacío, reinicializar:
1. Abre DevTools (F12)
2. Application → Clear site data
3. Recarga página (Ctrl+R)
4. Login nuevamente

# Los datos iniciales se cargan automáticamente
```

### "API key no funciona"

1. Verifica que la key es correcta:
   ```bash
   echo $ANTHROPIC_API_KEY  # Si está en .env
   ```

2. Prueba desde terminal:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: sk-ant-..." \
     -H "content-type: application/json" \
     -d '{"model": "claude-haiku-4-5-20251001", "max_tokens": 100, "messages": [{"role": "user", "content": "Hello"}]}'
   ```

3. En la app, verifica que:
   - Settings → El modelo está seleccionado
   - El API Key está guardado
   - Recarga la página (F5)

### "CV no cabe en 1 página"

1. Usa el botón "Vista previa" en Step 2
2. Reduce bullets (máx 4-5 recientes, 3 otros)
3. Elimina Education/Leadership si no es relevante
4. Condensa Skills (solo tecnologías relevantes)

### "No puedo cambiar credenciales"

```bash
# Verifica que generaste hashes correctamente:
node -e "const CryptoJS = require('crypto-js'); console.log(CryptoJS.SHA256('test@example.com'.toLowerCase()).toString())"

# Verifica que editaste lib/auth.ts:
grep "EMAIL_HASH = " lib/auth.ts

# Verifica que recargaste la app:
npm run dev  # Reinicia servidor
# Luego abre en navegador nuevo o limpia cache
```

### "Compilación falla con errores TypeScript"

```bash
# Verificar tipos:
npx tsc --noEmit

# Si hay errores, arreglador automáticamente:
npm run lint --fix

# Rebuild:
npm run build
```

---

## 📞 Soporte

Si algo no funciona:

1. **Lee primero:**
   - [README.md](./README.md) - Guía general
   - [SECURITY.md](./SECURITY.md) - Seguridad
   - Este SETUP_GUIDE.md - Setup

2. **Verifica:**
   - Node version: `node --version` (18+)
   - npm version: `npm --version` (9+)
   - `.env.local` existe
   - `node_modules/` existe

3. **Debug:**
   - DevTools (F12) → Console (errores JavaScript)
   - DevTools → Network (llamadas a API)
   - DevTools → Application → IndexedDB (datos)

4. **Reporta bug:**
   - Email: cristian.c.romero.p@gmail.com
   - O: GitHub Issues (no secretos)

---

**Última actualización:** 2026-03-06
