# 📋 Deployment Checklist

Use esta lista antes de compartir o deployar el proyecto a producción.

## 🔴 CRÍTICO: Cambiar credenciales

```bash
# 1. Generar nuevas credenciales
node -e "
const CryptoJS = require('crypto-js');
const email = prompt('Nueva email:');
const pwd = prompt('Nueva contraseña:');
console.log('EMAIL:', CryptoJS.SHA256(email.trim().toLowerCase()).toString());
console.log('PWD:', CryptoJS.SHA256(pwd).toString());
"

# 2. O hacerlo manualmente:
node
> const CryptoJS = require('crypto-js');
> CryptoJS.SHA256('tu-email@example.com'.toLowerCase()).toString()
'abc123...'  // Copiar esto
> CryptoJS.SHA256('tu-password-segura').toString()
'def456...'  // Copiar esto
> .exit

# 3. Editar lib/auth.ts
# EMAIL_HASH = 'abc123...'
# PASSWORD_HASH = 'def456...'

# 4. Verificar que funciona
npm run dev
# Login con nuevas credenciales → debe funcionar
```

**Status:** [ ] ✅

---

## 🟠 IMPORTANTE: API & Seguridad

### API Keys

- [ ] `.env.local` está en `.gitignore` ✓
- [ ] `.env.example` contiene placeholders (no keys reales) ✓
- [ ] No commiteeaste `.env.local` jamás
  ```bash
  git log --all --source --remotes -- ".env.local"  # Debe estar vacío
  ```

### Para producción

- [ ] ✅ Implementé `/pages/api/ai/parse.ts` backend proxy
- [ ] ✅ Actualicé `lib/ai.ts` para usar `/api/ai/parse` en producción
- [ ] ✅ Configuré `ANTHROPIC_API_KEY` en variables de entorno del servidor
- [ ] ✅ Testeé que funciona sin exponer keys al navegador

### Vulnerabilidades

```bash
# Verificar dependencias
npm audit

# Actualizar si es necesario
npm update

# Comprobar que no haya keys en código
grep -r "sk-ant-\|sk-\|API_KEY=" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . | grep -v node_modules | grep -v ".next"
# Debe estar vacío (excepto en comments)
```

**Status:** [ ] ✅

---

## 🟡 RECOMENDADO: Mejoras

- [ ] Agregué auto-logout después de 30min inactividad
- [ ] Agregué botón "Borrar todos los datos" en Settings
- [ ] Agregué sesión timeout warning
- [ ] Implementé rate limiting en backend APIs

**Status:** [ ] ✅ (opcional)

---

## 📦 Deployment

### Opción 1: Vercel (Recomendado)

```bash
npm install -g vercel
vercel login

# En el proyecto
vercel
# Sigue el wizard

# Agregar variables
vercel env add ANTHROPIC_API_KEY
# Ingresa: sk-ant-...

vercel --prod  # Deploy a producción
```

- [ ] Proyecto deployado en Vercel
- [ ] Variables de entorno configuradas
- [ ] HTTPS automático
- [ ] Verificar que funciona

### Opción 2: Self-hosted

```bash
# SSH a tu servidor
ssh user@server.com

# Clonar repo (ASEGÚRATE que changaste credenciales)
git clone https://github.com/crisak/ai-cv-generator.git
cd ai-cv-generator

# Setup
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run build

# PM2 para mantenerlo activo
npm install -g pm2
pm2 start "npm start" --name ai-cv-generator
pm2 startup
pm2 save

# Nginx reverse proxy + HTTPS (Let's Encrypt)
sudo apt install nginx certbot python3-certbot-nginx
# ... configurar nginx.conf ...
certbot --nginx -d tu-dominio.com
```

- [ ] Servidor deploye exitosamente
- [ ] HTTPS configurado
- [ ] PM2 manteniendo app activa
- [ ] DNS apuntando al servidor

**Status:** [ ] ✅

---

## 🧪 Testing

```bash
# Verificación rápida
npm run format:check
npm run lint
npm audit

# Pruebas manuales
npm run dev

# En el navegador:
# 1. Login con nuevas credenciales ✓
# 2. Crear una aplicación ✓
# 3. Generar CV ✓
# 4. Cambiar settings ✓
# 5. Exportar datos ✓
# 6. Limpiar cache browser, volver a login ✓

# DevTools checks:
# F12 → Application → IndexedDB → Ver datos ✓
# F12 → Console → Sin errores rojo ✓
# F12 → Network → Sin credenciales en requests ✓
```

**Status:** [ ] ✅

---

## 📚 Documentación

- [ ] README.md está completo y actualizado
- [ ] SECURITY.md leído completamente
- [ ] SETUP_GUIDE.md accesible para otros devs
- [ ] .env.example proporciona plantilla clara
- [ ] CLAUDE.md tiene guidelines arquitectónicas

**Status:** [ ] ✅

---

## 🚀 Pre-launch

```bash
# Último check antes de anunciar
git status
# Nada pendiente (salvo .env.local que NO se commitea)

git log --oneline -5
# Último commit debe ser "security: Update credentials"

npm audit
# Sin vulnerabilidades críticas

npm run build
# Debe compilar exitosamente
```

- [ ] Código limpio y formateado
- [ ] No hay TODO/FIXME en producción
- [ ] All secrets están fuera del repo
- [ ] Documentación está lista

**Status:** [ ] ✅

---

## 📞 Post-launch

- [ ] Monitorear logs para errores
- [ ] Recopilar feedback de usuarios
- [ ] Mantener dependencias actualizadas (`npm update`)
- [ ] Seguir checklist de seguridad en SECURITY.md

---

## 🔗 Referencias rápidas

| Documento | Propósito |
|-----------|----------|
| [README.md](./README.md) | Features, setup, uso |
| [SECURITY.md](./SECURITY.md) | Riesgos conocidos y mitigaciones |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Setup detallado, APIs, deploy |
| [.env.example](./.env.example) | Plantilla de variables |
| [CLAUDE.md](./CLAUDE.md) | Guidelines para desarrollo |

---

**✅ Cuando hayas completado todo: ¡A producción!**

```bash
# Último push
git add .
git commit -m "deployment: Ready for production"
git push origin main

# Deploy
vercel --prod
# o tu método de deploy

# Celebrar 🎉
```
