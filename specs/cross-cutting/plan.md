# Cross-Cutting — Plan de implementación

**Estado**: ✅ Completo

---

## Dependencias a instalar

### framer-motion

```bash
npm install framer-motion
```

- Importar `motion` directamente en componentes: `import { motion } from 'framer-motion'`
- No requiere provider global
- `AnimatePresence` para transiciones de montaje/desmontaje
- No aplicar retroactivamente — solo en componentes nuevos o modificados

### ai-elements

```bash
npx ai-elements@latest add model-selector shimmer
```

- Componentes se instalan en `components/ui/` (convención shadcn)
- Requiere configuración de theme para usar las CSS variables existentes del proyecto
- El template custom ya existe en el proyecto — configurar ai-elements para usarlo

## Archivos involucrados

| Archivo | Cambio |
|---------|--------|
| `package.json` | Agregar `framer-motion` como dependencia |
| `components/ui/model-selector.tsx` | **Nuevo** — instalado por ai-elements CLI |
| `components/ui/shimmer.tsx` | **Nuevo** — instalado por ai-elements CLI |
| `constitution/constitution.md` | Agregar framer-motion + ai-elements al Tech Stack |
| `CLAUDE.md` | Agregar framer-motion + ai-elements al Tech Stack y Skills |

## Decisiones de arquitectura

| Decisión | Elegida | Razón |
|----------|---------|-------|
| Scope de framer-motion | Solo cambios nuevos | No retroactivo para evitar regresiones y mantener scope acotado |
| Instalación ai-elements | Via CLI (npx) | Sigue convención shadcn, componentes editables en el proyecto |
| Theme ai-elements | CSS variables existentes | Reutiliza la paleta azul Facebook ya definida en Tailwind |
