# Project Constitution — CV Generator Platform

## Misión

Plataforma web que automatiza la generación de CVs optimizados para ATS a partir de ofertas laborales, centraliza el tracking de postulaciones y permite editar experiencia real — todo local-first, sin backend.

## Tech Stack (no negociable)

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 + React + TypeScript |
| Styling | TailwindCSS v4 (dark/light, paleta azul Facebook) |
| UI Components | shadcn/ui |
| State | Zustand (solo tema) |
| Database | RxDB v15 (Dexie/IndexedDB) — local-first, sin backend |
| Auth | Clerk v7+ (Google OAuth, GitHub OAuth, Email/Password) |
| Validation | Zod |
| Code Quality | Prettier, ESLint |
| Testing | Vitest (config only, sin implementación) |
| AI | Multi-provider via configuración del usuario (Claude, GPT, Gemini, Grok, DeepSeek). Futuro: LiteLLM como gateway unificado |

## Principios de arquitectura

1. **Local-first**: RxDB como fuente de verdad. Sin API backend para persistencia. DB aislada por `userId`.
2. **Modularidad por dominio**: Cada bounded context tiene su spec, plan y tasks independientes.
3. **AI como herramienta, no como dueña**: La IA genera sugerencias; el usuario siempre revisa y aprueba (diff review, preview de goals, edición inline).
4. **ATS-first**: Todo CV generado debe ser optimizado para sistemas ATS. Máximo 1 página PDF.
5. **Español**: Todo contenido de CV y UI en español.

## Reglas de código

- TypeScript estricto en todo el proyecto
- Validación con Zod solo en boundaries del sistema (input de usuario, respuestas de API)
- No over-engineering: solución mínima para el requerimiento actual
- No crear abstracciones prematuras ni helpers para operaciones únicas
- No agregar comments, docstrings o type annotations a código no modificado
- Preferir editar archivos existentes sobre crear nuevos
- Usar patrones existentes del codebase antes de inventar nuevos

## Reglas de seguridad

- Auth exclusivamente via Clerk — NO reintroducir credenciales hardcodeadas
- API keys de IA configuradas por usuario, nunca en `.env` del servidor
- `middleware.ts` protege todas las rutas no públicas en Edge Runtime
- Sanitizar inputs antes de enviar a prompts de IA

## Bounded Contexts (dominios)

```
auth            → Autenticación y protección de rutas (Clerk)
applications    → Dashboard de postulaciones laborales
experience      → Editor de experiencia real
cv-generator    → Workflow de generación de CV (3 pasos) + viewer de CVs guardados
ai-provider     → Sistema multi-provider de IA (configuración, gateway, billing futuro)
settings        → Configuración de usuario (perfil, tema)
```

## Estructura del proyecto

```
/                          → Raíz del proyecto
├── constitution/          → Reglas permanentes del proyecto (este archivo)
├── specs/                 → Specs por dominio (specification + plan + tasks)
├── architecture/          → Diagramas y modelos de datos globales
├── app/                   → Next.js App Router (rutas y layouts)
├── components/            → Componentes React (por dominio + ui + layout)
├── lib/                   → Utilidades, DB, integraciones de IA
├── hooks/                 → Custom React hooks
├── store/                 → Zustand stores
├── types/                 → TypeScript type definitions
├── docs/                  → JSON schemas, experiencia real, guías
└── docs/.draft/           → Documentos internos/sensibles (gitignored)
```

## Workflow de desarrollo (SDD + Worktrees)

```
spec → plan → tasks → implementation (1 task = 1 PR)
```

Cada feature se desarrolla en un git worktree independiente:
```bash
git worktree add ../feat-ai-provider feat/ai-provider
```

El agente IA debe:
1. Leer `constitution/constitution.md` al inicio de cada sesión
2. Leer `specs/<dominio>/specification.md` antes de implementar
3. Seguir `specs/<dominio>/plan.md` para decisiones de arquitectura
4. Implementar tasks de `specs/<dominio>/tasks.md` secuencialmente
5. No inventar arquitectura fuera de lo especificado
