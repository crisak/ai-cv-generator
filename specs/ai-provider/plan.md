# AI Provider — Plan de implementación

**Estado**: 🔶 MVP implementado, evolución pendiente

---

## Arquitectura actual (MVP) — Problema identificado

```
Settings (UI)
  → usuario selecciona modelo + API key
  → guardado en RxDB (collection: settings)

CV Generator / Job Offer parsing
  → lee settings del usuario
  → POST /api/ai/parse { jobOffer, model, apiKey }   ← solo parseJobOffer usa el proxy
  → route.ts selecciona provider (claude/gpt/deepseek)
  → llama API del provider directamente
  → responde con datos parseados

lib/ai-cv.ts (callAI, chatWithCv, suggestWithOpenAICompat, generateWithOpenAICompat)
  → llama directamente a la API del provider desde el browser   ← BUG: CORS bloqueado
  → DeepSeek y GPT no admiten llamadas browser-side sin header especial
  → Claude funciona solo por el header anthropic-dangerous-direct-browser-access
```

**Root cause**: `lib/ai-cv.ts` bypasea el proxy y llama a los providers directamente desde
el browser. DeepSeek bloquea CORS. La solución es centralizar TODAS las llamadas de IA
a través de un proxy Next.js server-side.

---

## Arquitectura nueva — AI Gateway Proxy con Factory Pattern (MVP)

### Principio de diseño

Una única entrada server-side para todas las llamadas de IA. El cliente solo conoce
el contrato `{ provider, model, payload, options }`. El servidor instancia el handler correcto
mediante una Factory y lo ejecuta.

```
Browser (cualquier componente/hook)
  → POST /api/ai/proxy { provider, payload }
      ↓
  AIProviderFactory.create(provider)   ← patrón Factory
      ↓
  handler.call(payload)                ← patrón Strategy (interfaz unificada)
      ↓
  API externa (Anthropic / OpenAI / DeepSeek / ...)
      ↓
  { text: string }   ← respuesta normalizada
```

### Contrato del endpoint (protocolo unificado)

**Request** `POST /api/ai/proxy`:
```ts
{
  provider: 'claude' | 'gpt' | 'deepseek'   // quién ejecuta
  apiKey: string                              // BYOK del usuario
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  maxTokens?: number                          // default: 800
  responseFormat?: 'text' | 'json_object'    // default: 'text',
  options: jsonstring // opciones custom por provedor
}
```

**Response** (siempre la misma forma):
```ts
{ text: string }                   // 200 OK
{ error: string; code: string }    // 4xx / 5xx
```

El cliente nunca sabe qué API externa se llamó ni cómo se formateó el request.
Cada provider maneja sus propios headers, modelos y formatos de respuesta internamente.

### Patrón de diseño: Factory + Strategy

**Por qué Factory**: permite instanciar el provider correcto en runtime sin que el
llamador conozca las implementaciones concretas. Escala agregando un nuevo handler
sin modificar el código existente.

**Por qué Strategy**: todos los providers exponen la misma interfaz `call()`, lo que
permite intercambiarlos transparentemente y testearlos de forma aislada.

```
AIProviderFactory           ← crea la instancia correcta
  .create('claude')  → ClaudeProvider implements AIProvider
  .create('gpt')     → GPTProvider    implements AIProvider
  .create('deepseek')→ DeepSeekProvider implements AIProvider
  .create('gemini')  → GeminiProvider   (futuro)
  .create('grok')    → GrokProvider     (futuro)
```

### Estructura de archivos

```
app/
  api/
    ai/
      proxy/
        route.ts             ← único endpoint de entrada (POST /api/ai/proxy)
      parse/
        route.ts             ← mantener por compatibilidad, migrar a proxy internamente
lib/
  ai-providers/
    types.ts                 ← AIProvider interface + AIRequest / AIResponse types
    factory.ts               ← AIProviderFactory.create(provider)
    claude.ts                ← ClaudeProvider
    gpt.ts                   ← GPTProvider
    deepseek.ts              ← DeepSeekProvider
  ai.ts                      ← reemplazar callBackendProxy → callProxy (usa /api/ai/proxy)
  ai-cv.ts                   ← eliminar callAI y fetch directos; usar callProxy
```

### Interfaz central (`lib/ai-providers/types.ts`)

```ts
export type AIProviderName = 'claude' | 'gpt' | 'deepseek'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIRequest {
  apiKey: string
  messages: AIMessage[]
  maxTokens?: number
  responseFormat?: 'text' | 'json_object'
}

export interface AIResponse {
  text: string
}

export interface AIProvider {
  call(req: AIRequest): Promise<AIResponse>
}
```

### Factory (`lib/ai-providers/factory.ts`)

```ts
import { ClaudeProvider }   from './claude'
import { GPTProvider }      from './gpt'
import { DeepSeekProvider } from './deepseek'
import type { AIProvider, AIProviderName } from './types'

export class AIProviderFactory {
  static create(provider: AIProviderName): AIProvider {
    switch (provider) {
      case 'claude':   return new ClaudeProvider()
      case 'gpt':      return new GPTProvider()
      case 'deepseek': return new DeepSeekProvider()
    }
  }
}
```

### Endpoint proxy (`app/api/ai/proxy/route.ts`)

```ts
// Única responsabilidad: validar entrada, delegar a Factory, devolver respuesta unificada
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()   // valida con Zod
  const provider = AIProviderFactory.create(body.provider)
  const result = await provider.call({ apiKey: body.apiKey, messages: body.messages, ... })
  return NextResponse.json({ text: result.text })
}
```

### Helper cliente (`lib/ai-proxy-client.ts`)

```ts
// Reemplaza callAI() y todos los fetch directos en ai-cv.ts
export async function callProxy(
  messages: AIMessage[],
  settings: SettingsDocument,
  maxTokens?: number,
  responseFormat?: 'text' | 'json_object'
): Promise<string>
```

---

## Mapa completo de llamadas de IA en el cliente

Todas las llamadas de IA del frontend deben pasar por `callProxy()`. Este es el inventario
completo identificado en el codebase:

### Funciones expuestas en `lib/ai-cv.ts` que hacen llamadas directas (a migrar)

| Función exportada | Llamada interna | Usado en | Contexto |
|-------------------|----------------|----------|----------|
| `improveBulletVariants()` | `callAI()` | `components/cv-generator/cv-editor.tsx:232` | Genera 3 variantes de un bullet en BulletAiPopover |
| `improveSkills()` | `callAI()` | `components/cv-generator/cv-editor.tsx:368` | Optimiza lista de habilidades técnicas en SkillsAiPopover |
| `improveNonAtsBullets()` | `callAI()` | `components/cv-generator/match-analysis.tsx:161` | Botón "Fix ATS" — mejora bullets sin verbo de acción |
| `chatWithCv()` | fetch directo | `components/cv-generator/ai-chat.tsx:68` | Chat interactivo sobre el CV (estilos: concise/normal/extended) |
| `suggestBullets()` | `suggestWithClaude()` / `suggestWithOpenAICompat()` | `app/(app)/cv-generator/page.tsx:77` | Paso 1→2: selección inteligente de bullets por oferta |
| `generateCv()` | `generateWithClaude()` / `generateWithOpenAICompat()` | `app/(app)/cv-generator/page.tsx:182` | Paso 2: optimización final del CV |
| `improveBullet()` | `callAI()` | no usado directamente en componentes | Mejora un bullet individual con instrucción |

### Función en `lib/ai.ts` que ya usa proxy (correcto)

| Función exportada | Cómo llama | Usado en | Estado |
|-------------------|-----------|----------|--------|
| `parseJobOffer()` | `extractWithBackendProxy()` → `POST /api/ai/parse` | `components/applications/application-form.tsx:152` | ✅ Ya usa proxy — migrar internamente a `/api/ai/proxy` |

### Funciones internas en `lib/ai-cv.ts` que desaparecen con la migración

| Función interna | Reemplazada por |
|----------------|----------------|
| `callAI()` | `callProxy()` del helper cliente |
| `suggestWithClaude()` | `callProxy()` con `responseFormat: 'json_object'` |
| `suggestWithOpenAICompat()` | `callProxy()` con `responseFormat: 'json_object'` |
| `generateWithClaude()` | `callProxy()` con `responseFormat: 'json_object'` |
| `generateWithOpenAICompat()` | `callProxy()` con `responseFormat: 'json_object'` |
| fetch directo en `chatWithCv()` | `callProxy()` con historial de mensajes |

### Estado actual vs estado objetivo

```
ANTES (bug)                              DESPUÉS (fix)

application-form.tsx                     application-form.tsx
  → parseJobOffer()                         → parseJobOffer()
      → POST /api/ai/parse ✅                   → callProxy() → POST /api/ai/proxy ✅

cv-generator/page.tsx                    cv-generator/page.tsx
  → suggestBullets()                        → suggestBullets()
      → fetch directo a Anthropic/            → callProxy() → POST /api/ai/proxy ✅
        OpenAI/DeepSeek ❌ CORS

  → generateCv()                            → generateCv()
      → fetch directo ❌ CORS                  → callProxy() → POST /api/ai/proxy ✅

cv-editor.tsx                            cv-editor.tsx
  → improveBulletVariants()                 → improveBulletVariants()
      → callAI() → fetch directo ❌            → callProxy() → POST /api/ai/proxy ✅
  → improveSkills()                         → improveSkills()
      → callAI() → fetch directo ❌            → callProxy() → POST /api/ai/proxy ✅

match-analysis.tsx                       match-analysis.tsx
  → improveNonAtsBullets()                  → improveNonAtsBullets()
      → callAI() → fetch directo ❌            → callProxy() → POST /api/ai/proxy ✅

ai-chat.tsx                              ai-chat.tsx
  → chatWithCv()                            → chatWithCv()
      → fetch directo ❌ CORS                  → callProxy() → POST /api/ai/proxy ✅
```

---

## Flujo de datos completo (post-implementación)

```
Usuario en CV Generator
  → settings.aiModel = 'deepseek', settings.aiApiKey = 'sk-...'

suggestBullets() en lib/ai-cv.ts
  → callProxy(messages, settings, 900, 'json_object')
      ↓
  POST /api/ai/proxy
  { provider: 'deepseek', apiKey: 'sk-...', messages: [...], responseFormat: 'json_object' }
      ↓
  AIProviderFactory.create('deepseek')  → DeepSeekProvider
      ↓
  fetch('https://api.deepseek.com/v1/chat/completions', ...)   ← server-side, sin CORS
      ↓
  { text: '{"selections": {...}}' }
      ↓
  suggestBullets() parsea el JSON y aplica selecciones
```

---

## Arquitectura futura (LiteLLM + billing)

Cuando se implemente LiteLLM, solo cambia el interior de cada Provider (o se agrega
`LiteLLMProvider`). El contrato del endpoint y el helper `callProxy` no cambian.

```
AIProviderFactory
  .create('claude')   → LiteLLMProvider('claude')    ← mismo interface, diferente impl
  .create('deepseek') → LiteLLMProvider('deepseek')
  .create('free-tier')→ LiteLLMProvider('free-tier') ← nuevo provider sin BYOK
```

**Flujo futuro con billing**:
```
POST /api/ai/proxy
  → auth() + verifyPlan(userId)          ← nuevo: verifica plan del usuario
  → AIProviderFactory.create(provider)
  → provider.call(req)
  → trackTokens(userId, tokensUsed)      ← nuevo: tracking de consumo
  → return response
```

---

## Decisiones de arquitectura

| Decisión | Elegida | Razón |
|----------|---------|-------|
| Patrón creacional | Factory | Instanciación por string en runtime, fácil de extender |
| Patrón de comportamiento | Strategy | Interface uniforme `call()`, testeable por separado |
| Ubicación del proxy | Next.js API Route | Sin infraestructura extra, elimina CORS, protegido por Clerk |
| Respuesta normalizada | `{ text: string }` | Desacopla formato de provider del código de negocio |
| Compatibilidad `parse/route.ts` | Migrar internamente | Evita breaking change en código existente |

---

## Dependencias actuales

- `lib/ai.ts` → lógica de parsing con IA
- `lib/ai-cv.ts` → generación y optimización de CV
- `app/api/ai/parse/route.ts` → server-side route (mantener, migrar internamente)
- `hooks/use-settings.ts` → settings con aiModel + aiApiKey

## Archivos que cambian en Task 9-1

| Archivo | Cambio |
|---------|--------|
| `lib/ai-providers/types.ts` | **Nuevo** — interface AIProvider + tipos |
| `lib/ai-providers/factory.ts` | **Nuevo** — AIProviderFactory |
| `lib/ai-providers/claude.ts` | **Nuevo** — ClaudeProvider |
| `lib/ai-providers/gpt.ts` | **Nuevo** — GPTProvider |
| `lib/ai-providers/deepseek.ts` | **Nuevo** — DeepSeekProvider |
| `app/api/ai/proxy/route.ts` | **Nuevo** — endpoint unificado |
| `lib/ai-cv.ts` | Eliminar callAI + fetch directos; usar callProxy |
| `lib/ai.ts` | Reemplazar callBackendProxy por callProxy |
| `app/api/ai/parse/route.ts` | Migrar internamente a usar AIProviderFactory |

## Archivos que cambiarán en la evolución (Fase 2+)

| Archivo | Cambio |
|---------|--------|
| `lib/ai-providers/factory.ts` | Agregar nuevos providers (Gemini, Grok, LiteLLM) |
| `app/api/ai/proxy/route.ts` | Agregar plan verification + token tracking |
| `hooks/use-settings.ts` | Agregar campo para tipo de plan (byok/free/premium) |
| `app/(app)/settings/page.tsx` | UI para elegir BYOK vs Platform |
| **Nuevo**: `lib/billing.ts` | Lógica de tracking de tokens y verificación de plan |
| **Nuevo**: `app/api/billing/` | Routes para consumo y suscripción |
