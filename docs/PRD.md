# Product Requirements Document — AI CV Generator

**Version**: 1.0  
**Estado**: MVP completado  
**Fecha**: Marzo 2026  
**Autor**: Cristian Acosta  
**Audiencia**: Product, Engineering, Stakeholders

---

## 1. Resumen Ejecutivo

AI CV Generator es una plataforma web que elimina el proceso manual y repetitivo de crear CVs personalizados para cada oferta laboral. Usando inteligencia artificial, transforma lo que antes tomaba 1+ hora en un flujo guiado de minutos: pega la oferta, revisa los goals, obtén un CV optimizado para ATS listo para descargar.

---

## 2. Problema

### 2.1 Contexto

Los profesionales que buscan empleo activamente deben personalizar su CV para cada oferta laboral. Enviar el mismo CV genérico reduce drásticamente las posibilidades de pasar filtros ATS (Applicant Tracking Systems) y llegar a entrevista.

### 2.2 Pain Points identificados

| #   | Dolor                                                                            | Impacto                                   |
| --- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | Copiar/pegar manualmente entre Claude, archivos JSON y plataformas de CV         | ~1 hora por aplicación                    |
| 2   | La IA genera goals (logros) irreales o que el usuario no valida antes de usarlos | CV poco auténtico, riesgo en entrevistas  |
| 3   | Rastrear postulaciones en una hoja de Excel manual                               | Pérdida de oportunidades, desorganización |
| 4   | No hay forma rápida de comparar cuál empresa ofrece mejores condiciones          | Toma de decisiones deficiente             |
| 5   | Editar el JSON del CV directamente no es intuitivo                               | Barrera técnica alta, errores frecuentes  |

### 2.3 Problema principal

> **Un profesional invierte más de 1 hora por postulación en tareas mecánicas y repetitivas, cuando ese tiempo debería estar enfocado en prepararse para entrevistas y tomar mejores decisiones de carrera.**

---

## 3. Solución

Una plataforma all-in-one que centraliza el ciclo completo de búsqueda de empleo:

1. **Gestión de postulaciones** — dashboard con estado, salario, beneficios y timeline
2. **Editor de experiencia** — CRUD visual sobre el JSON de experiencia real (sin tocar código)
3. **Generador de CV con IA** — flujo en 3 pasos con revisión de goals antes de generar
4. **Historial de CVs** — acceso a todos los CVs generados vinculados a cada postulación
5. **Configuración de IA** — elige el modelo (Claude, GPT-4o, DeepSeek, Gemini, Grok)

---

## 4. Usuarios Objetivo

### 4.1 Perfil primario

**Profesional técnico en búsqueda activa de empleo**

- Edad: 25–45 años
- Perfil: Desarrolladores, ingenieros de software, tech leads
- Contexto: Aplica a 5–20 ofertas por mes
- Nivel técnico: Cómodo con herramientas digitales, usa IA habitualmente
- Dolor principal: El proceso manual consume demasiado tiempo y no escala

### 4.2 Jobs to Be Done

| Situación                            | Motivación                                   | Resultado esperado                                  |
| ------------------------------------ | -------------------------------------------- | --------------------------------------------------- |
| Encuentro una oferta interesante     | Quiero aplicar rápido antes de que cierre    | Tener un CV personalizado y listo en < 10 min       |
| Tengo varias entrevistas en paralelo | Necesito recordar qué ofrecí y a qué empresa | Ver todos mis procesos activos en un solo lugar     |
| Una empresa me hace contraoferta     | Quiero comparar con las otras opciones       | Dashboard con salario y beneficios por oferta       |
| La IA inventó un logro que no es mío | No quiero arriesgarme en una entrevista      | Poder revisar y editar goals antes de generar el CV |

---

## 5. Propuesta de Valor

```
Antes:  1 hora + Claude + JSON manual + Excel + buildresume.work
Ahora:  < 10 minutos en una sola plataforma
```

**Diferenciadores clave:**

- **Revisión de goals antes de generar** — la IA propone, el usuario aprueba o rechaza cada logro
- **Score de coincidencia visual** — sabes cuánto matchea tu CV con la oferta antes de enviar
- **Privacidad total** — todos los datos viven en tu navegador (RxDB/IndexedDB), sin backend
- **Multi-modelo de IA** — no dependes de un solo proveedor
- **ATS-optimizado por defecto** — 1 página, formato limpio, jerarquía correcta

---

## 6. Alcance del MVP

### 6.1 Incluido en MVP v1.0

| Módulo                         | Funcionalidades                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **Auth**                       | Login con Google, GitHub, Email/Password (Clerk)                                                        |
| **Dashboard de postulaciones** | CRUD completo, estados, salario, beneficios, timeline, favoritos                                        |
| **Editor de experiencia**      | Importar/exportar JSON, edición visual por sección (básicos, educación, experiencia, skills, liderazgo) |
| **Generador de CV (3 pasos)**  | Paso 1: Análisis de oferta; Paso 2: Revisión de goals + preview; Paso 3: Render ATS + descarga PDF      |
| **Matching analysis**          | Score visual, alertas de gaps, diff view para optimizaciones                                            |
| **Historial de CVs**           | Lista paginada vinculada a postulaciones                                                                |
| **Settings**                   | Selector de modelo IA + API key por modelo                                                              |
| **Perfil**                     | Nombre, apellido, tema (dark/light/sistema)                                                             |

### 6.2 Fuera del MVP v1.0

- Colaboración multi-usuario o compartir CVs
- Integración con LinkedIn/Indeed para importar ofertas automáticamente
- Plantillas de CV visuales (más allá del formato ATS estándar)
- Backend persistente / sync en la nube
- Versión móvil nativa
- Análisis de mercado laboral o salary benchmarking

---

## 7. Flujo de Usuario Principal

### Generador de CV (Happy Path)

```
Usuario entra a /cv-generator
        ↓
[Paso 1] Pega URL o texto de la oferta laboral
        ↓
IA extrae: empresa, rol, requisitos, tecnologías
        ↓
[Paso 2] Layout 3 columnas:
  ← Selecciona bullets por sección
       CV preview en vivo (centro)
       Score de match + alertas →
        ↓
Usuario revisa goals, desmarca irreales, solicita alternativas
        ↓
[Paso 3] CV renderizado ATS
  → Descarga PDF
  → Guarda en historial (vinculado a postulación)
```

---

## 8. Requerimientos Funcionales

### RF-01: Gestión de Postulaciones

- El usuario puede crear, editar y eliminar postulaciones
- Cada postulación tiene: empresa, puesto, URL oferta, salario, beneficios, estado, notas, fecha de postulación
- Los estados posibles son: Guardada, Aplicada, En Proceso, Oferta Recibida, Rechazada, Descartada
- Se registra un timeline automático al cambiar de estado
- El usuario puede marcar postulaciones como favoritas

### RF-02: Editor de Experiencia

- El usuario puede importar su experiencia desde un JSON que cumpla el schema definido
- La app genera un formulario dinámico editable por sección
- Los cambios se persisten localmente (RxDB)
- El usuario puede exportar la experiencia actualizada en el mismo formato JSON

### RF-03: Análisis de Oferta (Paso 1)

- El usuario puede pegar texto plano o una URL de oferta laboral
- La IA extrae automáticamente: empresa, cargo, requisitos, responsabilidades, stack tecnológico
- Si la URL proviene de una plataforma soportada, se extrae el contenido automáticamente
- Si la URL no es soportada, se muestra instrucción para pegar el texto manualmente

### RF-04: Generación de CV con revisión de goals (Paso 2)

- La IA propone goals (bullets de logros) basados en la experiencia real y la oferta
- El usuario puede marcar/desmarcar cada goal antes de generar el CV
- El usuario puede solicitar goals alternativos para cualquier sección
- El CV preview se actualiza en tiempo real según las selecciones
- El score de coincidencia (0–100%) se calcula y muestra visualmente
- Se muestran alertas si hay gaps importantes entre la oferta y el CV actual

### RF-05: Render y Descarga (Paso 3)

- El CV se renderiza en formato ATS: 1 página, tipografía limpia, jerarquía clara
- El usuario puede descargarlo como PDF
- El CV se guarda automáticamente en el historial vinculado a la postulación

### RF-06: Configuración de IA

- El usuario configura su API key por proveedor (Claude, GPT-4o, DeepSeek, Gemini, Grok)
- El usuario puede cambiar el modelo activo en cualquier momento
- Sin API key, la app usa fallback con regex/heurísticas básicas

---

## 9. Requerimientos No Funcionales

| Categoría          | Requerimiento                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Privacidad**     | Todos los datos del usuario se almacenan localmente (IndexedDB via RxDB). Ningún dato personal se envía a servidores propios                        |
| **Performance**    | Tiempo hasta interactivo (TTI) < 3s en conexión promedio                                                                                            |
| **Accesibilidad**  | Contraste WCAG AA. Navegación por teclado en flows principales                                                                                      |
| **Compatibilidad** | Chromium (Chrome, Edge, Brave), Firefox, Safari — últimas 2 versiones                                                                               |
| **Tema**           | Dark mode y light mode con detección automática del sistema                                                                                         |
| **Seguridad**      | API keys del usuario se almacenan solo en localStorage/IndexedDB del cliente. No se transmiten excepto a la API del proveedor de IA correspondiente |
| **Offline**        | La app es funcional offline para consultar historial y editar experiencia. Las funciones de IA requieren conexión                                   |

---

## 10. Métricas de Éxito

| Métrica                              | Baseline actual | Objetivo MVP        |
| ------------------------------------ | --------------- | ------------------- |
| Tiempo por postulación (end-to-end)  | ~60 min         | < 10 min            |
| CVs generados por sesión             | 1               | 3+                  |
| % de goals aprobados sin edición     | N/A             | > 70%               |
| Postulaciones rastreadas activamente | Excel manual    | Dashboard unificado |
| Tasa de retención (semana 2)         | N/A             | > 40%               |

---

## 11. Restricciones y Supuestos

**Restricciones:**

- Sin backend propio — toda la persistencia es local-first (RxDB/IndexedDB)
- El usuario debe tener su propia API key del proveedor de IA elegido
- LinkedIn e Indeed no son soportados por anti-bot (restricción de la plataforma, no del producto)
- El CV generado tiene un máximo de 1 página (restricción de diseño ATS)

**Supuestos:**

- El usuario tiene experiencia laboral previa documentada en formato JSON o dispuesto a ingresarla
- El usuario ya usa IA habitualmente en su flujo de búsqueda de empleo
- El usuario prefiere privacidad de datos sobre sincronización en la nube

---

## 12. Riesgos

| Riesgo                                   | Probabilidad | Impacto | Mitigación                                                             |
| ---------------------------------------- | ------------ | ------- | ---------------------------------------------------------------------- |
| El usuario no tiene API key de IA        | Alta         | Medio   | Fallback con regex/heurísticas para análisis básico                    |
| Cambios en APIs de proveedores de IA     | Media        | Alto    | Abstracción por proveedor, updates incrementales                       |
| IndexedDB deshabilitado (modo incógnito) | Baja         | Alto    | Mostrar advertencia clara y sugerir modo normal                        |
| Plataformas laborales cambian su HTML    | Media        | Medio   | Extracción por URL es feature secundaria; texto plano siempre funciona |

---

## 13. Glosario

| Término              | Definición                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| **ATS**              | Applicant Tracking System — software que escanea y filtra CVs automáticamente                                |
| **Goal / Bullet**    | Un logro profesional redactado con fórmula: Verbo + Qué + Cómo + Resultado cuantificable                     |
| **Score de match**   | Porcentaje de coincidencia entre los requisitos de la oferta y el contenido del CV generado                  |
| **Local-first**      | Arquitectura donde los datos se almacenan primero en el dispositivo del usuario, sin depender de un servidor |
| **RxDB**             | Base de datos reactiva que usa IndexedDB como storage en el navegador                                        |
| **Experiencia real** | JSON con la historia laboral completa del usuario, fuente de verdad para la generación de CVs                |
