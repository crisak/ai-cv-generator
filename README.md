# AI CV Generator 🤖

**AI-powered CV generator that creates ATS-optimized resumes by analyzing job postings in real-time**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![RxDB](https://img.shields.io/badge/RxDB-Local%20First-brightgreen)](https://rxdb.info/)

Una plataforma web moderna para generar, editar y administrar CVs optimizados para ATS (Applicant Tracking Systems) mediante inteligencia artificial. Simplifica el proceso de candidatura a empleos centralizando ofertas laborales, generando CVs contextualizados y rastreando el estado de tus aplicaciones.

## ✨ ¿Por qué AI CV Generator?

- **⚡ Generación instantánea de CV** — Pega una oferta laboral, obtén un CV optimizado en segundos
- **🤖 Análisis con IA** — Claude/GPT analizan automáticamente los requisitos
- **📊 Score de coincidencia** — Ve el porcentaje de match antes de aplicar
- **💾 Sin backend** — Todos tus datos se guardan en tu navegador (privacidad total)
- **🎨 Optimizado para ATS** — Una página, formato limpio para sistemas de selección
- **🔐 Privacidad primero** — Cero tracking, cero APIs de terceros (excepto tu clave de IA)
- **🌙 Modo oscuro/claro** — Interfaz moderna y adaptable

## 🎯 Características Principales

- **🔐 Autenticación local** - Login con credenciales simples (sin backend)
- **📊 Dashboard de aplicaciones** - Rastrear ofertas laborales, salarios, beneficios y estado
- **📝 Editor de experiencia** - Importar, editar y exportar tu experiencia profesional
- **🤖 Generador de CV con IA** - Análisis automático de ofertas y generación optimizada en 3 pasos
- **🎨 Matching análisis** - Comparación visual entre oferta y CV con score de coincidencia
- **⚙️ Optimización con IA** - Revisión de cambios antes de aplicar (diff view)
- **💾 Almacenamiento local** - Todo se guarda en tu navegador (RxDB/IndexedDB)

## 🚀 Quick Start

### Requisitos Previos

- Node.js 18+ y npm/yarn
- Un navegador moderno (Chrome, Firefox, Safari, Edge)
- (Opcional) API Key de un proveedor de IA para optimizar la generación de CVs

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/crisak/ai-cv-generator.git
cd ai-cv-generator

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (opcional)
# Ver SETUP_GUIDE.md para detalles de API keys
cp .env.example .env.local

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Abrir en navegador
# http://localhost:3000
```

### Login por defecto (Ejemplo)

```
Email: user@example.com
Contraseña: password123
```

⚠️ **IMPORTANTE**: Estas son credenciales de ejemplo genéricas (no datos reales).
- Para cambiar, ver [SETUP_GUIDE.md](./SETUP_GUIDE.md) → "Cambiar credenciales"
- Para entender seguridad, ver [SECURITY.md](./SECURITY.md)

## 📋 Guía de Uso

### 1. Dashboard (Rastreo de aplicaciones)

- **Nueva aplicación**: Click en "Nueva aplicación"
- **Editar**: Haz click en la fila de una aplicación
- **Cambiar estado**: Usa el dropdown de estado en la tabla
- **Ver timeline**: Click en el icono de timeline para ver el historial
- **Exportar a IA**: Botón "Generar CV" vinculado a la aplicación

**Campos editables:**
- Empresa, Puesto, Fuente
- Salario ofrecido y moneda
- Beneficios (agrega con Enter/coma)
- Estado (Pendiente, Entrevista, Rechazado, Oferta, Negociación)
- Notas y siguientes pasos
- Marcar como favorita

### 2. Editor de Experiencia

Importa tu experiencia real desde un archivo JSON o edita directamente:

- **Datos básicos**: Nombre, contacto
- **Educación**: Instituciones, títulos, años
- **Experiencia**: Roles, empresas, bullets con logros
- **Liderazgo**: Proyectos liderados, mentorías
- **Skills**: Técnicas, idiomas, herramientas

Exporta en cualquier momento para respaldar tus cambios.

### 3. Generador de CV (3 pasos)

#### **Paso 1: Oferta Laboral**
- Pega el texto completo de la oferta laboral
- La IA analiza automáticamente: empresa, puesto, requisitos, beneficios
- O vincula a una aplicación existente desde el dashboard

#### **Paso 2: Seleccionar Bullets (Columna Triple)**
- **Columna izquierda**: Bullets por sección, selecciona cuáles incluir, edita inline
- **Columna central**: Preview en vivo del CV con cambios
- **Columna derecha**:
  - Score de coincidencia con la oferta
  - Alertas (páginas estimadas, bullets no-ATS, requisitos faltantes)
  - Botón "Continuar"

**Toolbar (4 botones):**
- 👁️ **Vista previa** - Imprime y verifica 1 página
- 📋 **Ver oferta** - Busca y destaca palabras clave
- 💬 **Chat IA** - Mejora bullets con conversación
- ✨ **Optimizar con IA** - Reescribe automáticamente para matching máximo

**Optimizar con IA:**
1. Click en "Optimizar con IA"
2. (Opcional) Agrega contexto adicional
3. Selecciona sugerencias predefinidas o escribe la tuya
4. Revisa los cambios en el diff (lado a lado: Antes | Sugerencia)
5. Acepta/rechaza cambios individuales
6. Permanece en Step 2 para revisar en vivo

#### **Paso 3: Resultado Final**
- CV renderizado en formato ATS-optimizado
- Verifica se vea bien en 1 página
- Descarga como PDF
- Guarda en tu historial (vinculado a la aplicación si aplica)

### 4. Configuración

- **Modelo de IA**: Selecciona Claude, GPT-4o, Gemini, Grok o DeepSeek
- **API Key**: Ingresa la clave para usar optimizaciones con IA (se guarda localmente)
- **Nombre de perfil**: Muestra en la interfaz
- **Tema**: Oscuro, claro o sistema

## 🔧 Configuración Avanzada

### Cambiar credenciales de login

⚠️ **Importante**: Las credenciales están hasheadas. Si quieres cambiarlas:

1. Lee [SECURITY.md](./SECURITY.md) completamente
2. Ejecuta:
   ```bash
   node -e "const CryptoJS = require('crypto-js'); console.log(CryptoJS.SHA256('tu-email@example.com').toString())"
   ```
3. Reemplaza `EMAIL_HASH` en `lib/auth.ts`
4. Repite para la contraseña con `PASSWORD_HASH`

### Importar experiencia real

Usa el archivo `docs/cv-experiencia-real.json` como plantilla. Estructura:

```json
{
  "schemaVersion": 1,
  "basics": { "fullName", "contact": {...} },
  "education": [...],
  "experience": [...],
  "leadership": [...],
  "skills": { "technical": [...], "languages": [...] }
}
```

### Usar API de IA desde el navegador

- Anthropic (Claude): Obtén tu key en [console.anthropic.com](https://console.anthropic.com)
- OpenAI (GPT): [platform.openai.com](https://platform.openai.com)
- Google (Gemini): [aistudio.google.com](https://aistudio.google.com)
- DeepSeek: [platform.deepseek.com](https://platform.deepseek.com)
- xAI (Grok): [console.x.ai](https://console.x.ai)

Ver [SETUP_GUIDE.md](./SETUP_GUIDE.md) para pasos detallados.

## 🏗️ Estructura del Proyecto

```
cv-generator/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Rutas de autenticación
│   │   └── login/page.tsx
│   ├── (app)/                   # Rutas protegidas
│   │   ├── applications/        # Dashboard de aplicaciones
│   │   ├── experience/          # Editor de experiencia
│   │   ├── cv-generator/        # Generador 3 pasos
│   │   ├── settings/            # Configuración
│   │   └── layout.tsx
│   └── layout.tsx
├── components/                   # React components (shadcn/ui + custom)
│   ├── ui/                      # shadcn/ui primitivos
│   ├── applications/            # Componentes del dashboard
│   ├── cv/                      # CV viewer y rendering
│   ├── cv-generator/            # Componentes del generador
│   └── experience/              # Componentes del editor
├── lib/                          # Lógica compartida
│   ├── db/                      # RxDB schemas e inicialización
│   ├── auth.ts                  # Verificación de credenciales (SHA-256)
│   ├── ai.ts                    # Análisis de ofertas con IA/regex
│   └── ai-cv.ts                 # Generación y optimización de CVs
├── hooks/                        # Custom React hooks
│   ├── use-applications.ts      # CRUD de aplicaciones
│   ├── use-cvs.ts               # CRUD de CVs
│   ├── use-experience.ts        # CRUD de experiencia
│   └── use-settings.ts          # Lectura/escritura de settings
├── store/                        # Zustand stores
│   ├── auth-store.ts            # Estado de autenticación
│   └── theme-store.ts           # Preferencia de tema
├── types/                        # TypeScript definitions
├── docs/                         # Archivos de ejemplo
│   ├── cv-experiencia-real.json
│   └── json-schema-cv-generator.json
├── CLAUDE.md                     # Project guidelines (desarrollo)
├── SECURITY.md                   # ⚠️ Guía de seguridad (antes de deployar)
└── package.json
```

## 🔐 Seguridad

- ✅ **Datos locales**: Todo se almacena en IndexedDB (tu navegador, no servidores)
- ✅ **Credenciales hasheadas**: Email/contraseña usan SHA-256 (no plaintext)
- ⚠️ **API Keys en RxDB**: Se guardan sin cifrado → no expongas en público
- ⚠️ **Llamadas API desde navegador**: Las keys se envían al proveedor de IA
- ✅ **Ningún tracking**: No hay telemetría, analytics ni cookies de terceros

**Antes de compartir o deployar, lee [SECURITY.md](./SECURITY.md) completamente.**

## 📦 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Next.js, React | 16+, 19+ |
| **Lenguaje** | TypeScript | 5 |
| **Estilos** | TailwindCSS, shadcn/ui | 4, custom |
| **Estado** | Zustand | 5 |
| **Formularios** | React Hook Form, Zod | 7, 3 |
| **BD Local** | RxDB (Dexie adapter) | 15 |
| **Herramientas** | Prettier, ESLint | 3, 9 |

## 🧪 Testing

- **Configurado**: Vitest (solo setup, sin implementación de tests)
- Para ejecutar: `npm test` (requiere implementación)

## 📝 Desarrollo

### Scripts disponibles

```bash
npm run dev              # Inicia dev server (hot reload)
npm run build            # Build para producción
npm start                # Inicia servidor Next.js
npm run lint             # Verifica ESLint
npm run format           # Formatea con Prettier
npm run format:check     # Verifica formato sin cambiar
npm test                 # Ejecuta tests (requiere implementación)
```

### Commits y PRs

- Sigue [CLAUDE.md](./CLAUDE.md) para arquitectura y patrones
- Formatea antes de hacer commit: `npm run format`
- Escribe commits descriptivos en presente (ej: "Add CV optimizer")
- Referencia issues: "fix #123"

### Agregar una nueva sección de CV

1. Edita `types/cv.ts` → Añade interfaz
2. Edita `lib/db/schemas.ts` → Actualiza RxDB schema
3. Crea componente en `components/experience/` → Usa mismo patrón
4. Añade tab en `app/(app)/experience/page.tsx`
5. Actualiza `lib/ai-cv.ts` → Assembly y generación

## 🐛 Solución de Problemas

### "Formulario no guarda cambios"
- Verifica que IndexedDB no esté deshabilitado (Settings privada/incógnito)
- Abre DevTools → Aplication/Storage → Verifica RxDB database existe

### "IA no genera nada"
- Sin API Key → usa fallback regex (funciona pero básico)
- API Key inválida → verifica en Settings, reinicia página
- Oferta texto muy largo → se trunca a 4000 caracteres

### "CV no cabe en 1 página"
- Reduce bullets (máx 4-5 recientes, 3 otros)
- Elimina sección Leadership si no es relevante
- Condensa skills (solo lo relevante para la oferta)
- Usa vista previa (Paso 2, botón "Vista previa")

### "Perdi mis datos"
- Revisa IndexedDB en DevTools
- Si está vacío: localStorage puede estar sincronizado (revisar local storage)
- Importa tu backup `cv-experiencia-real.json` en Experience Editor

## 🤝 Contribuir

1. Fork el repositorio
2. Crea rama: `git checkout -b feature/tu-feature`
3. Implementa, formatea: `npm run format`
4. Commit: `git commit -m "feat: Descripción"`
5. Push: `git push origin feature/tu-feature`
6. Abre PR con descripción clara

**Lee [SECURITY.md](./SECURITY.md) antes de hacer cambios relacionados con auth o credenciales.**

## 📄 Licencia

MIT License - Ver [LICENSE](./LICENSE) para detalles.

## 💬 Soporte

- 📖 Guía detallada: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- 🔐 Seguridad: [SECURITY.md](./SECURITY.md)
- 🏗️ Desarrollo: [CLAUDE.md](./CLAUDE.md)

---

**Creado por Cristian Camilo Romero**
- 📧 Email: xxxxxxxx@xxxx.com
- 💼 LinkedIn: [tu-profile]
- 🐙 GitHub: [tu-usuario]
