# AI CV Generator

**AI-powered CV generator that creates ATS-optimized resumes by analyzing job postings in real-time**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![RxDB](https://img.shields.io/badge/RxDB-Local%20First-brightgreen)](https://rxdb.info/)

Una plataforma web moderna para generar, editar y administrar CVs optimizados para ATS mediante inteligencia artificial. Centraliza ofertas laborales, genera CVs contextualizados y rastrea el estado de tus aplicaciones.

## Por qué AI CV Generator

- **Generación instantánea** — Pega una oferta laboral, obtén un CV optimizado en segundos
- **Análisis con IA** — Claude/GPT/DeepSeek analizan automáticamente los requisitos
- **Score de coincidencia** — Ve el porcentaje de match antes de aplicar
- **Sin backend** — Todos tus datos se guardan en tu navegador (privacidad total)
- **Optimizado para ATS** — Una página, formato limpio para sistemas de selección
- **Multi-usuario** — Login con Google, GitHub o Email/Password via Clerk

## Características Principales

- **Autenticación** — Google OAuth, GitHub OAuth, Email/Password (Clerk v7+)
- **Dashboard de aplicaciones** — Rastrear ofertas, salarios, beneficios, estado y timeline
- **Editor de experiencia** — Importar, editar y exportar experiencia profesional en JSON
- **Generador de CV con IA** — Análisis automático y generación optimizada en 3 pasos
- **Matching análisis** — Comparación visual entre oferta y CV con score
- **Optimización con IA** — Diff view para revisar cambios antes de aplicar
- **Almacenamiento local** — RxDB/IndexedDB, datos aislados por usuario

## Quick Start

### Requisitos

- Node.js 18+
- Cuenta en [Clerk](https://clerk.com) para autenticación

### Instalación

```bash
git clone https://github.com/crisak/ai-cv-generator.git
cd ai-cv-generator
npm install
cp .env.example .env.local
```

Editar `.env.local` con las keys de Clerk (ver sección Configuración).

```bash
npm run dev
# Abrir http://localhost:3000
```

### Configuración de Clerk

1. Crear app en [Clerk Dashboard](https://dashboard.clerk.com)
2. Copiar `Publishable Key` y `Secret Key` al `.env.local`
3. Habilitar Social connections: Google y GitHub

Variables requeridas en `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/applications
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/applications
```

## Guía de Uso

### 1. Dashboard (Rastreo de aplicaciones)

- **Nueva aplicación**: Click en "Nueva aplicación"
- **Cambiar estado**: Dropdown de estado en la tabla
- **Timeline**: Historial de estados por aplicación
- **Favoritos**: Marcar aplicaciones relevantes

Campos editables: empresa, puesto, salario, beneficios, estado, notas.

### 2. Editor de Experiencia

Importa tu experiencia desde un JSON o edita directamente en la app:
- Datos básicos, educación, experiencia, liderazgo, skills

Exporta para respaldar tus cambios.

### 3. Generador de CV (3 pasos)

**Paso 1**: Pega la oferta laboral — la IA extrae empresa, puesto y requisitos automáticamente.

**Paso 2**: Layout de 3 columnas:
- Izquierda: selecciona bullets por sección, edita inline
- Centro: preview en vivo del CV
- Derecha: score de coincidencia, alertas, botón continuar

Toolbar: Vista previa · Ver oferta · Chat IA · Optimizar con IA (diff review)

**Paso 3**: CV renderizado en formato ATS — descarga como PDF o guarda en historial.

### 4. Configuración

- `/settings` — Modelo de IA (Claude, GPT-4o, DeepSeek, Gemini, Grok) + API key
- `/profile` — Nombre, apellido y tema (oscuro/claro/sistema)

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Estilos | TailwindCSS 4, shadcn/ui |
| Auth | Clerk v7+ |
| Estado | Zustand 5 |
| Formularios | React Hook Form, Zod |
| BD Local | RxDB 15 (Dexie/IndexedDB) |
| Herramientas | Prettier, ESLint, Vitest |

## Estructura del Proyecto

```
middleware.ts                     — Protección de rutas (Clerk, Edge)
app/
  (auth)/login/[[...sign-in]]/   — Login (Clerk)
  (auth)/sign-up/[[...sign-up]]/ — Registro (Clerk)
  (app)/applications/            — Dashboard postulaciones
  (app)/experience/              — Editor de experiencia
  (app)/cv-generator/            — Generador 3 pasos
  (app)/cvs/                     — Historial de CVs
  (app)/settings/                — Modelo IA + API key
  (app)/profile/                 — Perfil + tema
lib/db/                          — RxDB schemas e inicialización por usuario
lib/ai.ts                        — Análisis de ofertas con IA/regex
lib/ai-cv.ts                     — Generación y optimización de CVs
hooks/                           — use-applications, use-cvs, use-experience, use-settings
components/layout/sidebar.tsx    — Sidebar con dropdown de usuario (Clerk useUser)
docs/                            — JSON schema y experiencia de ejemplo
```

## Scripts

```bash
npm run dev              # Dev server con hot reload
npm run build            # Build producción
npm run lint             # ESLint
npm run format           # Prettier
```

## Solución de Problemas

**"IA no genera nada"** — Sin API key usa fallback regex. Verifica la key en `/settings`.

**"CV no cabe en 1 página"** — Reduce bullets (máx 4-5 recientes, 3 otros). Usa "Vista previa" en Paso 2.

**"Formulario no guarda"** — Verifica que IndexedDB no esté deshabilitado (modo incógnito lo limita).

## Contribuir

1. Fork el repositorio
2. Crea rama: `git checkout -b feature/tu-feature`
3. Formatea: `npm run format`
4. Commit: `git commit -m "feat: descripción"`
5. Abre PR

## Licencia

MIT License
