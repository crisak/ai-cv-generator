## Problema
Actualmente estoy usando la IA para generar CVs para la busqueda de empleo, para cada oferta que llama la atencion tengo que hacer los siguientes pasos:
1. Abrir Claude

2. Ir al proyecto de claude llamado "CV Generator", en este proyecto tengo archivos adjuntos que me ayudara darle contexto adicional a la IA sobre mi experiencia real y el formato esperado para la respuesta.

3. Copio y pego el siguiente Prompt y lo modifico en las siguientes partes (## Oferta laboral objetivo, Tecnologías que NO domino)

```md
Necesito que me ayudes a crear un nuevo CV en formato JSON optimizado para la siguiente oferta laboral. Sigue todas las instrucciones detalladas a continuación.
---
## Archivos de referencia del proyecto
* **cv-experiencia-real.json** → Mi experiencia laboral completa y real como ingeniero. Úsala como fuente de verdad.
* **Json schema cv generator** → El JSON generado debe cumplir estrictamente con este schema.
* **cv-template-example.json** → Ejemplo de referencia del formato final esperado.
---
## Instrucciones de generación
### 1. Formato y estructura
- El JSON generado debe seguir estrictamente el schema definido en `Json_schema_cv_generator`.
- El CV resultante debe caber en **máximo 1 página** al convertirse a PDF. Esto es crítico: prioriza calidad sobre cantidad.

### 2. Buenas prácticas de redacción (actúa como experto en recruiting y ATS)
- Cada bullet debe seguir la fórmula: **Verbo de acción (pasado) + Qué hiciste + Cómo lo hiciste + Resultado cuantificable**.
- Usa verbos fuertes: Diseñé, Implementé, Optimicé, Reduje, Migré, Lideré.
- Incluye métricas siempre que sea posible (%, tiempos, costos, usuarios).
- Mantén máximo **4-5 bullets** en la experiencia más reciente y **3 bullets** en las demás.
- Prioriza bullets que hagan match directo con los requisitos de la oferta.

### 3. Matching con la oferta laboral
- Analiza los requisitos y responsabilidades de la oferta y prioriza los bullets, skills y tecnologías que hagan match directo.
- Los skills técnicos deben listar **solo** las tecnologías relevantes para la oferta. No incluyas tecnologías que no aporten al match.
- Si la oferta pide una tecnología que no domino profesionalmente pero he practicado por cuenta propia, inclúyela de forma natural en los bullets de mi experiencia más reciente (sin exagerar).
### 4. Estrategia de condensación (para que quepa en 1 página)
- **Educación**: Deja solo 1 entrada (la de mayor peso académico).
- **Leadership**: Elimina esta sección a menos que la oferta busque explícitamente roles de liderazgo o tech lead. Si algún bullet de liderazgo es relevante para la oferta (ej: "code reviews", "mejores prácticas"), muévelo a la sección de experiencia.
- **Experiencia**: Si tuve múltiples roles en la misma empresa, **fusiónalos en un solo bloque** con las fechas combinadas y los mejores bullets seleccionados.
- **Skills**: Condensa al máximo. Solo incluye tecnologías que aparezcan en la oferta o que sean directamente relevantes.
- **Bullets largos**: Recórtalos sin perder el impacto ni las métricas.
### 5. Idioma
- Todo el contenido del CV debe estar en **español**.

---

## Oferta laboral objetivo
```
[AQUI COLOCAS LA OFERTA LABORAL]
```
---
## Tecnologías que NO domino profesionalmente pero he practicado por cuenta propia
> Especifica aquí si hay alguna tecnología de la oferta que quieras incluir aunque no la hayas usado en un trabajo formal. Ejemplo:
>
> - MySQL: Desde que sali del tecnologo no he vuelto a trabajar con DB relacionales sin embargo con 2 dias de entrenamiento ya puedo recordar la sintaxis y los conceptos
> - NextJs: He trabajado con next.js pero solo medio año hace 4 años aproximandamente sin yo dure trabajando con angular(ionic) bastante tiempo entonce nociones, sin embargo no tenga idea de como va las ultimas versiones o no estoy seguro que han sacado de nuevo
> No he trabajado con las siguientes herramientas sin embargo puedo repasar lo teorico para pasar las entrevistas tecnicas: SpringBoot, MemCached, Jenkins(pero si he trabajado con github actions entonces tengo el concepto), GoCD(he trabajado con argo pero no estoy seguro si es lo mismo), Concourse(esto no tengo ni idea)

---

## Output esperado
1. **cv-[empresa]-[rol].json** → El CV en formato JSON listo para usar, que cumpla con el schema y quepa en 1 página.
2. **Tabla de mapping** → Una tabla que muestre cómo cada requisito de la oferta se refleja en el CV generado (Requisito → Dónde se cubre).
```

4. Despues de redactar el Prompt con la oferta y mis debilidades o notas sinceras que necesito que la IA maquille en mi nuevo CV, finalmente envió la petcion a la IA.

5. La IA genera un json como respuesta

6. Este json lo guardo en mi maquina y despues lo importo desde la siguiente pagina web(https://buildresume.work/), esto pagina permite crear un pdf o documento a partir de un json y esta optimizado para seguir buenas practicas de formatos ATS.

Todo este proceso me toma minimo 1h hora de configurar y corregir la nueva CV, adicional tengo que tener una hoja de excel donde apunto los detalles acerca de las postulaciones como(Fecha, Fecha Solicitud, Empresa, Posición, Fuente, Estado, Sueldo,	Fecha Respuesta,	Siguiente Pas,Notas). Todo esto quita tiempo y los procesos son manuales, adicional he encontrado que la IA me genera goals irreales cuando genera la CV sin embargo esto es por culpa de mi experiencia real pero para corregirlo tengo que modificar directamente el json pero esto no es intuitivo.

## Solucion
Necesito crear una plataforma que me permita organizar las diferentes postulaciones esto util para saber:
- Esto permite saber cuando estoy cobrando por cada oferta de trabajo a la que estoy postulando
- Permitir tener un estado por cada postulacion
- Accerder directamente a la CV generada para esa postulacion, esto es util para poder reutilizar CVs, o revisar cuales CVs han generado un impacto
- Tener un pagina donde este centralizada todas postulaciones organizadas por fecha de postulacion
- Esta informacion puede ser editable por ejemplo hoy dije que cobre 5M pero durante la entrevista solo pagan 4M
- Debe tener campos adicionales como beneficios o un raking, esto es util para saber cual empresa me esta ofreciendo mejores condiciones de trabajo o beneficios y esto me ayuda a tomar mejores desiciones

Adicional debe tener una pagina solamente para editar mi experiencia real, esto debe permitir importar el json(cv-experiencia-real.json) soportando el siguiente formaot "json-schema-cv-generator.json" al importar este json debe crear un formulario dinamico para poder editar mi CV y hacer el crud completo, este formulario tiene que permitir ser guardado en la app y tambien exportarlo con el mismo formato.

La app debe debe tener una pagina para postularme a una nueva oferta, esta pagina debe hacer lo mismo que hace prompt anterior, pero debe tener features adiciones para que sea mas diferenciador:
- Antes de generar la CV, la IA debe sugerirle un preview con respecto a los Goals, esto es importante porque actualmente la IA me genera unos goals que no estoy de acuerdo, sin embargo al tener este vista previa, yo puedo desmarcar(check list) de cuales goals no me gusta y al vuelo generar mas goals que hagan match con la oferta que esten relacionados con mi experiencia real o inventar goals que sean creible estas opcion deben estar en el mismo preview.
- Al terminar la CV con el formato "json-schema-cv-generator.json" este contenido debe ser rendirazado en la web para que se vea bonito y agradable al ojo humano.
- Antes de iniciar a generar la CV debe solicitar inforamcion adicional para obtener metadatos y guardar esta oferta para verla en la otra pagina donde esta centralicidad las postulaciones
- La idea debe genera el CV siguiente las mismas recomendaciones


## Feature adicionales
- Debe tener una pagina de settings para configurar que modelo de IA quiere usar, usa los siguientes para el mvp(claude, gpt, gimini, grok, deepseek). Actualizar informacion del perfil(correo, nombre) entre otras cosas.
- La web debe tener un sitema de login con credenciales moqueadas esto importante para publicar el mvp en la web, las credenciales hardcodeadas usando un hash en el correo y en el password usa la libreria crypto-js o similares, esto para que el atacante no puede saber las credenciales hardcodeadas, el correo mio es "cristian.c.romero.p@gmail.com" y el pass "Ajudfn23#"


## Requerimientos no funcionales
- Tiene que soportar dark mode (dark/light) crea una template escalable en TailwindCSS
- Usa Zustand para administrador de estados
- Usa RxDB para implementar un Local-First y tener una base de datos local, esto util para no crear una api que se conecte a motor de DB 
- usa shadcn para la ui con una plantilla custom con una paleta de colores con escala de azules (azul de facebook)
- usa prettier, eslint, y zod
- configura los test con vitest pero no implementes los test solo has la configuracion
- usa las siguiente skills para mejorar la implementacion: (interface-design, vercel-react-best-practices)
