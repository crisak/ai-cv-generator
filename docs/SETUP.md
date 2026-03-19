# Guía Técnica — AI CV Generator

Documentación de referencia para desarrolladores: configuración del entorno, variables de entorno, estructura del proyecto y comandos.

---

## Requisitos

- **Node.js** 18+
- **pnpm** 9+
- Cuenta en [Clerk](https://clerk.com) (autenticación)
- API key de al menos un proveedor de IA (opcional para desarrollo básico)

---

## Instalación

```bash
git clone https://github.com/crisak/ai-cv-generator.git
cd ai-cv-generator
pnpm install
cp .env.example .env.local
```

Edita `.env.local` con tus variables (ver sección siguiente).

```bash
pnpm dev
# Disponible en http://localhost:3000
```

---

## Variables de Entorno

### Requeridas

```env
# Clerk — Autenticación
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk — URLs de redirección
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/applications
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/applications
```

### Opcionales (proveedores de IA)

Las API keys de IA se configuran por usuario desde `/settings` en runtime. No requieren variables de entorno para desarrollo local.

Si necesitas configurar una key fija para testing a nivel de servidor:

```env
# Solo para uso en API routes server-side (si aplica)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

---

## Configuración de Clerk

1. Crear una app en [Clerk Dashboard](https://dashboard.clerk.com)
2. En **API Keys**, copiar `Publishable Key` y `Secret Key` al `.env.local`
3. En **Social connections**, habilitar:
   - Google OAuth
   - GitHub OAuth
4. En **Redirects**, verificar que las URLs de sign-in y sign-up coincidan con las del `.env.local`

> Las rutas de Clerk usan catch-all: `[[...sign-in]]` y `[[...sign-up]]` — esto es un requerimiento de Clerk v7+ y no debe modificarse.

---

## Estructura del Proyecto

```
proxy.ts                               — Protección de rutas (Clerk, Edge Runtime)

app/
  page.tsx                             — Landing page pública (ruta /)
  (auth)/
    login/[[...sign-in]]/              — Página de login (Clerk)
    sign-up/[[...sign-up]]/            — Página de registro (Clerk)
  (app)/
    applications/                      — Dashboard de postulaciones
    experience/                        — Editor de experiencia laboral
    cv-generator/                      — Generador de CV (flujo 3 pasos)
    cvs/                               — Historial de CVs generados
    settings/                          — Configuración de modelo IA y API keys
    profile/                           — Perfil de usuario y tema
  api/
    ai/parse/                          — POST route (server-side, protegida por Clerk)

components/
  applications/                        — Componentes del dashboard de postulaciones
  cv-generator/                        — Componentes del generador (steps, preview, toolbar)
  cv/                                  — Render del CV en formato ATS
  experience/                          — Formularios del editor de experiencia
  landing/                             — Componentes del landing page (hero, benefits, screenshots, etc.)
  layout/
    sidebar.tsx                        — Sidebar con navegación y dropdown de usuario
  ui/                                  — Componentes shadcn/ui customizados

lib/
  ai.ts                                — Análisis de ofertas laborales (IA + fallback regex)
  ai-cv.ts                             — Generación y optimización de CVs con IA
  utils.ts                             — Utilidades generales
  db/
    index.ts                           — Inicialización de RxDB por usuario
    schemas/                           — Schemas RxDB por colección

hooks/
  use-applications.ts                  — CRUD de postulaciones (RxDB)
  use-cvs.ts                           — CRUD de CVs generados (RxDB)
  use-experience.ts                    — CRUD de experiencia laboral (RxDB)
  use-settings.ts                      — Configuración de IA (RxDB)
  use-db.ts                            — Inicialización y acceso a la instancia RxDB
  use-toast.ts                         — Notificaciones toast

store/
  theme-store.ts                       — Estado del tema (Zustand)

types/
  cv.ts                                — Tipos TypeScript del schema CV
  experience.ts                        — Tipos de experiencia laboral

docs/
  PRD.md                               — Product Requirements Document
  SETUP.md                             — Este archivo
  json-schema-cv-generator.json        — JSON Schema del CV (fuente de verdad)
  cv-experiencia-real.json             — Ejemplo de experiencia laboral
  .draft/                              — Documentos internos (gitignored)
```

---

## Base de Datos Local (RxDB)

La app usa **RxDB v15** con IndexedDB como storage. No hay backend ni base de datos remota.

### Aislamiento por usuario

Cada usuario tiene su propia instancia de base de datos:

```
cvgeneratordb-{userId}
```

Esto garantiza que los datos de un usuario nunca se mezclen con los de otro en el mismo navegador.

### Colecciones

| Colección      | Descripción                        |
| -------------- | ---------------------------------- |
| `applications` | Postulaciones laborales            |
| `cvs`          | CVs generados                      |
| `experience`   | Experiencia laboral del usuario    |
| `settings`     | Configuración de IA y preferencias |

### Limpieza al cerrar sesión

Al hacer logout se llama `clearDbInstance(userId)` para limpiar la instancia activa en memoria. Los datos en IndexedDB persisten para el próximo login.

### Limitación conocida

IndexedDB está **deshabilitado en modo incógnito** en algunos navegadores. La app muestra una advertencia en ese caso. Para desarrollo, usar modo normal.

---

## Patrones de Implementación

### Hydration segura (SSR)

Cualquier componente que lea `useTheme()` de Zustand debe incluir un guard de `mounted` para evitar errores de hidratación:

```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null
```

### Layout del Paso 2 (generador)

```css
grid-cols-[300px_1fr_300px] h-[calc(100vh-280px)]
```

Los paneles laterales y el preview central son sticky mediante `flex flex-col h-full` + `flex-1` spacer.

### Tooltips

Patrón con Tailwind puro (sin librería):

```tsx
<div className="group relative">
  <button>Hover</button>
  <span className="absolute hidden group-hover:block ...">Tooltip</span>
</div>
```

---

## Scripts

```bash
pnpm dev           # Dev server con hot reload (localhost:3000)
pnpm build         # Build de producción
pnpm lint          # ESLint
pnpm format        # Prettier (formatea todos los archivos)
```

---

## Compatibilidad de Extracción por URL

Al pegar una URL en el Paso 1 del generador, la app intenta extraer el contenido usando Cloudflare Browser Rendering.

| Plataforma               | Estado       | Método                            |
| ------------------------ | ------------ | --------------------------------- |
| Computrabajo             | Funciona     | Selector `.box_offer`             |
| Elempleo                 | Funciona     | Selector `[class*="description"]` |
| Rappi / Workday          | Funciona     | Renderizado JS completo           |
| MercadoLibre / Eightfold | Funciona     | Meta tags                         |
| GetOnBoard               | Funciona     | Markdown directo                  |
| LinkedIn                 | No soportado | Anti-bot agresivo                 |
| Indeed                   | No soportado | Anti-bot agresivo                 |
| InfoJobs                 | No soportado | Captcha Cloudflare                |

**Para plataformas no soportadas**: selecciona todo el texto de la oferta (Ctrl+A / Cmd+A) y pégalo en la pestaña **Texto plano** del formulario.

---

## Solución de Problemas

**"La IA no genera nada"**  
Sin API key la app usa fallback con regex/heurísticas. Verifica que tengas una API key válida en `/settings` y que el modelo seleccionado coincida con la key.

**"El CV no cabe en 1 página"**  
Reduce la cantidad de bullets seleccionados (máx. 4-5 en el rol más reciente, 3 en los demás). Usa la vista previa en el Paso 2 para verificar antes de continuar.

**"El formulario no guarda"**  
Verifica que IndexedDB no esté deshabilitado. El modo incógnito lo limita en Chrome. Usa modo normal de navegación.

**"Error de hidratación en SSR"**  
Asegúrate de que cualquier lectura de `useTheme()` esté protegida con el guard de `mounted` (ver sección de patrones).

---

## Contribuir

Consulta la [guía de contribución](../CONTRIBUTING.md) para instrucciones detalladas sobre cómo contribuir al proyecto.

---

## Tech Stack

| Capa          | Tecnología            | Versión                |
| ------------- | --------------------- | ---------------------- |
| Framework     | Next.js               | 16                     |
| UI Library    | React                 | 19                     |
| Lenguaje      | TypeScript            | 5                      |
| Estilos       | TailwindCSS           | 4                      |
| Componentes   | shadcn/ui             | latest                 |
| Auth          | Clerk                 | 7+                     |
| Estado global | Zustand               | 5                      |
| Formularios   | React Hook Form + Zod | latest                 |
| BD local      | RxDB (IndexedDB)      | 15                     |
| Testing       | Vitest                | configurado, sin tests |
| Linting       | ESLint + Prettier     | latest                 |
| Animaciones   | framer-motion + GSAP  | solo features nuevas   |
| Licencia      | MPL-2.0               | —                      |
