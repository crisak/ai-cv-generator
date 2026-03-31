# Landing Page — Tasks

## Task 1: Landing Page completa

**Estado**: ✅ Completo

### Alcance

- Specs SDD creados (`specs/landing-page/`)
- `proxy.ts` modificado — `/` como ruta pública
- `app/page.tsx` reemplazado — de redirect a landing page
- 11 componentes en `components/landing/`
- Animaciones: framer-motion (parallax, microinteracciones, scroll-linked) + GSAP (scroll progress)
- Carrusel de screenshots con marco de navegador
- CTA flotante scroll-aware
- Responsive mobile/desktop
- Soporte dark/light
- Logo real (`/images/logo-white.png`)
- Nombre actualizado a "AI CV Generator"
- CONTRIBUTING.md creado
- Licencia MPL-2.0 configurada (LICENSE, package.json, README, footer)
- Documentación actualizada (CLAUDE.md, README.md, SETUP.md, system-overview.md)

### Verificación

1. `pnpm build` — sin errores ✅
2. `pnpm dev` → `http://localhost:3000` muestra landing page
3. Sin sesión: CTA "Comenzar ahora" → `/sign-up`
4. Con sesión: CTA "Ir a la app" → `/applications`
5. Theme toggle funciona
6. Responsive en mobile (375px)
7. Rutas existentes siguen funcionando
8. Scroll progress bar visible al hacer scroll
9. CTA flotante aparece al scrollear

### Pendiente (manual)

- Colocar `logo-white.png` en `public/images/`
- Reemplazar screenshots placeholder con capturas reales en `public/images/screenshots/`
