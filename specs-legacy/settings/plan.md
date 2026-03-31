# Settings — Plan de implementación

**Estado**: ✅ Implementado

## Arquitectura

```
Sidebar dropdown (avatar)
  ├── "Modelo de IA" → /settings
  ├── "Mi perfil" → /profile
  ├── "Apariencia" → submenu (Oscuro/Claro/Sistema)
  └── "Cerrar sesión" → logout

/settings
  → Select modelo IA
  → Input API key (show/hide)
  → Guardar en RxDB (collection: settings)

/profile
  → Avatar + nombre + email (read-only desde Clerk)
  → Inputs firstName/lastName
  → Guardar via user.update() (Clerk)
  → Switcher de tema
```

## Modelo de datos (RxDB)

Collection: `settings` (singleton: `id = 'singleton'`)

```typescript
{
  id: 'singleton'
  aiModel: 'claude' | 'gpt' | 'gemini' | 'grok' | 'deepseek'
  aiApiKey: string
  userName: string   // legacy, no se usa (nombre viene de Clerk)
  userEmail: string  // legacy, no se usa (email viene de Clerk)
}
```

## Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `app/(app)/settings/page.tsx` | Configuración IA |
| `app/(app)/profile/page.tsx` | Perfil + tema |
| `components/layout/sidebar.tsx` | Dropdown |
| `hooks/use-settings.ts` | Hook CRUD settings |
| `store/theme-store.ts` | Store de tema |
| `components/theme-provider.tsx` | Provider |
