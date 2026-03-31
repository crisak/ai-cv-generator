# Landing Page — Specification

## Problema

La app no tiene una página de entrada pública. Los usuarios no autenticados son redirigidos directamente a `/login` sin contexto sobre qué hace la aplicación ni por qué deberían usarla.

## Objetivo

Crear una landing page atractiva en `/` que:

1. Motive a los usuarios a probar la app
2. Comunique los beneficios y ventajas de forma clara y no técnica
3. Explique cómo empezar en 3 pasos simples
4. Mencione la inspiración en buildresume.work
5. Comunique que los datos se guardan solo en el navegador (sin jerga técnica)
6. Incluya instrucciones para colaboradores
7. Liste las próximas 5 features del roadmap

## User Stories

- **US-1**: Como visitante, quiero entender qué hace la app para decidir si me registro.
- **US-2**: Como visitante, quiero ver cómo funciona en pasos simples.
- **US-3**: Como visitante, quiero saber que mis datos están seguros y no salen de mi navegador.
- **US-4**: Como desarrollador, quiero saber cómo contribuir al proyecto.
- **US-5**: Como usuario autenticado, quiero ver la landing con opción de ir directo a la app.

## Requisitos

### Funcionales

- Página pública accesible sin autenticación en `/`
- CTA dinámico: "Comenzar ahora" (no auth) / "Ir a la app" (auth)
- Secciones: Hero, Beneficios, Cómo funciona, Inspiración/Privacidad, Próximas features, Contribuir, Footer
- Theme toggle visible (dark/light)
- Responsive (mobile-first)
- Animaciones con framer-motion

### No funcionales

- Todo el contenido en español
- No usar jerga técnica (local-first, IndexedDB, RxDB, etc.)
- Usar componentes existentes de shadcn/ui
- Soporte completo dark/light mode

## Fuera de alcance

- Analytics o tracking
- Internacionalización (i18n)
- Blog o contenido dinámico
