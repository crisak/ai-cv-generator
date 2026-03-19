# Landing Page — Plan

## Decisiones de Arquitectura

### Enrutamiento

- `app/page.tsx` pasa de redirect a server component que renderiza la landing page
- `proxy.ts` agrega `/` a rutas públicas de Clerk
- Sin impacto en rutas existentes (`(app)/`, `(auth)/`)
- La landing hereda solo el root layout (sin Sidebar)

### Componentes

Componentes en `components/landing/`:

| Componente | Tipo | Propósito |
|-----------|------|-----------|
| `landing-header.tsx` | Client | Navbar sticky con logo real, theme toggle, CTA dinámico |
| `hero-section.tsx` | Client | Headline con parallax, CTAs animados, badge de privacidad |
| `benefits-section.tsx` | Client | 4 cards con microinteracciones hover (lift, rotate icon) |
| `screenshots-section.tsx` | Client | Carrusel interactivo con marco de navegador, tabs y dots |
| `how-it-works-section.tsx` | Client | 3 pasos con línea conectora scroll-linked (GSAP-style) |
| `inspiration-section.tsx` | Client | Mención buildresume.work + privacidad, cards con hover lift |
| `features-section.tsx` | Client | Top 5 próximas features con parallax glow |
| `contributing-section.tsx` | Client | Pasos para contribuir con 3D tilt scroll-linked |
| `scroll-progress.tsx` | Client | Barra de progreso de scroll (GSAP ScrollTrigger) |
| `floating-cta.tsx` | Client | CTA flotante que aparece al scrollear |
| `landing-footer.tsx` | Client | Footer con logo, licencia MPL-2.0, links |

### Animaciones

| Librería | Uso |
|----------|-----|
| **framer-motion** | Entrance animations, `whileInView`, `useScroll`/`useTransform` (parallax), `whileHover`/`whileTap` (microinteracciones), `AnimatePresence` (transiciones), spring physics |
| **GSAP + ScrollTrigger** | Scroll progress bar (scrub continuo) |

### Patrones

- Auth state vía `auth()` server-side, pasado como prop `isAuthenticated`
- framer-motion `whileInView` con `viewport={{ once: true, margin: '-80px' }}`
- Scroll suave con `scrollIntoView({ behavior: 'smooth' })`
- Tokens CSS semánticos existentes para soporte dark/light
- Logo real vía `next/image` (`/images/logo-white.png`)
- Screenshots placeholder con guía de reemplazo en código
