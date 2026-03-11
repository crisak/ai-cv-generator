# AI Provider — Plan de implementación

**Estado**: 🔶 MVP implementado, evolución pendiente

## Arquitectura actual (MVP)

```
Settings (UI)
  → usuario selecciona modelo + API key
  → guardado en RxDB (collection: settings)

CV Generator / Job Offer parsing
  → lee settings del usuario
  → POST /api/ai/parse { jobOffer, model, apiKey }
  → route.ts selecciona provider (claude/gpt/deepseek)
  → llama API del provider directamente
  → responde con datos parseados

Fallback
  → sin API key → regex extraction (client-side)
```

## Arquitectura futura (LiteLLM + billing)

```
Settings (UI)
  → BYOK: usuario pone su API key (funciona como hoy)
  → Platform: usuario usa modelos del platform (free/premium)

Request flow
  → POST /api/ai/* { jobOffer, model }
  → Backend verifica auth (Clerk)
  → Backend verifica plan del usuario:
      → BYOK: usa apiKey del usuario directo
      → Free: verifica que el modelo sea free-tier
      → Premium: verifica tokens restantes
  → Rutea via LiteLLM (gateway unificado)
  → Trackea tokens consumidos (DB server-side)
  → Responde

Billing
  → DB server-side: token_usage { userId, month, tokensUsed, tokensLimit }
  → Stripe: suscripción mensual para plan premium
  → Webhook Stripe → actualiza plan en Clerk metadata
```

## Decisiones pendientes

| Decisión | Opciones | Impacto |
|----------|----------|---------|
| LiteLLM deployment | Self-hosted Python / Managed / JS wrapper | Arquitectura de backend |
| DB para billing | Supabase / PlanetScale / Clerk metadata | Complejidad de infra |
| Payment processor | Stripe / Paddle / LemonSqueezy | Región, impuestos |
| Free-tier models | DeepSeek / Ollama / Mistral free | Costos, calidad |
| Token tracking | Por request / Por completion / Ambos | Precisión de billing |

## Dependencias actuales

- `lib/ai.ts` → lógica de parsing con IA
- `lib/ai-cv.ts` → generación y optimización de CV
- `app/api/ai/parse/route.ts` → server-side route
- `hooks/use-settings.ts` → settings con aiModel + aiApiKey

## Archivos que cambiarán en la evolución

| Archivo | Cambio |
|---------|--------|
| `lib/ai.ts` | Reemplazar llamadas directas por LiteLLM |
| `app/api/ai/parse/route.ts` | Agregar lógica de plan verification + token tracking |
| `hooks/use-settings.ts` | Agregar campo para tipo de plan (byok/free/premium) |
| `app/(app)/settings/page.tsx` | UI para elegir BYOK vs Platform |
| **Nuevo**: `lib/billing.ts` | Lógica de tracking de tokens y verificación de plan |
| **Nuevo**: `app/api/billing/` | Routes para consumo y suscripción |
