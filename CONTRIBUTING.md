# Contribuir a AI CV Generator

Gracias por tu interés en contribuir. Toda ayuda es bienvenida, ya sea reportando bugs, proponiendo features, mejorando documentación o enviando código.

## Requisitos previos

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v9+
- Una cuenta en [Clerk](https://clerk.com/) (para autenticación)

## Configuración del entorno

1. **Fork** del repositorio en GitHub

2. **Clona** tu fork:

   ```bash
   git clone https://github.com/<tu-usuario>/ai-cv-generator.git
   cd ai-cv-generator
   ```

3. **Instala** las dependencias:

   ```bash
   pnpm install
   ```

4. **Configura** las variables de entorno:

   ```bash
   cp .env.example .env.local
   ```

   Completa las variables de Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) y opcionalmente las API keys de IA.

5. **Inicia** el servidor de desarrollo:

   ```bash
   pnpm dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Flujo de contribución

1. **Crea una rama** desde `main`:

   ```bash
   git checkout -b feature/nombre-descriptivo
   ```

2. **Desarrolla** tus cambios siguiendo las convenciones del proyecto.

3. **Formatea** el código antes de commitear:

   ```bash
   pnpm format
   ```

4. **Commitea** con mensajes semánticos:

   ```
   feat: agregar filtro por salario en dashboard
   fix: corregir scroll en vista previa de CV
   refactor: extraer lógica de parsing a util
   docs: actualizar guía de contribución
   ```

5. **Push** a tu fork:

   ```bash
   git push origin feature/nombre-descriptivo
   ```

6. **Abre un Pull Request** hacia `main` del repositorio original.

## Convenciones de código

- **TypeScript strict mode** — evitar `any`
- **TailwindCSS v4** — usar tokens semánticos (`bg-background`, `text-primary`, etc.)
- **shadcn/ui** — reutilizar componentes existentes de `components/ui/`
- **Contenido en español** — todo el texto visible al usuario debe estar en español
- **No over-engineering** — solución mínima para el requerimiento actual
- **Validación solo en boundaries** — input de usuario, respuestas de API

## Estructura del proyecto

```
app/                → Next.js App Router
  (app)/            → Rutas autenticadas
  (auth)/           → Rutas públicas (login, sign-up)
  api/              → API routes
components/         → Componentes por dominio
  ui/               → shadcn/ui components
  landing/          → Landing page
  layout/           → Sidebar, layouts
lib/                → Utilidades, AI, DB
hooks/              → Custom hooks
types/              → TypeScript types
specs/              → Especificaciones por dominio (SDD)
constitution/       → Reglas permanentes del proyecto
```

## Metodología: Spec-Driven Development (SDD)

Este proyecto sigue SDD. Antes de implementar una feature nueva:

1. Lee `constitution/constitution.md` — reglas permanentes
2. Lee `specs/<dominio>/specification.md` — qué se implementa
3. Lee `specs/<dominio>/plan.md` — cómo se implementa
4. Lee `specs/<dominio>/tasks.md` — tareas concretas (1 task = 1 PR)

Si tu contribución es una feature nueva, considera crear o actualizar los specs correspondientes.

## Reportar bugs

Abre un [issue en GitHub](https://github.com/crisak/ai-cv-generator/issues) con:

- Descripción clara del problema
- Pasos para reproducirlo
- Comportamiento esperado vs. actual
- Capturas de pantalla si aplica

## Proponer features

Abre un issue con el tag `enhancement` describiendo:

- Qué problema resuelve
- Cómo debería funcionar
- Mockups o referencias si los tienes

## Licencia

Al contribuir a este proyecto, aceptas que tus contribuciones se licencien bajo la [Mozilla Public License 2.0 (MPL-2.0)](LICENSE).

## Código de conducta

Sé respetuoso y constructivo. Las contribuciones se revisan con la intención de mejorar el proyecto juntos.
