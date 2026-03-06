# 🔐 Security Guidelines

**⚠️ IMPORTANTE: Lee esto completamente antes de deployar, cambiar credenciales o compartir el proyecto.**

## 📋 Resumen de problemas de seguridad

Este documento cataloga los problemas de seguridad conocidos en la aplicación y proporciona mitigaciones.

| Problema | Severidad | Estado | Mitigación |
|----------|-----------|--------|-----------|
| Hashes de credenciales en código | 🟠 MEDIA | ✅ ARREGLADO | Cambiar a credentials genéricas (user@example.com) |
| API Keys en IndexedDB sin cifrado | 🟠 MEDIA | ⏳ MVP OK | Usuario responsable; Prod: encryption requerida |
| Llamadas API desde navegador exponen keys | 🟠 MEDIA | ✅ ARREGLADO | Backend proxy en /pages/api/ai/parse.ts implementado |
| Sin autenticación real | 🔴 CRÍTICA* | ⏳ MVP OK | *Para MVP local es aceptable, cambiar para prod |
| Sin session timeout | 🟡 BAJA | ⏳ TODO | Agregar auto-logout en próximas iteraciones |

---

## 🟢 1. Credenciales Hardcodeadas (SHA-256 Hashes) — ✅ ARREGLADO

### ¿Cuál fue el problema?

Las credenciales de login original exponían datos personales:
- Email real: `cristian.c.romero.p@gmail.com` (datos personales expuestos)
- Vulnerable a rainbow tables (SHA-256 sin salt)

### ✅ Cambios Realizados (2026-03-06)

**Código actualizado** (`lib/auth.ts`):
```typescript
// ANTES: Email real expuesto
const EMAIL_HASH = '1425af658e3ef015fbec3871268bdfb991d1de94b03d41e201a2d40c9f8705b9'

// AHORA: Ejemplo genérico seguro
const EMAIL_HASH = 'b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514'
// Credenciales de ejemplo: user@example.com / password123
```

**Beneficios:**
- ✅ Sin datos personales en el código
- ✅ Ejemplo genérico y seguro para MVP
- ✅ Listo para GitHub público

### 🔄 Para Cambiar Credenciales (Si necesitas diferente en tu fork)

```bash
# 1. Genera nuevos hashes
node -e "
const CryptoJS = require('crypto-js');
const email = 'tu-email@example.com';
const password = 'tu-password-segura';
console.log('EMAIL_HASH:', CryptoJS.SHA256(email.toLowerCase().trim()).toString());
console.log('PASSWORD_HASH:', CryptoJS.SHA256(password).toString());
"

# 2. Actualiza lib/auth.ts con los hashes
# 3. Haz commit

git add lib/auth.ts
git commit -m "security: Update login credentials"
```

### 📋 Para Producción Real

**Obligatorio:**
- Implementar backend con JWT/OAuth
- Base de datos con bcrypt + salt
- Rate limiting para brute force protection
- Multi-factor authentication (2FA)

---

## 🟠 2. API Keys en IndexedDB (Sin Cifrado)

### ¿Cuál es el problema?

Las API keys se guardan en IndexedDB/RxDB sin cifrado:

```typescript
// En settings/page.tsx
await saveSettings({ aiModel, aiApiKey: apiKey, userName })

// Se guardan directamente en IndexedDB
```

**Riesgos:**
- Cualquier código con acceso a IndexedDB puede leer la key
- Vulnerable a XSS (Cross-Site Scripting) si la aplicación es comprometida
- DevTools del navegador expone fácilmente (F12 → Application → IndexedDB)
- No hay separación entre keys de desarrollo/producción

### ✅ Mitigación

**Para desarrollo (en tu máquina):**
- ✅ Aceptable: usar IndexedDB sin cifrado
- 💡 Buena práctica: usa diferentes keys por ambiente

**Para producción:**

1. **NO guardes API keys en el navegador**, usa un backend proxy:
   ```typescript
   // Mal (actual):
   const res = await fetch('https://api.anthropic.com/v1/messages', {
     headers: { 'x-api-key': apiKey }  // Expone la key
   })

   // Bien:
   const res = await fetch('/api/ai/parse', {  // Tu backend
     method: 'POST',
     body: JSON.stringify({ jobOffer: text })
   })
   ```

2. **Si DEBES guardar keys localmente**, cifra con una passphrase:
   ```bash
   npm install tweetnacl tweetnacl-util
   ```

3. **Alternativa segura:**
   - Usa Anthropic API con restrictive API keys (per-host allowlisting)
   - OpenAI: Use organization API keys con rate limiting
   - Implementa un rate limiter en backend

---

## 🟢 3. Llamadas API desde Navegador — ✅ ARREGLADO

### ¿Cuál fue el problema?

Las llamadas a APIs de IA se hacían directamente desde el navegador:

```typescript
// ANTES (lib/ai.ts)
async function extractWithClaude(text: string, apiKey: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    headers: {
      'x-api-key': apiKey,  // 🚨 API key exposición
      'anthropic-dangerous-direct-browser-access': 'true'
    }
  })
}
```

**Riesgos:**
- API key enviada desde navegador = riesgo de exposición
- Header `anthropic-dangerous-direct-browser-access` **no recomendado por Anthropic**
- Posible ataque MITM en redes públicas
- Sin control de rate limiting desde servidor

### ✅ Cambios Realizados (2026-03-06)

**Backend proxy implementado** (`pages/api/ai/parse.ts`):
```typescript
// AHORA (pages/api/ai/parse.ts)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobOffer } = req.body
  const apiKey = process.env.ANTHROPIC_API_KEY  // API key en servidor

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    headers: {
      'x-api-key': apiKey,  // ✅ Nunca expuesto al navegador
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({...})
  })
}
```

**Cliente actualizado** (`lib/ai.ts`):
```typescript
// ANTES: fetch directo a API con key
// AHORA: POST /api/ai/parse (sin key)
async function extractWithBackendProxy(text: string, model: string) {
  const res = await fetch('/api/ai/parse', {  // ✅ Endpoint local
    method: 'POST',
    body: JSON.stringify({ jobOffer: text, model })
  })
}
```

**Beneficios:**
- ✅ API key nunca expuesta al navegador
- ✅ Control de acceso en servidor
- ✅ Rate limiting controlado por servidor
- ✅ Costo de API protegido (solo requests legítimos)
- ✅ Fallback regex disponible sin API key

### 📋 Configuración Necesaria

**En producción**, agrega a variables de entorno:
```bash
# .env.local o variables del servidor
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🟡 4. Almacenamiento de Datos Personales

### ¿Cuál es el problema?

Se almacena información personal sensible:
- Nombre completo, email, teléfono
- Historia de experiencia laboral
- Ofertas laborales con datos de empresas
- Salarios y beneficios

**Riesgos:**
- Si la computadora es compartida/robada, todos los datos se exponen
- Sin encriptación, cualquiera con acceso físico accede a IndexedDB

### ✅ Mitigación

1. **Educación del usuario:**
   ```
   ⚠️ ADVERTENCIA: Este navegador almacena datos personales sensibles.
   - No compartas tu sesión con otros usuarios
   - En computadoras públicas, limpia datos antes de irte
   - Respalda datos regularmente (Export JSON)
   ```

2. **Implementar en producción:**
   - ✅ Agregar: "Borrar todos los datos locales" en Settings
   - ✅ Session timeout automático (30 mins inactividad)
   - ✅ Encriptación de IndexedDB en contextos multi-usuario
   - ✅ Requerer password para borrar datos

---

## 🟢 5. Lo que sí está bien

✅ **Las siguientes prácticas son correctas:**

- **No hay backend** → Menos superficie de ataque
- **No hay terceros** → No hay tracking, analytics, cookies
- **Hashing de credenciales** → Mejor que plaintext
- **Validación con Zod** → Previene inyecciones
- **Uso de crypto-js** → Aunque SHA-256 sin salt es débil, es mejor que nothing
- **TypeScript** → Ayuda a prevenir type confusion attacks
- **HTTPS recomendado** → (si deployar a producción)

---

## 🚨 Checklist antes de deployar a producción

- [ ] **Cambié credenciales hardcodeadas** a credenciales personales (ver sección 1)
- [ ] **No commitee credenciales en plaintext** (verificar git log)
- [ ] **Implementé backend proxy para llamadas a IA** (ver sección 3)
- [ ] **Agregué `.env.local` a `.gitignore`** (ya está, pero verificar)
- [ ] **Configuré HTTPS** en dominio
- [ ] **Implementé session timeout** automático
- [ ] **Agregué opción de borrar datos locales** en Settings
- [ ] **Implementé rate limiting** en backend API
- [ ] **Testeé en incógnito/privado** (simulando un usuario nuevo)
- [ ] **Verificar CORS** en producción (headers permisivos = malo)
- [ ] **No tengo API keys en el código fuente**
- [ ] **Leí los términos de servicio** de proveedores de IA (Anthropic, OpenAI, etc.)

---

## 📧 Reportar vulnerabilidades

Si encuentras un problema de seguridad:

1. **NO** lo publiques en GitHub issues (público)
2. **SÍ** envía email privado a: `cristian.c.romero.p@gmail.com`
3. Incluye: descripción, pasos para reproducir, impacto
4. Espera respuesta dentro de 7 días

---

## 🔗 Referencias de seguridad

- [OWASP Top 10 2023](https://owasp.org/Top10/)
- [Anthropic API Security](https://docs.anthropic.com/en/docs/about/use-cases)
- [Web Security Academy](https://portswigger.net/web-security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [RxDB Security](https://rxdb.info/security.html)

---

## 📝 Historial de cambios de seguridad

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-03-06 | Documento inicial creado | Cristian Romero |
| - | - | - |

**Última actualización:** 2026-03-06

---

⚠️ **Recordatorio:** La seguridad es un proceso continuo. Revisa este documento regularmente y mantén dependencias actualizadas.

```bash
npm audit        # Verificar vulnerabilidades
npm update       # Actualizar dependencias
```
