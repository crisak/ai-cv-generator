# Feature: AI Provider System

**Estado**: 🔶 Parcialmente implementado / Evolución planificada

---

## Problema

La app necesita un sistema flexible de proveedores de IA que permita al usuario elegir entre múltiples modelos. Actualmente funciona con llamadas directas a APIs individuales (Claude, GPT, DeepSeek). A futuro, se necesita un gateway unificado (LiteLLM) y un modelo de billing por tokens.

## Goals

### Fase actual (MVP) ✅
- Usuario selecciona modelo de IA en Settings
- Usuario configura su propio API key
- Llamadas a la API del provider seleccionado via `/api/ai/parse`
- Fallback a regex si no hay API key configurada

### Fase futura (post-MVP) 🔜
- **LiteLLM como gateway unificado**: un solo endpoint que rutea a cualquier provider
- **Modelos free-tier**: modelos gratuitos con límites (ej: DeepSeek, modelos open-source)
- **Modelos premium**: Claude Opus, GPT-4o, etc. — requieren suscripción
- **Billing por tokens**: tracking de consumo por usuario, límites por plan
- **Suscripción**: cuando el usuario agota el free-tier, ofrecer plan pago con límite de tokens mensual

## Visión de arquitectura futura

```
Usuario selecciona modelo
  → Frontend envía request a /api/ai/*
  → Backend verifica plan del usuario (free/premium)
  → Si free: solo modelos free-tier disponibles
  → Si premium: verifica tokens restantes del mes
  → Rutea via LiteLLM al provider correspondiente
  → Responde al frontend
  → Actualiza contador de tokens consumidos
```

## User Stories

### MVP (implementadas)
- Como usuario, puedo seleccionar entre Claude, GPT, Gemini, Grok, DeepSeek
- Como usuario, configuro mi API key para el provider que uso
- Como usuario, si no tengo API key la app usa extracción por regex como fallback

### Futuras
- Como usuario, puedo usar modelos gratuitos sin configurar API key
- Como usuario, veo cuántos tokens he consumido este mes
- Como usuario, cuando agoto el free-tier veo un prompt para suscribirme
- Como usuario premium, puedo usar modelos avanzados (Claude Opus, GPT-4o)
- Como usuario premium, veo mi consumo y tokens restantes en el dashboard

## Requerimientos funcionales

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR1 | Selector de modelo IA en Settings | ✅ |
| FR2 | Input de API key por usuario | ✅ |
| FR3 | Llamada a `/api/ai/parse` con model + apiKey | ✅ |
| FR4 | Fallback a regex sin API key | ✅ |
| FR5 | Modelos soportados: claude, gpt, deepseek (server-side) | ✅ |
| FR6 | LiteLLM como gateway unificado | ⬜ Pendiente |
| FR7 | Free-tier con modelos gratuitos | ⬜ Pendiente |
| FR8 | Billing por tokens (tracking de consumo) | ⬜ Pendiente |
| FR9 | Suscripción para modelos premium | ⬜ Pendiente |
| FR10 | Dashboard de consumo de tokens | ⬜ Pendiente |

## Consideraciones técnicas

### LiteLLM
- Proxy que unifica la interfaz de múltiples LLM providers
- Se puede desplegar como servicio separado o usar como librería Python
- Soporta: OpenAI, Anthropic, Google, Mistral, modelos open-source via Ollama
- Evaluar: ¿self-hosted o managed? ¿Python sidecar o servicio independiente?

### Billing
- Necesita backend real (no local-first) para tracking de tokens
- Opciones: Stripe para pagos, Clerk para gestión de plans, DB server-side para consumo
- Esto cambia la arquitectura de "sin backend" a "backend mínimo para billing"

### Migración
- Los usuarios con API key propia siguen funcionando igual (BYOK — Bring Your Own Key)
- El free-tier y premium son opciones adicionales, no reemplazan BYOK

## Archivos actuales

```
lib/ai.ts                  → parseJobOffer(), extractWithRegex(), callBackendProxy()
lib/ai-cv.ts               → generateCv(), optimizeCv()
app/api/ai/parse/route.ts  → POST route, server-side AI call
app/(app)/settings/page.tsx → Selector de modelo + API key
hooks/use-settings.ts       → Hook para leer/guardar settings (incl. aiModel, aiApiKey)
```
