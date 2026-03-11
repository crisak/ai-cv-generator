# Feature: Settings & Profile

**Estado**: ✅ Implementado (MVP)

---

## Problema

El usuario necesita configurar preferencias de la app (modelo de IA, API key) y gestionar su perfil (nombre, tema visual).

## Goals

- Página `/settings` para configuración de IA (modelo + API key)
- Página `/profile` para editar nombre y tema visual
- Acceso desde dropdown en sidebar (avatar del usuario)

## User Stories

- Como usuario, puedo seleccionar el modelo de IA que quiero usar
- Como usuario, puedo ingresar mi API key para el provider de IA
- Como usuario, puedo editar mi nombre y apellido (guardado en Clerk)
- Como usuario, puedo cambiar el tema visual (oscuro/claro/sistema)
- Como usuario, accedo a Settings y Profile desde el dropdown de mi avatar

## Requerimientos funcionales

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR1 | Selector de modelo IA (Claude, GPT, Gemini, Grok, DeepSeek) | ✅ |
| FR2 | Input de API key con toggle show/hide | ✅ |
| FR3 | Edición de firstName/lastName via `user.update()` | ✅ |
| FR4 | Switcher de tema (Oscuro/Claro/Sistema) | ✅ |
| FR5 | Dropdown en sidebar con links a Settings/Profile | ✅ |

## Archivos principales

```
app/(app)/settings/page.tsx        → Modelo IA + API key
app/(app)/profile/page.tsx         → Nombre + tema
components/layout/sidebar.tsx      → Dropdown con links
hooks/use-settings.ts              → Hook para settings (RxDB)
store/theme-store.ts               → Zustand store para tema
components/theme-provider.tsx      → Provider de tema
```
