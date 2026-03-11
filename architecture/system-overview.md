# System Overview

## Diagrama de alto nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Auth   │  │Dashboard │  │Experience│  │ CV Generator  │   │
│  │  (Clerk) │  │  Apps    │  │  Editor  │  │  (3 steps)   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │              │               │            │
│       │         ┌────┴──────────────┴───────────────┤            │
│       │         │         RxDB (IndexedDB)          │            │
│       │         │    cvgeneratordb-{userId}          │            │
│       │         │                                    │            │
│       │         │  ┌─────────┐ ┌──────┐ ┌────────┐ │            │
│       │         │  │  apps   │ │ cvs  │ │settings│ │            │
│       │         │  │  exps   │ │      │ │        │ │            │
│       │         │  └─────────┘ └──────┘ └────────┘ │            │
│       │         └────────────────────────────────────┘            │
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │
        │  HTTPS
        ▼
┌───────────────────────────────────────────┐
│            NEXT.JS SERVER                  │
│                                            │
│  ┌──────────────┐  ┌───────────────────┐  │
│  │ middleware.ts │  │ /api/ai/parse     │  │
│  │ (Clerk Edge) │  │ (AI provider call)│  │
│  └──────────────┘  └────────┬──────────┘  │
│                              │             │
└──────────────────────────────┼─────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   AI Providers      │
                    │                     │
                    │  Claude (Anthropic) │
                    │  GPT (OpenAI)       │
                    │  DeepSeek           │
                    │  Gemini (Google)    │
                    │  Grok (xAI)         │
                    │                     │
                    │  Futuro: LiteLLM    │
                    │  gateway unificado  │
                    └─────────────────────┘
```

## Principios clave

1. **Local-first**: RxDB en IndexedDB es la fuente de verdad. No hay DB en el servidor.
2. **Server-side mínimo**: Solo `middleware.ts` (auth) y `/api/ai/parse` (proxy a AI providers).
3. **Aislamiento**: Cada usuario tiene su propia DB (`cvgeneratordb-{userId}`).
4. **BYOK**: El usuario trae su propio API key. El servidor solo la usa para hacer la llamada, no la almacena.

## Stack por capa

| Capa | Tecnología |
|------|-----------|
| UI | React + shadcn/ui + TailwindCSS |
| Routing | Next.js 16 App Router |
| State | Zustand (tema) + RxDB subscriptions (datos) |
| Persistence | RxDB v15 (Dexie adapter → IndexedDB) |
| Auth | Clerk v7+ (Edge middleware) |
| AI | Llamadas directas a APIs de providers (futuro: LiteLLM) |
| Validation | Zod |

## Flujos principales

### Login
```
/ → middleware.ts → no auth → redirect /login → Clerk → /applications
```

### Generar CV
```
Step 1: Pegar oferta → POST /api/ai/parse → extraer requisitos
Step 2: Seleccionar bullets → editar → optimizar con IA → draftCv
Step 3: Preview → descargar PDF → guardar en RxDB
```

### Logout
```
Clerk signOut() → clearDbInstance(userId) → redirect /login
```
