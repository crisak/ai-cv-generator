# 🔐 Security Guidelines

**⚠️ IMPORTANTE: Lee esto completamente antes de deployar, cambiar credenciales o compartir el proyecto.**

## 📋 Resumen de problemas de seguridad

Este documento cataloga los problemas de seguridad conocidos en la aplicación y proporciona mitigaciones.

| Problema | Severidad | Mitigación |
|----------|-----------|-----------|
| Hashes de credenciales en código | 🟠 MEDIA | Cambiar credenciales antes de deployar público |
| API Keys en IndexedDB sin cifrado | 🟠 MEDIA | Usuario es responsable de mantener segura su key |
| Llamadas API desde navegador exponen keys | 🟠 MEDIA | Recomendado: backend proxy para producción |
| Sin autenticación real | 🔴 CRÍTICA* | *Para MVP local es aceptable |
| Credenciales hardcodeadas | 🟠 MEDIA | Se proveen como ejemplo, deben cambiar |

---

## 🔴 1. Credenciales Hardcodeadas (SHA-256 Hashes)

### ¿Cuál es el problema?

Las credenciales de login están almacenadas como hashes SHA-256 en `lib/auth.ts`:

```typescript
const EMAIL_HASH = '1425af658e3ef015fbec3871268bdfb991d1de94b03d41e201a2d40c9f8705b9'
const PASSWORD_HASH = '566321247a793684d11256a83791a9ccffd68fad0fc60c3fb00be556ddd758df'
```

**Riesgos:**
- Aunque está hasheado, SHA-256 sin salt es vulnerable a ataques de diccionario/rainbow tables
- El hash está visible en el código fuente → cualquiera puede hacer reverse lookup
- Si alguien clona el repo, obtiene acceso inmediato sin cambiar credenciales

### ✅ Mitigación

**Antes de deployar:**

1. **Cambia las credenciales a otras tuyas:**
   ```bash
   node -e "
   const CryptoJS = require('crypto-js');
   const email = 'tu-email@example.com';
   const password = 'tu-contraseña-segura';
   console.log('EMAIL_HASH:', CryptoJS.SHA256(email.trim().toLowerCase()).toString());
   console.log('PASSWORD_HASH:', CryptoJS.SHA256(password).toString());
   "
   ```

2. **Reemplaza en `lib/auth.ts`:**
   ```typescript
   const EMAIL_HASH = 'RESULTADO_DEL_COMANDO_ANTERIOR'
   const PASSWORD_HASH = 'RESULTADO_DEL_COMANDO_ANTERIOR'
   ```

3. **NO incluyas credenciales en el commit:**
   ```bash
   git add -u  # Solo archivos modificados
   git commit -m "security: Update login credentials"
   # Verifica que no haya credenciales en plaintext
   git show --name-status
   ```

4. **Para producción**, considera:
   - Migrar a un backend con authentication real (JWT, OAuth)
   - Usar base de datos segura con bcrypt + salt
   - Implementar rate limiting para prevenir brute force

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

## 🟠 3. Llamadas API desde Navegador

### ¿Cuál es el problema?

Las llamadas a APIs de IA se hacen directamente desde el navegador:

```typescript
// lib/ai.ts
async function extractWithClaude(text: string, apiKey: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    headers: {
      'x-api-key': apiKey,  // 🚨 Se envía desde el navegador
      'anthropic-dangerous-direct-browser-access': 'true'
    }
  })
}
```

**Riesgos:**
- Header `anthropic-dangerous-direct-browser-access` indica que es un uso **no recomendado por Anthropic**
- Browser devuelve CORS headers que exponen información sobre la API
- Posibilidad de ataques MITM (Man-in-The-Middle) en redes públicas
- Rate limiting no está controlado

### ✅ Mitigación

**Corto plazo (para desarrollo):**
- ✅ Aceptable con la flag `anthropic-dangerous-direct-browser-access: 'true'`
- 💡 Usa keys con permisos **mínimos** y **rate limits bajos**

**Producción:**

1. **Crea un backend proxy** (`pages/api/ai/...`):
   ```typescript
   // pages/api/ai/parse.ts
   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     const { jobOffer } = req.body
     const apiKey = process.env.ANTHROPIC_API_KEY  // Guardar en servidor

     const response = await fetch('https://api.anthropic.com/v1/messages', {
       method: 'POST',
       headers: {
         'x-api-key': apiKey,
         'anthropic-version': '2023-06-01'
       },
       body: JSON.stringify({
         model: 'claude-haiku-4-5-20251001',
         messages: [{ role: 'user', content: jobOffer }]
       })
     })

     res.json(await response.json())
   }
   ```

2. **Actualiza `lib/ai.ts` para usar el proxy:**
   ```typescript
   async function extractWithClaude(text: string) {
     const res = await fetch('/api/ai/parse', {  // Tu endpoint
       method: 'POST',
       body: JSON.stringify({ jobOffer: text })
     })
     return res.json()
   }
   ```

3. **Configura variables de entorno del servidor:**
   ```bash
   # .env.local
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
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
