# AI Provider — Tasks

## Tareas completadas (MVP)

- [x] Task 1: Selector de modelo IA en Settings
- [x] Task 2: Input de API key por usuario
- [x] Task 3: `POST /api/ai/parse` con routing a providers
- [x] Task 4: Soporte Claude (Anthropic API)
- [x] Task 5: Soporte GPT (OpenAI API)
- [x] Task 6: Soporte DeepSeek
- [x] Task 7: Fallback a regex sin API key
- [x] Task 8: `generateCv()` con skills en prompt
- [x] Task 9: `optimizeCv()` con diff review

## Tareas pendientes (evolución)

### Fase 1: Implementar un MVP o POC
- [x] Task 9-1: Fix — Al configurar el api key de deekseek desde los settings, este no esta funcionando, en todas las partes del sistema donde se usa la API de la IA no esta respondiendo la IA, al principio de pensaba que la api key era invalida pero esto no es asi, se hizo la prueba con curl y funciona.
- [x] Task 9-2: Implementa run validador de api key en la misma pantalla de settings para validar el api key

### Fase 2: LiteLLM Gateway
- [ ] Task 10: Evaluar opciones de deployment de LiteLLM (self-hosted vs managed)
- [ ] Task 11: Configurar LiteLLM con providers actuales (Claude, GPT, DeepSeek)
- [ ] Task 12: Agregar providers adicionales (Gemini, Grok, Mistral)
- [ ] Task 13: Migrar `lib/ai.ts` para rutear via LiteLLM
- [ ] Task 14: Migrar `app/api/ai/parse/route.ts` al nuevo gateway

### Fase 3: Free-tier
- [ ] Task 15: Definir qué modelos son free-tier
- [ ] Task 16: Implementar verificación de plan en API routes
- [ ] Task 17: UI para mostrar modelos disponibles según plan
- [ ] Task 18: Límites de uso en free-tier (requests/día o tokens/mes)

### Fase 4: Billing + Premium
- [ ] Task 19: Setup DB server-side para tracking de tokens
- [ ] Task 20: Implementar tracking de tokens por request
- [ ] Task 21: Integrar Stripe para suscripción mensual
- [ ] Task 22: Webhook Stripe → actualizar plan en Clerk metadata
- [ ] Task 23: Dashboard de consumo de tokens para el usuario
- [ ] Task 24: UI de upgrade (free → premium) cuando se agota el límite
- [ ] Task 25: BYOK mode (usuario trae su propio API key, sin límites del platform)
