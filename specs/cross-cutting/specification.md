# Feature: Cross-Cutting Infrastructure

**Estado**: ⬜ Pendiente

---

## Problema

Múltiples dominios necesitan animaciones de transición (framer-motion) y componentes de UI temáticos para IA (ai-elements). Instalar y configurar estas dependencias una sola vez evita duplicación y garantiza consistencia visual.

## Goals

- framer-motion configurado globalmente, disponible para transiciones en todos los cambios nuevos
- ai-elements instalado con el theme del proyecto (paleta azul Facebook, dark/light)
- Ninguna de estas librerías se aplica retroactivamente a UI existente

## User Stories

- Como desarrollador, puedo usar `motion` de framer-motion en cualquier componente nuevo sin configuración adicional
- Como desarrollador, puedo importar componentes de ai-elements (ModelSelector, Shimmer) con el tema del proyecto

## Requerimientos funcionales

| ID | Requerimiento | Estado |
|----|--------------|--------|
| FR1 | framer-motion instalado como dependencia del proyecto | ⬜ Pendiente |
| FR2 | ai-elements instalado y configurado con theme del proyecto | ⬜ Pendiente |
| FR3 | Componente Shimmer disponible para import | ⬜ Pendiente |
| FR4 | Componente ModelSelector disponible para import | ⬜ Pendiente |
| FR5 | Documentación técnica actualizada (CLAUDE.md, constitution.md) | ⬜ Pendiente |

## Requerimientos no funcionales

- No aplicar framer-motion retroactivamente a componentes existentes
- Solo usar en cambios nuevos de aquí en adelante
- ai-elements sigue convención shadcn (componentes en `components/ui/`)
- Theme de ai-elements debe usar las CSS variables existentes del proyecto
